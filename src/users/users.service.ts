import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async ensureDefaultAdmin(email: string, password: string) {
    const adminExists = await this.userModel.findOne({ role: 'admin' });
    if (!adminExists) {
      const hash = await bcrypt.hash(password, 10);
      await this.userModel.create({
        nom: 'Administrateur',
        email: email.toLowerCase(),
        password: hash,
        role: 'admin',
      });
      console.log(`Compte admin créé par défaut -> email: ${email} / mot de passe: ${password}`);
    }
  }

  async create(dto: CreateUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Un utilisateur avec cet email existe déjà');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({ ...dto, email: dto.email.toLowerCase(), password: hash });
    return this.sanitize(user);
  }

  async findAll(role?: string) {
    const filter = role ? { role } : {};
    const users = await this.userModel.find(filter).select('-password').sort({ createdAt: -1 });
    return users;
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).select('-password');
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async setActive(id: string, actif: boolean) {
    const user = await this.userModel.findByIdAndUpdate(id, { actif }, { new: true }).select('-password');
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async remove(id: string) {
    const res = await this.userModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Utilisateur introuvable');
    return { deleted: true };
  }

  private sanitize(user: User) {
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }

  /* ---------- Inscription publique et réinitialisation du mot de passe ---------- */

  // Le mot de passe arrive déjà haché depuis AuthService
  async createFromRegistration(data: {
    nom: string;
    email: string;
    telephone?: string;
    password: string;
   
  }) {
    return this.userModel.create({
      ...data,
      role: 'admin', // forcé ici, jamais lu depuis la requête
    });
  }

  async setResetToken(userId: string, hashedToken: string, expires: Date) {
    await this.userModel.updateOne(
      { _id: userId },
      { resetPasswordToken: hashedToken, resetPasswordExpires: expires },
    );
  }

  async findByResetToken(hashedToken: string) {
    return this.userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { password: hashedPassword, $unset: { resetPasswordToken: '', resetPasswordExpires: '' } },
    );
  }
}