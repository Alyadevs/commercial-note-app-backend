import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserRole = 'admin' | 'commercial';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  nom: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['admin', 'commercial'], default: 'commercial' })
  role: UserRole;

  @Prop({ trim: true })
  telephone?: string;

  @Prop()
resetPasswordToken?: string;

@Prop()
resetPasswordExpires?: Date;

  // Infos véhicule (uniquement pertinent pour un commercial)
  @Prop({ type: { marque: String, modele: String, immatriculation: String }, default: null })
  vehicule?: { marque?: string; modele?: string; immatriculation?: string } | null;

  @Prop({ default: true })
  actif: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
