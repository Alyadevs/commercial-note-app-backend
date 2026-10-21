import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ClientsService } from '../clients/clients.service';
import { CreditsService } from '../credits/credits.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private clientsService: ClientsService,
    private creditsService: CreditsService,
    private activityLogService: ActivityLogService,
  ) {}

  async create(dto: CreatePaymentDto, requester: { userId: string; role: string; nom: string }) {
    const client = await this.clientsService.findOne(dto.clientId, requester);

    const payment = await this.paymentModel.create({
      client: new Types.ObjectId(dto.clientId),
      commercial: new Types.ObjectId(requester.userId),
      credit: dto.creditId ? new Types.ObjectId(dto.creditId) : undefined,
      montant: dto.montant,
      note: dto.note,
    });

    // Le paiement en espèces réduit le solde de crédit du client
    await this.clientsService.ajusterSolde(dto.clientId, -dto.montant);

    if (dto.creditId) {
      await this.creditsService.enregistrerRemboursement(dto.creditId, dto.montant);
    }

    await this.activityLogService.log({
      commercialId: requester.userId,
      commercialNom: requester.nom,
      action: 'PAIEMENT_ENREGISTRE',
      description: `Paiement en espèces de ${dto.montant} reçu de ${client.nom}`,
      entiteId: payment._id.toString(),
      niveau: 'important',
    });

    return payment;
  }

  async findAll(requester: { userId: string; role: string }, filters: { clientId?: string; commercialId?: string }) {
    const query: any = {};
    if (requester.role === 'commercial') query.commercial = requester.userId;
    else if (filters.commercialId) query.commercial = filters.commercialId;
    if (filters.clientId) query.client = filters.clientId;

    return this.paymentModel
      .find(query)
      .populate('client', 'nom telephone')
      .populate('commercial', 'nom email')
      .sort({ createdAt: -1 });
  }
}
