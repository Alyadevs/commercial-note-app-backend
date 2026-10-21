import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Credit extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  client: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  commercial: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  montant: number;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: Date.now })
  dateCredit: Date;

  @Prop()
  dateEcheance?: Date;

  @Prop({ default: 0 })
  montantRembourse: number;

  @Prop({ enum: ['impaye', 'partiel', 'paye'], default: 'impaye' })
  statut: 'impaye' | 'partiel' | 'paye';
}

export const CreditSchema = SchemaFactory.createForClass(Credit);
