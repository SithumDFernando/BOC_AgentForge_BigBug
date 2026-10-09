import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ claimed: new Set<string>(), sendMail: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: h.sendMail }) } }));
vi.mock('./log', () => ({ log: vi.fn(), recordAction: vi.fn() }));
vi.mock('./db', () => ({
  db: () => ({
    collection: () => ({ doc: (id: string) => ({ id, update: vi.fn() }) }),
    runTransaction: async (fn: (tx: unknown) => Promise<boolean>) => {
      let pending: string | undefined;
      const result = await fn({
        get: async (ref: { id: string }) => ({ exists: h.claimed.has(ref.id) }),
        set: (ref: { id: string }) => void (pending = ref.id),
      });
      if (pending) h.claimed.add(pending);
      return result;
    },
  }),
}));

import { resolveRecipient, sendEmail } from './email';

beforeEach(() => {
  h.claimed.clear();
  h.sendMail.mockReset().mockResolvedValue({});
  vi.stubEnv('EMAIL_ALLOWLIST', 'judge@example.org, Demo.Inbox@gmail.com');
  vi.stubEnv('DEMO_EMAIL_TO', 'demo.inbox@gmail.com');
  for (const [k, v] of Object.entries({ SMTP_HOST: 'smtp.test', SMTP_PORT: '587', SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_FROM: 'Walkwave <u@test>' })) vi.stubEnv(k, v);
});
afterEach(() => vi.unstubAllEnvs());

describe('resolveRecipient', () => {
  const demo = { email: 'jane@walkwave.example', isDemo: true };
  it('rejects an explicit address that is not on the allowlist', () => {
    expect(resolveRecipient(demo, 'attacker@evil.com')).toEqual({ error: expect.stringContaining('verified address') });
  });
  it('uses an allowlisted explicit address, case-insensitively', () => {
    expect(resolveRecipient(demo, 'JUDGE@example.org')).toEqual({ to: 'JUDGE@example.org' });
  });
  it('sends demo users to DEMO_EMAIL_TO', () => {
    expect(resolveRecipient(demo)).toEqual({ to: 'demo.inbox@gmail.com' });
  });
  it('refuses .example addresses for real users', () => {
    expect(resolveRecipient({ email: 'sam@nova.example' })).toEqual({ error: 'No real email recipient is configured for this account.' });
    expect(resolveRecipient({ email: 'real@customer.lk' })).toEqual({ to: 'real@customer.lk' });
  });
});

describe('sendEmail', () => {
  const msg = { tenantId: 't', userId: 'u', requestId: 'req-12345678', to: 'demo.inbox@gmail.com', subject: 's', body: 'b' };
  it('sends once per requestId, then reports duplicate', async () => {
    expect(await sendEmail(msg)).toEqual({ status: 'sent' });
    expect(await sendEmail(msg)).toEqual({ status: 'duplicate' });
    expect(h.sendMail).toHaveBeenCalledTimes(1);
  });
  it('reports failed when SMTP throws, and does not retry', async () => {
    h.sendMail.mockRejectedValue(new Error('smtp down'));
    expect(await sendEmail({ ...msg, requestId: 'req-other-1' })).toEqual({ status: 'failed' });
    expect(h.sendMail).toHaveBeenCalledTimes(1);
  });
});
