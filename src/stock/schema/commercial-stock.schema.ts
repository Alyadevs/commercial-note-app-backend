import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class CommercialStock extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  commercial!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  produit!: Types.ObjectId;

  @Prop({ required: true, min: 0, default: 0 })
  quantite!: number;
}

export const CommercialStockSchema = SchemaFactory.createForClass(CommercialStock);
// Une seule ligne par couple commercial / produit
CommercialStockSchema.index({ commercial: 1, produit: 1 }, { unique: true });