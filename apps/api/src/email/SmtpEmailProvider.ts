import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailMessage, EmailProvider } from './EmailProvider.js';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
}

/**
 * Generic SMTP provider. In dev this points at MailHog; in prod it would point
 * at SES SMTP, SendGrid SMTP, Mailgun, etc. — swapping the provider is a config
 * change only.
 */
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;

  constructor(opts: SmtpOptions, transporter?: Transporter) {
    this.transporter =
      transporter ??
      nodemailer.createTransport({
        host: opts.host,
        port: opts.port,
        secure: opts.secure,
        auth: opts.auth,
      });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: message.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
