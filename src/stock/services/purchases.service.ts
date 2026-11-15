import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Purchase } from '../schema/purchase.schema';
import { Counter } from '../schema/counter.schema';
import { Product } from '../schema/product.schema';
import { StockMovement } from '../schema/stock-movement.schema';
import { CancelPurchaseDto, CreatePurchaseDto } from '../dto/purchase.dto';

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
    @InjectModel(Counter.name) private counterModel: Model<Counter>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovement>,
    @InjectConnection() private connection: Connection,
  ) {}

  findAll() {
    return this.purchaseModel.find().sort({ createdAt: -1 }).limit(200).lean();
  }

  async findOne(id: string) {
    const purchase = await this.purchaseModel.findById(id).lean();
    if (!purchase) throw new NotFoundException('Achat introuvable');
    return purchase;
  }

  async create(dto: CreatePurchaseDto, requester: { userId: string }) {
    const ids = dto.lignes.map((l) => l.produit);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Un produit apparaît plusieurs fois dans cet achat');
    }

    const date = dto.date ? new Date(dto.date) : new Date();
    const year = date.getFullYear();

    const session = await this.connection.startSession();
    let result: any;
    try {
      await session.withTransaction(async () => {
        const counter = await this.counterModel.findOneAndUpdate(
          { cle: `achat-${year}` },
          { $inc: { seq: 1 } },
          { new: true, upsert: true, session },
        );
        const numero = `ACH-${year}-${String(counter!.seq).padStart(4, '0')}`;
        const fournisseur = dto.fournisseur.trim();

        const lignes: any[] = [];
        for (const l of dto.lignes) {
          // Augmente le stock et met à jour les prix du produit
          const product = await this.productModel.findOneAndUpdate(
            { _id: l.produit },
            { $inc: { stock: l.quantite }, $set: { prixAchat: l.prixAchat, prixVente: l.prixVente } },
            { new: true, session },
          );
          if (!product) throw new NotFoundException('Produit introuvable');

          lignes.push({
            produit: product._id,
            nom: product.nom,
            reference: product.reference,
            quantite: l.quantite,
            prixAchat: l.prixAchat,
            prixVente: l.prixVente,
            total: round2(l.quantite * l.prixAchat),
          });

          await this.movementModel.create(
            [{
              produit: product._id,
              type: 'entree',
              quantite: l.quantite,
              stockApres: product.stock,
              note: `Achat ${numero} (${fournisseur})`,
            }],
            { session },
          );
        }

        const total = round2(lignes.reduce((s, l) => s + l.total, 0));
        const [purchase] = await this.purchaseModel.create(
          [{
            numero,
            fournisseur,
            date,
            lignes,
            total,
            note: dto.note,
            createdBy: new Types.ObjectId(requester.userId),
          }],
          { session },
        );
        result = purchase;
      });
    } finally {
      await session.endSession();
    }
    return result;
  }

  // Annulation : retire les quantités du stock (refusée si une partie est déjà vendue)
  async cancel(id: string, dto: CancelPurchaseDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Identifiant invalide');

    const session = await this.connection.startSession();
    let result: any;
    try {
      await session.withTransaction(async () => {
        const purchase = await this.purchaseModel.findById(id).session(session);
        if (!purchase) throw new NotFoundException('Achat introuvable');
        if (purchase.annulee) throw new BadRequestException('Cet achat est déjà annulé');

        for (const l of purchase.lignes) {
          const product = await this.productModel.findOneAndUpdate(
            { _id: l.produit, stock: { $gte: l.quantite } },
            { $inc: { stock: -l.quantite } },
            { new: true, session },
          );
          if (!product) {
            const exists = await this.productModel.findById(l.produit).session(session);
            if (!exists) continue; // produit supprimé depuis : rien à retirer
            throw new BadRequestException(
              `Annulation impossible : le stock de « ${l.nom} » (${exists.stock}) est inférieur à la quantité achetée (${l.quantite}). Une partie a déjà été vendue.`,
            );
          }

          await this.movementModel.create(
            [{
              produit: product._id,
              type: 'sortie',
              quantite: -l.quantite,
              stockApres: product.stock,
              note: `Annulation achat ${purchase.numero}`,
            }],
            { session },
          );
        }

        purchase.annulee = true;
        purchase.dateAnnulation = new Date();
        purchase.motifAnnulation = dto.motif?.trim() || undefined;
        await purchase.save({ session });
        result = purchase;
      });
    } finally {
      await session.endSession();
    }
    return result;
  }
}