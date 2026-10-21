import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ActivityLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  commercial: Types.ObjectId;

  @Prop({ required: true })
  commercialNom: string;

  // ex: 'CREDIT_CREE', 'PAIEMENT_ENREGISTRE', 'REMISE_ACCORDEE', 'CLIENT_CREE'
  @Prop({ required: true })
  action: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, required: false })
  entiteId?: Types.ObjectId;

  @Prop({ default: 'info' })
  niveau: 'info' | 'important';
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
