import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? 'Sportlive <noreply@sportlive.uz>';
const SMTP_SECURE = (process.env.SMTP_SECURE ?? 'auto').toLowerCase();

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'SMTP credentials missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in env.',
    );
  }
  const secure = SMTP_SECURE === 'auto' ? SMTP_PORT === 465 : SMTP_SECURE === 'true';
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/** Send a single email. Returns true on success, false on failure (logged). */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: SMTP_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    return true;
  } catch (e) {
    console.error('[email] send failed', { to: msg.to }, e);
    return false;
  }
}

export function smtpConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}
