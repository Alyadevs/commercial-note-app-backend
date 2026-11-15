import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class StockMovement extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  produit?: Types.ObjectId;

  @Prop({ enum: ['entree', 'sortie'], required: true })
  type?: 'entree' | 'sortie';

  // Variation signée : +10 (entrée) ou -3 (sortie)
  @Prop({ required: true })
  quantite?: number;
  
  @Prop({ required: true })
  stockApres?: number;

  @Prop()
  note?: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);