import { Resend } from 'resend';

let _client: Resend | null = null;

export function getResend(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  _client = new Resend(key);
  return _client;
}

export const EMAIL_FROM = process.env.EMAIL_FROM || 'Elevare Careers <orders@elevarecareer.com>';
export const EMAIL_BCC = process.env.EMAIL_BCC || 'hello@elevarecareer.com';
