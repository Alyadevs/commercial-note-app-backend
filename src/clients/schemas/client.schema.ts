import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Client extends Document {
  @Prop({ required: true, trim: true })
  nom: string;

  @Prop({ trim: true })
  telephone?: string;

  @Prop({ trim: true })
  adresse?: string;

  @Prop({ trim: true })
  notes?: string;

  // Le commercial responsable de ce client
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  commercial: Types.ObjectId;

  // Solde de crédit actuel du client (montant qu'il doit encore)
  @Prop({ default: 0 })
  soldeCredit: number;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
