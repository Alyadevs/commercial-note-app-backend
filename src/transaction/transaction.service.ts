import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/transaction.dto';
import { ClientsService } from '../clients/clients.service';
import { Credit } from '../credits/schemas/credit.schema';
import { Payment } from 'src/payments/schemas/payment.schema';
import { Remise } from 'src/remises/schemas/remise.schema';
import { Client } from 'src/clients/schemas/client.schema';

@Injectable()
export class TransactionService {
constructor(
  @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  @InjectModel(Credit.name) private creditModel: Model<Credit>,
  @InjectModel(Payment.name) private paymentModel: Model<Payment>,
  @InjectModel(Remise.name) private remiseModel: Model<Remise>,
  @InjectModel(Client.name) private clientModel: Model<Client>,
  private readonly clientsService: ClientsService,
) {}
  async create(
    clientId: string,
    dto: CreateTransactionDto,
    requester: { userId: string; role: string },
  ) {
    if (dto.montant === undefined || dto.montant === null) {
      throw new BadRequestException('Le montant est requis');
    }
    const montant = dto.montant;

   
    const client = await this.clientsService.findOne(clientId, requester);

    const transaction = await this.transactionModel.create({
      client: new Types.ObjectId(clientId),
      commercial: new Types.ObjectId(requester.userId),
      type: dto.type,
      montant,
      description: dto.description,
    });

    const impact = dto.type === TransactionType.CREDIT ? montant : -montant;
    await this.clientsService.ajusterSolde(clientId, impact);

    return transaction;
  }
async findAllForCommercial(commercialId: string) {
  if (!Types.ObjectId.isValid(commercialId)) {
    throw new BadRequestException('Identifiant commercial invalide');
  }

  const clients = await this.clientModel
    .find({ commercial: new Types.ObjectId(commercialId) })
    .select('nom')
    .lean();

  const ids = clients.map((c: any) => c._id);
  const names = new Map(clients.map((c: any) => [c._id.toString(), c.nom]));
  const filter = { client: { $in: ids } };

  const [credits, payments, remises, others] = await Promise.all([
    this.creditModel.find(filter).lean(),
    this.paymentModel.find(filter).lean(),
    this.remiseModel.find(filter).lean(),
    this.transactionModel.find(filter).lean(),
  ]);

  const withClient = (t: any) => ({
    clientId: t.client.toString(),
    clientNom: names.get(t.client.toString()) ?? '—',
  });

  const all = [
    ...credits.map((c: any) => ({
      _id: c._id, type: 'credit', montant: c.montant,
      description: c.description, date: c.dateCredit ?? c.createdAt, ...withClient(c),
    })),
    ...payments.map((p: any) => ({
      _id: p._id, type: 'paiement', montant: p.montant,
      description: p.note, date: p.date ?? p.createdAt, ...withClient(p),
    })),
    ...remises.map((r: any) => ({
      _id: r._id, type: 'remise', montant: r.montant,
      description: r.raison, date: r.date ?? r.createdAt, ...withClient(r),
    })),
    ...others.map((t: any) => ({
      _id: t._id, type: t.type, montant: t.montant,
      description: t.description, date: t.createdAt, ...withClient(t),
    })),
  ];

  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
 async findAllForClient(clientId: string, requester: { userId: string; role: string }) {
    await this.clientsService.findOne(clientId, requester);
    const filter = { client: new Types.ObjectId(clientId) };

    const [credits, payments, remises, others] = await Promise.all([
      this.creditModel.find(filter).lean(),
      this.paymentModel.find(filter).lean(),
      this.remiseModel.find(filter).lean(),
      this.transactionModel.find(filter).lean(),
    ]);

    const all = [
      ...credits.map((c: any) => ({
        _id: c._id, type: 'credit', montant: c.montant,
        description: c.description, date: c.dateCredit ?? c.createdAt,
      })),
      ...payments.map((p: any) => ({
        _id: p._id, type: 'paiement', montant: p.montant,
        description: p.note, date: p.date ?? p.createdAt,
      })),
      ...remises.map((r: any) => ({
        _id: r._id, type: 'remise', montant: r.montant,
        description: r.raison, date: r.date ?? r.createdAt,
      })),
      ...others.map((t: any) => ({
        _id: t._id, type: t.type, montant: t.montant,
        description: t.description, date: t.createdAt,
      })),
    ];

    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async remove(id: string, requester: { userId: string; role: string }) {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) throw new NotFoundException('Transaction introuvable');

    if (!transaction.client || !transaction.commercial || transaction.montant === undefined) {
      throw new BadRequestException('Transaction invalide (données manquantes)');
    }

    const clientId = transaction.client.toString();
    const commercialId = transaction.commercial.toString();
    const montant = transaction.montant;

    if (requester.role === 'commercial' && commercialId !== requester.userId) {
      throw new ForbiddenException("Vous n'avez pas les droits pour effectuer cette action");
    }

    const impact = transaction.type === TransactionType.CREDIT ? -montant : montant;
    await this.clientsService.ajusterSolde(clientId, impact);

    await transaction.deleteOne();
    return { deleted: true };
  }
}