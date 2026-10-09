import nodemailer, { type Transporter } from 'nodemailer';
import { db } from './db';
import { env } from './env';
import { log, recordAction } from './log';

export type EmailStatus = 'sent' | 'duplicate' | 'failed';

// The recipient is the verified address, the demo inbox, or an allowlisted address the customer typed.
// Never an address from model output or documents (SECURITY rule 9).
export function resolveRecipient(user: { email: string; isDemo?: boolean }, explicit?: string): { to: string } | { error: string } {
  if (explicit) {
    const allowed = env('EMAIL_ALLOWLIST').split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
    if (!allowed.includes(explicit.trim().toLowerCase())) {
      return { error: 'For security, I can only email your verified address or an approved demo inbox.' };
    }
    return { to: explicit.trim() };
  }
  const to = user.isDemo ? env('DEMO_EMAIL_TO') : user.email;
  if (!to || to.toLowerCase().endsWith('.example')) return { error: 'No real email recipient is configured for this account.' };
  return { to };
}

let transporter: Transporter | undefined;
function mailer(): Transporter {
  const port = Number(env('SMTP_PORT'));
  transporter ??= nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port,
    secure: port === 465,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

// At most one email per requestId: the request is claimed in a transaction before anything is sent. Never retried automatically.
export async function sendEmail(i: { tenantId: string; userId: string; requestId: string; to: string; subject: string; body: string }): Promise<{ status: EmailStatus }> {
  const ref = db().collection('email_requests').doc(`${i.tenantId}_${i.userId}_${i.requestId}`);
  const claimed = await db().runTransaction(async tx => {
    if ((await tx.get(ref)).exists) return false;
    tx.set(ref, { tenantId: i.tenantId, userId: i.userId, status: 'sending', createdAt: new Date().toISOString() });
    return true;
  });
  if (!claimed) {
    await recordAction({ tenantId: i.tenantId, userId: i.userId, requestId: i.requestId, type: 'email', status: 'duplicate' });
    return { status: 'duplicate' };
  }
  let status: EmailStatus = 'sent';
  try {
    await mailer().sendMail({ from: env('SMTP_FROM'), to: i.to, subject: i.subject, text: i.body });
  } catch (err) {
    status = 'failed';
    log('ERROR', 'smtp send failed', { tenantId: i.tenantId, requestId: i.requestId, error: String(err).slice(0, 300) });
  }
  try {
    await ref.update({ status, finishedAt: new Date().toISOString() });
  } catch (err) {
    log('ERROR', 'email status update failed', { tenantId: i.tenantId, requestId: i.requestId, error: String(err) });
  }
  await recordAction({ tenantId: i.tenantId, userId: i.userId, requestId: i.requestId, type: 'email', status });
  return { status };
}
