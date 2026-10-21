import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  CREDIT = 'credit',
  PAIEMENT = 'paiement',
  REMISE = 'remise',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  client?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  commercial?: Types.ObjectId;

  @Prop({ enum: TransactionType, required: true })
  type?: TransactionType;

  @Prop({ required: true, min: 0 })
  montant?: number;

  @Prop()
  description?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);