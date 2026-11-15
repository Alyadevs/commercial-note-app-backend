import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class InvoicePayment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Invoice', required: true, index: true })
  facture!: Types.ObjectId;

  // Copies pour pouvoir lister les paiements sans recharger la facture
  @Prop({ required: true })
  numero!: string;

  @Prop({ required: true })
  clientNom!: string;

  @Prop({ required: true, min: 0.01 })
  montant!: number;

  @Prop({ enum: ['especes', 'cheque', 'virement', 'autre'], default: 'especes' })
  mode!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop()
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const InvoicePaymentSchema = SchemaFactory.createForClass(InvoicePayment);