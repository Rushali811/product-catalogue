/**
 * Port for sending transactional email.
 * The brief explicitly flags the email provider as "expected to change", so the
 * route depends on this interface, not a concrete library.
 */
export interface EmailMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
