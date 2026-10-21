import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Credit } from './schemas/credit.schema';
import { CreateCreditDto } from './dto/create-credit.dto';
import { ClientsService } from '../clients/clients.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CreditsService {
  constructor(
    @InjectModel(Credit.name) private creditModel: Model<Credit>,
    private clientsService: ClientsService,
    private activityLogService: ActivityLogService,
  ) {}

  async create(dto: CreateCreditDto, requester: { userId: string; role: string; nom: string }) {
    // Vérifie que le commercial a bien accès à ce client
    const client = await this.clientsService.findOne(dto.clientId, requester);

    const credit = await this.creditModel.create({
      client: new Types.ObjectId(dto.clientId),
      commercial: new Types.ObjectId(requester.userId),
      montant: dto.montant,
      description: dto.description,
      dateEcheance: dto.dateEcheance,
    });

    // Le crédit augmente le solde que le client doit au commercial
    await this.clientsService.ajusterSolde(dto.clientId, dto.montant);

    await this.activityLogService.log({
      commercialId: requester.userId,
      commercialNom: requester.nom,
      action: 'CREDIT_CREE',
      description: `Crédit de ${dto.montant} accordé à ${client.nom}`,
      entiteId: credit._id.toString(),
      niveau: 'important',
    });

    return credit;
  }

  async findAll(requester: { userId: string; role: string }, filters: { clientId?: string; commercialId?: string; statut?: string }) {
    const query: any = {};
    if (requester.role === 'commercial') query.commercial = requester.userId;
    else if (filters.commercialId) query.commercial = filters.commercialId;

    if (filters.clientId) query.client = filters.clientId;
    if (filters.statut) query.statut = filters.statut;

    return this.creditModel
      .find(query)
      .populate('client', 'nom telephone')
      .populate('commercial', 'nom email')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string, requester: { userId: string; role: string }) {
    const credit = await this.creditModel.findById(id).populate('client').populate('commercial', 'nom email');
    if (!credit) throw new NotFoundException('Crédit introuvable');
    if (requester.role === 'commercial' && credit.commercial._id.toString() !== requester.userId) {
      throw new ForbiddenException("Vous n'avez pas accès à ce crédit");
    }
    return credit;
  }

  // Appelé quand un paiement/remise vient réduire le montant restant du crédit
  async enregistrerRemboursement(creditId: string, montant: number) {
    const credit = await this.creditModel.findById(creditId);
    if (!credit) return;
    credit.montantRembourse += montant;
    credit.statut = credit.montantRembourse >= credit.montant ? 'paye' : 'partiel';
    await credit.save();
  }
}
