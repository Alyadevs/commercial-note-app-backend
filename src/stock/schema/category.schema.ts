import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, trim: true })
  nom?: string;

  // vide = catégorie principale ; renseigné = sous-catégorie de cette catégorie
  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parent?: Types.ObjectId | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ nom: 1, parent: 1 }, { unique: true });