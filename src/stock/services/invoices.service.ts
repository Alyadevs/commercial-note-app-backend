import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Invoice } from '../schema/invoice.schema';
import { InvoicePayment } from '../schema/invoice-payment.schema';
import { Counter } from '../schema/counter.schema';
import { Product } from '../schema/product.schema';
import { StockMovement } from '../schema/stock-movement.schema';
import { CommercialStock } from '../schema/commercial-stock.schema';
import { Client } from '../../clients/schemas/client.schema';
import { CancelInvoiceDto, CreateInvoiceDto, PayInvoiceDto } from '../dto/invoice.dto';

const round2 = (n: number) => Math.round(n * 100) / 100;

type Requester = { userId: string; role: string; nom?: string };

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(InvoicePayment.name) private invoicePaymentModel: Model<InvoicePayment>,
    @InjectModel(Counter.name) private counterModel: Model<Counter>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovement>,
    @InjectModel(CommercialStock.name) private commercialStockModel: Model<CommercialStock>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectConnection() private connection: Connection,
  ) {}

  /* ---------- Lecture ---------- */

  async findAll(requester: Requester) {
    const filter: any =
      requester.role === 'commercial' ? { commercial: new Types.ObjectId(requester.userId) } : {};
    const invoices = await this.invoiceModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return this.present(await this.withProfit(invoices), requester);
  }

  async findOne(id: string, requester: Requester) {
    const invoice = await this.invoiceModel.findById(id).lean();
    if (!invoice) throw new NotFoundException('Facture introuvable');
    this.assertAccess(invoice, requester);
    return this.present(await this.withProfit([invoice]), requester)[0];
  }

  // Un commercial n'accède qu'à ses propres factures
  private assertAccess(inv: any, r: Requester) {
    if (r.role === 'commercial' && inv.commercial?.toString() !== r.userId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette facture");
    }
  }

  // Anciennes factures sans bénéfice enregistré : estimation avec le prix d'achat actuel
  private async withProfit(invoices: any[]) {
    const missing = invoices.filter((inv) => inv.benefice === undefined || inv.benefice === null);
    if (missing.length === 0) return invoices;

    const ids = [...new Set(missing.flatMap((inv) => inv.lignes.map((l: any) => l.produit.toString())))];
    const prods = await this.productModel.find({ _id: { $in: ids } }).select('prixAchat').lean();
    const cost = new Map(prods.map((p: any) => [p._id.toString(), p.prixAchat]));

    return invoices.map((inv) => {
      if (inv.benefice !== undefined && inv.benefice !== null) return inv;
      const cout = inv.lignes.reduce(
        (s: number, l: any) => s + (l.prixAchat ?? cost.get(l.produit.toString()) ?? 0) * l.quantite,
        0,
      );
      return { ...inv, benefice: round2(inv.total - cout), beneficeEstime: true };
    });
  }

  // Montant payé, reste à payer et statut (calculés, jamais stockés)
  private withPayment(invoices: any[]) {
    return invoices.map((inv) => {
      const paye = round2(inv.montantPaye ?? 0);
      if (inv.annulee) return { ...inv, montantPaye: paye, reste: 0, statut: 'annulee' };
      const reste = round2(Math.max(0, inv.total - paye));
      const statut = reste <= 0 ? 'payee' : paye > 0 ? 'partielle' : 'impayee';
      return { ...inv, montantPaye: paye, reste, statut };
    });
  }

  // Le commercial ne reçoit ni bénéfice ni prix d'achat
  private present(invoices: any[], r: Requester) {
    const list = this.withPayment(invoices);
    if (r.role !== 'commercial') return list;
    return list.map(({ benefice, beneficeEstime, ...inv }: any) => ({
      ...inv,
      lignes: inv.lignes.map(({ prixAchat, ...l }: any) => l),
    }));
  }

  /* ---------- Création ---------- */

  async create(dto: CreateInvoiceDto, requester: Requester) {
    const isCommercial = requester.role === 'commercial';

    // Regroupe les lignes qui concernent le même produit
    const merged = new Map<string, { quantite: number; prixUnitaire?: number }>();
    for (const l of dto.lignes) {
      const cur = merged.get(l.produit);
      if (cur) cur.quantite += l.quantite;
      else merged.set(l.produit, { quantite: l.quantite, prixUnitaire: l.prixUnitaire });
    }

    let clientId: Types.ObjectId | null = dto.client ? new Types.ObjectId(dto.client) : null;
    let clientNom = dto.clientNom.trim();

    // Un commercial ne facture que ses propres clients
    if (isCommercial) {
      if (!dto.client) throw new BadRequestException('Choisissez un de vos clients');
      const client = await this.clientModel.findById(dto.client);
      if (!client || client.commercial?.toString() !== requester.userId) {
        throw new ForbiddenException('Ce client ne fait pas partie de vos clients');
      }
      clientId = client._id as Types.ObjectId;
      clientNom = client.nom;
    }

    const commercialId = isCommercial ? new Types.ObjectId(requester.userId) : null;
    const date = dto.date ? new Date(dto.date) : new Date();
    const year = date.getFullYear();

    const session = await this.connection.startSession();
    let result: any;
    try {
      await session.withTransaction(async () => {
        const counter = await this.counterModel.findOneAndUpdate(
          { cle: `facture-${year}` },
          { $inc: { seq: 1 } },
          { new: true, upsert: true, session },
        );
        const numero = `FAC-${year}-${String(counter!.seq).padStart(4, '0')}`;

        const lignes: any[] = [];
        for (const [produitId, l] of merged) {
          let product: any;

          if (isCommercial) {
            // Diminue le stock DU COMMERCIAL, seulement s'il est suffisant
            const row = await this.commercialStockModel.findOneAndUpdate(
              { commercial: commercialId, produit: new Types.ObjectId(produitId), quantite: { $gte: l.quantite } },
              { $inc: { quantite: -l.quantite } },
              { new: true, session },
            );
            product = await this.productModel.findById(produitId).session(session);
            if (!product) throw new NotFoundException('Produit introuvable');
            if (!row) {
              const cur = await this.commercialStockModel
                .findOne({ commercial: commercialId, produit: product._id })
                .session(session);
              throw new BadRequestException(
                `Stock insuffisant pour « ${product.nom} » (votre stock : ${cur?.quantite ?? 0})`,
              );
            }
          } else {
            // Diminue le stock principal, seulement s'il est suffisant
            product = await this.productModel.findOneAndUpdate(
              { _id: produitId, stock: { $gte: l.quantite } },
              { $inc: { stock: -l.quantite } },
              { new: true, session },
            );
            if (!product) {
              const p = await this.productModel.findById(produitId).session(session);
              throw p
                ? new BadRequestException(`Stock insuffisant pour « ${p.nom} » (disponible : ${p.stock})`)
                : new NotFoundException('Produit introuvable');
            }
            await this.movementModel.create(
              [{
                produit: product._id,
                type: 'sortie',
                quantite: -l.quantite,
                stockApres: product.stock,
                note: `Facture ${numero}`,
              }],
              { session },
            );
          }

          // Un commercial vend toujours au prix de vente du produit
          const prix = isCommercial ? product.prixVente : (l.prixUnitaire ?? product.prixVente);
          lignes.push({
            produit: product._id,
            nom: product.nom,
            reference: product.reference,
            quantite: l.quantite,
            prixUnitaire: prix,
            prixAchat: product.prixAchat,
            total: round2(prix * l.quantite),
          });
        }

        const sousTotal = round2(lignes.reduce((s, l) => s + l.total, 0));

        // Pas de remise pour un commercial
        const remiseType = isCommercial ? undefined : dto.remiseType;
        const remiseValeur = isCommercial ? 0 : dto.remiseValeur ?? 0;

        let remise = 0;
        if (remiseValeur > 0) {
          if (remiseType === 'pourcentage') {
            if (remiseValeur > 100) throw new BadRequestException('La remise ne peut pas dépasser 100 %');
            remise = round2((sousTotal * remiseValeur) / 100);
          } else {
            if (remiseValeur > sousTotal) throw new BadRequestException('La remise dépasse le total de la facture');
            remise = round2(remiseValeur);
          }
        }
        const total = round2(sousTotal - remise);
        const cout = lignes.reduce((s, l) => s + (l.prixAchat ?? 0) * l.quantite, 0);

        const [invoice] = await this.invoiceModel.create(
          [{
            numero,
            client: clientId,
            clientNom,
            commercial: commercialId,
            commercialNom: isCommercial ? requester.nom : undefined,
            date,
            lignes,
            sousTotal,
            remise,
            remiseType: remise > 0 ? remiseType : undefined,
            remiseValeur: remise > 0 ? remiseValeur : undefined,
            total,
            benefice: round2(total - cout),
            note: dto.note,
            createdBy: new Types.ObjectId(requester.userId),
          }],
          { session },
        );
        result = invoice.toObject();
      });
    } finally {
      await session.endSession();
    }
    return this.present([result], requester)[0];
  }

  /* ---------- Paiements ---------- */

  async pay(id: string, dto: PayInvoiceDto, requester: Requester) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Identifiant invalide');

    const session = await this.connection.startSession();
    let result: any;
    try {
      await session.withTransaction(async () => {
        const invoice = await this.invoiceModel.findById(id).session(session);
        if (!invoice) throw new NotFoundException('Facture introuvable');
        this.assertAccess(invoice, requester);
        if (invoice.annulee) throw new BadRequestException('Facture annulée : paiement impossible');

        const paye = round2(invoice.montantPaye ?? 0);
        const reste = round2(invoice.total - paye);
        if (reste <= 0) throw new BadRequestException('Cette facture est déjà payée');

        const montant = round2(dto.montant);
        if (montant <= 0) throw new BadRequestException('Montant invalide');
        if (montant > reste) {
          throw new BadRequestException(`Le montant dépasse le reste à payer (${reste.toFixed(2)})`);
        }

        const nouveauPaye = round2(paye + montant);
        await this.invoiceModel.updateOne({ _id: id }, { $set: { montantPaye: nouveauPaye } }, { session });

        const [paiement] = await this.invoicePaymentModel.create(
          [{
            facture: invoice._id,
            numero: invoice.numero,
            clientNom: invoice.clientNom,
            montant,
            mode: dto.mode || 'especes',
            date: dto.date ? new Date(dto.date) : new Date(),
            note: dto.note,
            createdBy: new Types.ObjectId(requester.userId),
          }],
          { session },
        );

        const resteApres = round2(invoice.total - nouveauPaye);
        result = {
          montantPaye: nouveauPaye,
          reste: resteApres,
          statut: resteApres <= 0 ? 'payee' : 'partielle',
          paiement,
        };
      });
    } finally {
      await session.endSession();
    }
    return result;
  }

  async payments(id: string, requester: Requester) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Identifiant invalide');
    const inv = await this.invoiceModel.findById(id).select('commercial').lean();
    if (!inv) throw new NotFoundException('Facture introuvable');
    this.assertAccess(inv, requester);

    return this.invoicePaymentModel
      .find({ facture: new Types.ObjectId(id) })
      .sort({ date: -1, createdAt: -1 })
      .lean();
  }

  /* ---------- Annulation ---------- */

  async cancel(id: string, dto: CancelInvoiceDto, requester: Requester) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Identifiant invalide');

    const session = await this.connection.startSession();
    let result: any;
    try {
      await session.withTransaction(async () => {
        const invoice = await this.invoiceModel.findById(id).session(session);
        if (!invoice) throw new NotFoundException('Facture introuvable');
        this.assertAccess(invoice, requester);
        if (invoice.annulee) throw new BadRequestException('Cette facture est déjà annulée');
        if ((invoice.montantPaye ?? 0) > 0) {
          throw new BadRequestException(
            'Des paiements sont enregistrés sur cette facture : elle ne peut pas être annulée.',
          );
        }

        for (const l of invoice.lignes) {
          if (invoice.commercial) {
            // Facture d'un commercial : les quantités retournent dans SON stock
            await this.commercialStockModel.findOneAndUpdate(
              { commercial: invoice.commercial, produit: l.produit },
              { $inc: { quantite: l.quantite } },
              { upsert: true, session },
            );
          } else {
            // Facture du stock principal
            const product = await this.productModel.findByIdAndUpdate(
              l.produit,
              { $inc: { stock: l.quantite } },
              { new: true, session },
            );
            if (!product) continue; // produit supprimé depuis
            await this.movementModel.create(
              [{
                produit: product._id,
                type: 'entree',
                quantite: l.quantite,
                stockApres: product.stock,
                note: `Annulation facture ${invoice.numero}`,
              }],
              { session },
            );
          }
        }

        invoice.annulee = true;
        invoice.dateAnnulation = new Date();
        invoice.motifAnnulation = dto.motif?.trim() || undefined;
        invoice.annuleePar = new Types.ObjectId(requester.userId);
        await invoice.save({ session });
        result = invoice.toObject();
      });
    } finally {
      await session.endSession();
    }
    return this.present(await this.withProfit([result]), requester)[0];
  }
}