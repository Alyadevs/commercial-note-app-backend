import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client } from './schemas/client.schema';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(@InjectModel(Client.name) private clientModel: Model<Client>) {}

async create(dto: CreateClientDto, requester: { userId: string; role: string }) {
  // L'admin choisit le commercial (ou aucun) ; un commercial est toujours rattaché à lui-même
  const commercialId = requester.role === 'admin' ? dto.commercialId || null : requester.userId;

  // Un commercial ne doit pas recréer un client qui existe déjà
 if (requester.role === 'commercial') {
  const tel = (dto.telephone || '').replace(/\D/g, '');
  if (tel.length >= 6) {
    const others: any[] = await this.clientModel
      .find({ telephone: { $exists: true, $ne: '' } })
      .select('telephone commercial')
      .populate('commercial', 'role')
      .lean();
    const dup = others.find((o) => (o.telephone || '').replace(/\D/g, '') === tel);
    if (dup) {
      const free = !dup.commercial || dup.commercial.role === 'admin';
      throw new ConflictException(
        free
          ? 'Un client avec ce numéro existe déjà : choisissez-le dans la liste.'
          : 'Un client avec ce numéro existe déjà.',
      );
    }
  }
}

  return this.clientModel.create({
    nom: dto.nom,
    telephone: dto.telephone,
    adresse: dto.adresse,
    notes: dto.notes,
    commercial: commercialId ? new Types.ObjectId(commercialId) : null,
  });
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

  const { commercialId, ...rest } = dto;
  Object.assign(client, rest);

  // Seul l'admin peut réaffecter un client (ou le mettre sans commercial)
  if (requester.role === 'admin' && commercialId !== undefined) {
    client.commercial = commercialId ? new Types.ObjectId(commercialId) : null;
  }

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
// Clients disponibles : sans commercial, ou rattachés à un compte admin
async findAvailable() {
  const clients: any[] = await this.clientModel
    .find()
    .select('nom telephone adresse commercial')
    .populate('commercial', 'role')
    .sort({ nom: 1 })
    .lean();

  return clients
    .filter((c) => !c.commercial || c.commercial.role === 'admin')
    .map(({ commercial, ...rest }) => rest);
}

// Le commercial choisit un client disponible : il lui est rattaché
async claim(id: string, requester: { userId: string; role: string }) {
  if (requester.role !== 'commercial') throw new ForbiddenException('Réservé aux commerciaux');
  if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Identifiant invalide');

  const existing: any = await this.clientModel.findById(id).populate('commercial', 'role');
  if (!existing) throw new NotFoundException('Client introuvable');

  const current = existing.commercial;
  if (current && current.role !== 'admin') {
    throw new ConflictException('Ce client est déjà attribué à un commercial');
  }

  // Atomique : réussit seulement si le propriétaire n'a pas changé entre-temps
  const updated = await this.clientModel.findOneAndUpdate(
    { _id: id, commercial: current ? current._id : null },
    { $set: { commercial: new Types.ObjectId(requester.userId) } },
    { new: true },
  );
  if (!updated) throw new ConflictException('Ce client vient d\'être attribué à un autre commercial');
  return updated;
}
}