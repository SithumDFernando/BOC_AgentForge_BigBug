import { beforeEach, describe, expect, it, vi } from 'vitest';

const jar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

const apiKeyDocs: { id: string; data: Record<string, unknown> }[] = [];
vi.mock('./db', () => ({
  db: () => ({
    collection: () => ({
      where: (_field: string, _op: string, hash: string) => ({
        limit: () => ({
          get: async () => ({
            docs: apiKeyDocs
              .filter(d => d.data.keyHash === hash)
              .map(d => ({ id: d.id, get: (f: string) => d.data[f] })),
          }),
        }),
      }),
    }),
  }),
}));

import {
  createSession, destroySession, generateApiKey, getSession, hashApiKey, hashPassword,
  requireAdmin, requireApiKey, requireCustomer, verifyPassword,
} from './auth';

const jane = { userId: 'walkwave_jane', role: 'user' as const, tenantId: 'tnt_walkwave', name: 'Jane' };

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';
  jar.clear();
  apiKeyDocs.length = 0;
});

describe('API keys', () => {
  it('hashApiKey is deterministic sha256 hex', () => {
    expect(hashApiKey('af_abc')).toBe(hashApiKey('af_abc'));
    expect(hashApiKey('af_abc')).toMatch(/^[0-9a-f]{64}$/);
    expect(hashApiKey('af_abc')).not.toBe(hashApiKey('af_abd'));
  });

  it('generateApiKey returns af_ + 48 hex, a 7-char prefix and a matching hash', () => {
    const { key, prefix, keyHash } = generateApiKey();
    expect(key).toMatch(/^af_[0-9a-f]{48}$/);
    expect(prefix).toBe(key.slice(0, 7));
    expect(keyHash).toBe(hashApiKey(key));
  });

  it('requireApiKey accepts an active key by hash and rejects others', async () => {
    const { key, keyHash } = generateApiKey();
    apiKeyDocs.push({ id: 'k1', data: { keyHash, tenantId: 'tnt_nova', isActive: true } });
    const req = (auth?: string) => new Request('http://x', { headers: auth ? { authorization: auth } : {} });

    await expect(requireApiKey(req(`Bearer ${key}`))).resolves.toEqual({ tenantId: 'tnt_nova', keyId: 'k1' });
    await expect(requireApiKey(req())).rejects.toMatchObject({ status: 401 });
    await expect(requireApiKey(req('Bearer af_wrongwrongwrong'))).rejects.toMatchObject({ status: 401 });

    apiKeyDocs[0].data.isActive = false;
    await expect(requireApiKey(req(`Bearer ${key}`))).rejects.toMatchObject({ status: 401 });
  });
});

describe('sessions', () => {
  it('round-trips a session through the cookie', async () => {
    await createSession(jane);
    expect(await getSession()).toEqual({ ...jane, email: undefined });
    await destroySession();
    expect(await getSession()).toBeNull();
  });

  it('returns null for a tampered token', async () => {
    await createSession(jane);
    const [h, p, sig] = jar.get('session')!.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url').toString()), role: 'admin' })).toString('base64url');
    jar.set('session', `${h}.${forged}.${sig}`);
    expect(await getSession()).toBeNull();
  });

  it('returns null for a token signed with another secret', async () => {
    await createSession(jane);
    process.env.JWT_SECRET = 'a-different-secret-that-is-also-long-enough';
    expect(await getSession()).toBeNull();
  });

  it('requireAdmin and requireCustomer check the role', async () => {
    await expect(requireCustomer()).rejects.toMatchObject({ status: 401 });
    await createSession(jane);
    await expect(requireCustomer()).resolves.toMatchObject({ userId: 'walkwave_jane' });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });

  it('throws when JWT_SECRET is missing (no fallback)', async () => {
    delete process.env.JWT_SECRET;
    await expect(createSession(jane)).rejects.toThrow('Missing env var JWT_SECRET');
  });
});

describe('passwords', () => {
  it('verifies bcrypt hashes', async () => {
    const hash = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
  });
});
