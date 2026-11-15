import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      });
    } else {
      this.logger.warn('MAIL_USER / MAIL_PASS absents : les emails ne seront pas envoyés (lien affiché dans les logs).');
    }
  }

  async sendPasswordReset(to: string, link: string) {
    if (!this.transporter) {
      this.logger.log(`[dev] Lien de réinitialisation pour ${to} : ${link}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to,
      subject: 'Réinitialisation de votre mot de passe',
      text:
        `Vous avez demandé la réinitialisation de votre mot de passe.\n\n` +
        `Cliquez sur ce lien (valable 1 heure) :\n${link}\n\n` +
        `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1f2937">
          <h2 style="color:#1d4ed8;margin-bottom:8px">Réinitialisation du mot de passe</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#1d4ed8;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">
              Choisir un nouveau mot de passe
            </a>
          </p>
          <p style="font-size:13px;color:#6b7280">Ce lien est valable 1 heure. Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br>${link}</p>
          <p style="font-size:13px;color:#6b7280">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
        </div>`,
    });
  }
}
