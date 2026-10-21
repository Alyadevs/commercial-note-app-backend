import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Remise extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  client: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  commercial: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Credit', required: false })
  credit?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  montant: number;

  @Prop({ trim: true })
  raison?: string;

  @Prop({ default: Date.now })
  date: Date;
}

export const RemiseSchema = SchemaFactory.createForClass(Remise);
