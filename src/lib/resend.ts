import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Elevare Careers <orders@elevarecareer.com>';
export const EMAIL_BCC = process.env.EMAIL_BCC || 'hello@elevarecareer.com';
