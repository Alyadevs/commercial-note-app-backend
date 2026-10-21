import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Remise } from './schemas/remise.schema';
import { CreateRemiseDto } from './dto/create-remise.dto';
import { ClientsService } from '../clients/clients.service';
import { CreditsService } from '../credits/credits.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class RemisesService {
  constructor(
    @InjectModel(Remise.name) private remiseModel: Model<Remise>,
    private clientsService: ClientsService,
    private creditsService: CreditsService,
    private activityLogService: ActivityLogService,
  ) {}

  async create(dto: CreateRemiseDto, requester: { userId: string; role: string; nom: string }) {
    const client = await this.clientsService.findOne(dto.clientId, requester);

    const remise = await this.remiseModel.create({
      client: new Types.ObjectId(dto.clientId),
      commercial: new Types.ObjectId(requester.userId),
      credit: dto.creditId ? new Types.ObjectId(dto.creditId) : undefined,
      montant: dto.montant,
      raison: dto.raison,
    });

    // La remise réduit aussi ce que le client doit
    await this.clientsService.ajusterSolde(dto.clientId, -dto.montant);
    if (dto.creditId) {
      await this.creditsService.enregistrerRemboursement(dto.creditId, dto.montant);
    }

    // Action sensible : marquée "importante" pour que l'admin la voie en priorité
    await this.activityLogService.log({
      commercialId: requester.userId,
      commercialNom: requester.nom,
      action: 'REMISE_ACCORDEE',
      description: `Remise de ${dto.montant} accordée à ${client.nom}${dto.raison ? ' — ' + dto.raison : ''}`,
      entiteId: remise._id.toString(),
      niveau: 'important',
    });

    return remise;
  }

  async findAll(requester: { userId: string; role: string }, filters: { clientId?: string; commercialId?: string }) {
    const query: any = {};
    if (requester.role === 'commercial') query.commercial = requester.userId;
    else if (filters.commercialId) query.commercial = filters.commercialId;
    if (filters.clientId) query.client = filters.clientId;

    return this.remiseModel
      .find(query)
      .populate('client', 'nom telephone')
      .populate('commercial', 'nom email')
      .sort({ createdAt: -1 });
  }
}
