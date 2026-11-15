import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class TransferLine {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  produit!: Types.ObjectId;

  @Prop({ required: true })
  nom!: string;

  @Prop()
  reference?: string;

  @Prop({ required: true, min: 0 })
  quantite!: number;
}
export const TransferLineSchema = SchemaFactory.createForClass(TransferLine);

@Schema({ timestamps: true })
export class Transfer extends Document {
  @Prop({ required: true, unique: true })
  numero!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  commercial!: Types.ObjectId;

  @Prop({ required: true })
  commercialNom!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ type: [TransferLineSchema], default: [] })
  lignes!: TransferLine[];

  @Prop()
  note?: string;

  @Prop({ default: false })
  annule?: boolean;

  @Prop()
  dateAnnulation?: Date;

  @Prop()
  motifAnnulation?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);