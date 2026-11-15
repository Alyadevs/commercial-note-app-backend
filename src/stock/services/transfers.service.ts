import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Transfer } from '../schema/transfer.schema';
import { CommercialStock } from '../schema/commercial-stock.schema';
import { Counter } from '../schema/counter.schema';
import { Product } from '../schema/product.schema';
import { StockMovement } from '../schema/stock-movement.schema';
import { User } from '../../users/schemas/user.schema';
import { CancelTransferDto, CreateTransferDto } from '../dto/transfer.dto';

@Injectable()
export class TransfersService {
  constructor(
    @InjectModel(Transfer.name) private transferModel: Model<Transfer>,
    @InjectModel(CommercialStock.name) private commercialStockModel: Model<CommercialStock>,
    @InjectModel(Counter.name) private counterModel: Model<Counter>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovement>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectConnection() private connection: Connection,
  ) {}

  findAll() {
    return this.transferModel.find().sort({ createdAt: -1 }).limit(200).lean();
  }

  async findOne(id: string) {
    const t = await this.transferModel.findById(id).lean();
    if (!t) throw new NotFoundException('Transfert introuvable');
    return t;
  }

  // Stock actuel des commerciaux (lignes à quantité positive)
  stock() {
    return this.commercialStockModel
      .find({ quantite: { $gt: 0 } })
      .populate('produit', 'nom reference prixAchat prixVente')
      .populate('commercial', 'nom')
      .lean();
  }

  async create(dto: CreateTransferDto, requester: { userId: string }) {
    const ids = dto.lignes.map((l) => l.produit);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Un produit apparaît plusieurs fois dans ce transfert');
    }

    const commercial = await this.userModel.findById(dto.commercial);
    if (!commercial || commercial.role !== 'commercial') throw new BadRequestException('Commercial invalide');
    if (!commercial.actif) throw new BadRequestException('Ce commercial est désactivé');

    const date = dto.date ? new Date(dto.date) : new Date();
    const year = date.getFullYear();

    const session = await this.connection.startSession();
    let result: any;
    try {
      await session.withTransaction(async () => {
        const counter = await this.counterModel.findOneAndUpdate(
          { cle: `transfert-${year}` },
          { $inc: { seq: 1 } },
          { new: true, upsert: true, session },
        );
        const numero = `TRF-${year}-${String(counter!.seq).padStart(4, '0')}`;

        const lignes: any[] = [];
        for (const l of dto.lignes) {
          // Retire du stock principal seulement s'il est suffisant
          const product = await this.productModel.findOneAndUpdate(
            { _id: l.produit, stock: { $gte: l.quantite } },
            { $inc: { stock: -l.quantite } },
            { new: true, session },
          );
          if (!product) {
            const p = await this.productModel.findById(l.produit).session(session);
            throw p
              ? new BadRequestException(`Stock insuffisant pour « ${p.nom} » (disponible : ${p.stock})`)
              : new NotFoundException('Produit introuvable');
          }

          // Ajoute au stock du commercial
          await this.commercialStockModel.findOneAndUpdate(
            { commercial: commercial._id, produit: product._id },
            { $inc: { quantite: l.quantite } },
            { upsert: true, session },
          );

          await this.movementModel.create(
            [{
              produit: product._id,
              type: 'sortie',
              quantite: -l.quantite,
              stockApres: product.stock,
              note: `Transfert ${numero} vers ${commercial.nom}`,
            }],
            { session },
          );

          lignes.push({ produit: product._id, nom: product.nom, reference: product.reference, quantite: l.quantite });
        }

        const [transfer] = await this.transferModel.create(
          [{
            numero,
            commercial: commercial._id,
            commercialNom: commercial.nom,
            date,
            lignes,
            note: dto.note,
            createdBy: new Types.ObjectId(requester.userId),
          }],
          { session },
        );
        result = transfer;
      });
    } finally {
      await session.endSession();
    }
    return result;
  }
  async myStock(userId: string) {
  const rows = await this.commercialStockModel
    .find({ commercial: new Types.ObjectId(userId), quantite: { $gt: 0 } })
    .populate('produit', 'nom reference prixVente')
    .lean();

  return rows
    .filter((r: any) => r.produit)
    .map((r: any) => ({
      produit: r.produit._id,
      nom: r.produit.nom,
      reference: r.produit.reference,
      prixVente: r.produit.prixVente,
      quantite: r.quantite,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom));
}

  // Annulation : le commercial rend les produits au stock principal
  async cancel(id: string, dto: CancelTransferDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Identifiant invalide');

    const session = await this.connection.startSession();
    let result: any;
    try {
      await session.withTransaction(async () => {
        const transfer = await this.transferModel.findById(id).session(session);
        if (!transfer) throw new NotFoundException('Transfert introuvable');
        if (transfer.annule) throw new BadRequestException('Ce transfert est déjà annulé');

        for (const l of transfer.lignes) {
          // Retire du stock du commercial seulement s'il en a assez
          const row = await this.commercialStockModel.findOneAndUpdate(
            { commercial: transfer.commercial, produit: l.produit, quantite: { $gte: l.quantite } },
            { $inc: { quantite: -l.quantite } },
            { new: true, session },
          );
          if (!row) {
            const cur = await this.commercialStockModel
              .findOne({ commercial: transfer.commercial, produit: l.produit })
              .session(session);
            throw new BadRequestException(
              `Annulation impossible : ${transfer.commercialNom} n'a plus que ${cur?.quantite ?? 0} « ${l.nom} » (transférés : ${l.quantite}).`,
            );
          }

          // Remet au stock principal (si le produit existe encore)
          const product = await this.productModel.findByIdAndUpdate(
            l.produit,
            { $inc: { stock: l.quantite } },
            { new: true, session },
          );
          if (product) {
            await this.movementModel.create(
              [{
                produit: product._id,
                type: 'entree',
                quantite: l.quantite,
                stockApres: product.stock,
                note: `Annulation transfert ${transfer.numero}`,
              }],
              { session },
            );
          }
        }

        transfer.annule = true;
        transfer.dateAnnulation = new Date();
        transfer.motifAnnulation = dto.motif?.trim() || undefined;
        await transfer.save({ session });
        result = transfer;
      });
    } finally {
      await session.endSession();
    }
    return result;
  }
}