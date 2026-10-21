import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog } from './schemas/activity-log.schema';

@Injectable()
export class ActivityLogService {
  constructor(@InjectModel(ActivityLog.name) private logModel: Model<ActivityLog>) {}

  async log(params: {
    commercialId: string;
    commercialNom: string;
    action: string;
    description: string;
    entiteId?: string;
    niveau?: 'info' | 'important';
  }) {
    return this.logModel.create({
      commercial: new Types.ObjectId(params.commercialId),
      commercialNom: params.commercialNom,
      action: params.action,
      description: params.description,
      entiteId: params.entiteId ? new Types.ObjectId(params.entiteId) : undefined,
      niveau: params.niveau || 'info',
    });
  }

  async findAll(filters: { commercialId?: string; limit?: number }) {
  const query: any = {};
  if (filters.commercialId) query.commercial = filters.commercialId;

  console.log('=== DEBUG findAll ===');
  console.log('filters reçus:', filters);
  console.log('query construite:', query);

  const results = await this.logModel
    .find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 200);

  console.log('nombre de résultats:', results.length);
  return results;
}
  async findByCommercialId(commercialId: string, limit?: number) {
  if (!Types.ObjectId.isValid(commercialId)) {
    throw new Error('Invalid commercialId');
  }

  return this.logModel
    .find({ commercial: new Types.ObjectId(commercialId) })
    .sort({ createdAt: -1 })
    .limit(limit || 200);
}
}
