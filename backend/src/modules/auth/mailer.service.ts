import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private createTransport() {
    const host = process.env.SMTP_HOST;
    if (!host) return null;
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
    const from = process.env.SMTP_FROM || 'GameWallet <noreply@gamewallet.local>';
    const transport = this.createTransport();
    if (!transport) {
      this.logger.warn(`[Email not configured — console only]\nTo: ${to}\nSubject: ${subject}\n${text}`);
      return;
    }
    await transport.sendMail({ from, to, subject, text, html: html || text.replace(/\n/g, '<br/>') });
  }
}
