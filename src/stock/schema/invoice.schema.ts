import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class InvoiceLine {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  produit!: Types.ObjectId;

  // Copie du nom et du prix au moment de la facture (ils ne changent plus après)
  @Prop({ required: true })
  nom!: string;

  @Prop()
  reference?: string;

  @Prop({ required: true, min: 0 })
  quantite!: number;

  @Prop({ required: true, min: 0 })
  prixUnitaire!: number;

  @Prop({ required: true, min: 0 })
  total!: number;
  @Prop({ min: 0 })
prixAchat?: number;
}
export const InvoiceLineSchema = SchemaFactory.createForClass(InvoiceLine);

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ required: true, unique: true })
  numero!: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', default: null })
  client?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  clientNom!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ type: [InvoiceLineSchema], default: [] })
  lignes!: InvoiceLine[];

  @Prop({ required: true, min: 0 })
  total!: number;
  @Prop()
sousTotal?: number;

@Prop({ default: 0 })
remise?: number; // montant de la remise, déjà calculé

@Prop()
remiseType?: string;

@Prop()
remiseValeur?: number;

  @Prop()
  note?: string;

  @Prop({ default: 0, min: 0 })
  montantPaye?: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
  @Prop()
  benefice?: number;
  @Prop({ default: false })
annulee?: boolean;

@Prop()
dateAnnulation?: Date;

@Prop()
motifAnnulation?: string;

@Prop({ type: Types.ObjectId, ref: 'User' })
annuleePar?: Types.ObjectId;
@Prop({ type: Types.ObjectId, ref: 'User', default: null })
commercial?: Types.ObjectId | null; // null = vendu depuis le stock principal

@Prop()
commercialNom?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);