import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// false = le compte doit être activé par un admin avant la première connexion
const AUTO_ACTIVATE = false;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');
    if (!user.actif) throw new UnauthorizedException('Ce compte a été désactivé');

    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const payload = { sub: user._id.toString(), role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        vehicule: user.vehicule,
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Un compte existe déjà avec cet email');

    const hashed = await bcrypt.hash(dto.password, 10);

    // Le rôle est forcé dans createFromRegistration : jamais lu depuis la requête
    await this.usersService.createFromRegistration({
      nom: dto.nom.trim(),
      email,
      telephone: dto.telephone,
      password: hashed,
      
    });

    return {
      message: AUTO_ACTIVATE
        ? 'Compte créé avec succès'
        : "Compte créé. Il sera utilisable après validation par l'administrateur.",
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // Même réponse que l'email existe ou non (évite de révéler quels comptes existent)
    const response = {
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    };

    const user = await this.usersService.findByEmail(dto.email.trim().toLowerCase());
    if (!user || !user.actif) return response;

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
    await this.usersService.setResetToken(user._id.toString(), sha256(token), expires);

    const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

    // TODO production : envoyer ce lien par email.
    // En développement, il s'affiche dans le terminal.
    this.logger.log(`Lien de réinitialisation pour ${user.email} : ${link}`);

    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(sha256(dto.token));
    if (!user) throw new BadRequestException('Lien invalide ou expiré');

    const hashed = await bcrypt.hash(dto.password, 10);
    await this.usersService.updatePassword(user._id.toString(), hashed);

    return { message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' };
  }
}