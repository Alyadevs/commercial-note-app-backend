import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  client: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  commercial: Types.ObjectId;

  // Lien optionnel vers le crédit remboursé par ce paiement
  @Prop({ type: Types.ObjectId, ref: 'Credit', required: false })
  credit?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  montant: number;

  @Prop({ enum: ['espece', 'autre'], default: 'espece' })
  methode: string;

  @Prop({ trim: true })
  note?: string;

  @Prop({ default: Date.now })
  date: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
