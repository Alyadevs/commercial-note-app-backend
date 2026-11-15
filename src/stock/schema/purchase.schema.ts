import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class PurchaseLine {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  produit!: Types.ObjectId;

  @Prop({ required: true })
  nom!: string;

  @Prop()
  reference?: string;

  @Prop({ required: true, min: 0 })
  quantite!: number;

  @Prop({ required: true, min: 0 })
  prixAchat!: number;

  @Prop({ required: true, min: 0 })
  prixVente!: number;

  @Prop({ required: true, min: 0 })
  total!: number; // quantite x prixAchat
}
export const PurchaseLineSchema = SchemaFactory.createForClass(PurchaseLine);

@Schema({ timestamps: true })
export class Purchase extends Document {
  @Prop({ required: true, unique: true })
  numero!: string;

  @Prop({ required: true, trim: true })
  fournisseur!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ type: [PurchaseLineSchema], default: [] })
  lignes!: PurchaseLine[];

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop()
  note?: string;

  @Prop({ default: false })
  annulee?: boolean;

  @Prop()
  dateAnnulation?: Date;

  @Prop()
  motifAnnulation?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);