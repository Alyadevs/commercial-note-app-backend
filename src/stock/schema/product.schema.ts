import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, trim: true })
  nom?: string;

  @Prop({ trim: true })
  reference?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categorie?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  sousCategorie?: Types.ObjectId | null;

  @Prop({ required: true, min: 0, default: 0 })
  prixAchat?: number;

  @Prop({ required: true, min: 0, default: 0 })
  prixVente?: number;

  @Prop({ default: 0, min: 0 })
  stock?: number;

  // En dessous de ce seuil, le produit est signalé "stock faible"
  @Prop({ default: 5, min: 0 })
  seuilAlerte?: number;
  @Prop({ type: String, default: null })
  image?: string | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);