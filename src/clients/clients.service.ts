import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client } from './schemas/client.schema';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(@InjectModel(Client.name) private clientModel: Model<Client>) {}

async create(dto: CreateClientDto, requester: { userId: string; role: string }) {
  const commercialId = requester.role === 'admin' && dto.commercialId ? dto.commercialId : requester.userId;
  console.log('=== DIAGNOSTIC create ===');
  console.log('requester.userId:', requester.userId);
  console.log('requester.role:', requester.role);
  console.log('dto.commercialId:', dto.commercialId);
  console.log('commercialId utilisé:', commercialId);
  const created = await this.clientModel.create({
    nom: dto.nom,
    telephone: dto.telephone,
    adresse: dto.adresse,
    notes: dto.notes,
    commercial: new Types.ObjectId(commercialId),
  });
  console.log('client créé, commercial stocké:', created.commercial);
  console.log('===========================');
  return created;
}

  // Un commercial ne voit que ses clients ; l'admin voit tout (ou filtre par commercial)
async findAll(requester: { userId: string; role: string }, commercialId?: string) {
  const filter: any = {};
  if (requester.role === 'commercial') {
    filter.commercial = new Types.ObjectId(requester.userId);
  } else if (commercialId) {
    filter.commercial = new Types.ObjectId(commercialId);
  }
  console.log('=== DIAGNOSTIC findAll ===');
  console.log('filter (typeof commercial):', typeof filter.commercial, filter.commercial);
  const results = await this.clientModel.find(filter).populate('commercial', 'nom email').sort({ createdAt: -1 });
  console.log('nombre de résultats trouvés:', results.length);
  console.log('===========================');
  return results;
}

  async findOne(id: string, requester: { userId: string; role: string }) {
    const client = await this.clientModel.findById(id).populate('commercial', 'nom email');
    if (!client) throw new NotFoundException('Client introuvable');
    this.checkAccess(client, requester);
    return client;
  }

  async update(id: string, dto: Partial<CreateClientDto>, requester: { userId: string; role: string }) {
    const client = await this.clientModel.findById(id);
    if (!client) throw new NotFoundException('Client introuvable');
    this.checkAccess(client, requester);
    Object.assign(client, dto);
    await client.save();
    return client;
  }

  async remove(id: string, requester: { userId: string; role: string }) {
    const client = await this.clientModel.findById(id);
    if (!client) throw new NotFoundException('Client introuvable');
    this.checkAccess(client, requester);
    await client.deleteOne();
    return { deleted: true };
  }

  // Ajuste le solde de crédit d'un client (utilisé par credits/payments/remises)
  async ajusterSolde(clientId: string, montant: number) {
    await this.clientModel.findByIdAndUpdate(clientId, { $inc: { soldeCredit: montant } });
  }

 private checkAccess(client: Client, requester: { userId: string; role: string }) {
  const commercialId = (client.commercial as any)?._id
    ? (client.commercial as any)._id.toString()
    : client.commercial?.toString();

  if (requester.role === 'commercial' && commercialId !== requester.userId) {
    throw new ForbiddenException("Vous n'avez pas les droits pour effectuer cette action");
  }
}
}