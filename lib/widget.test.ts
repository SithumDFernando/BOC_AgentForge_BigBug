import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';

const h = vi.hoisted(() => ({ tenants: new Map<string, Record<string, unknown>>() }));
vi.mock('./db', () => ({
  db: () => ({ collection: () => ({ doc: (id: string) => ({ get: async () => ({ exists: h.tenants.has(id), get: (f: string) => h.tenants.get(id)?.[f] }) }) }) }),
}));
vi.mock('./auth', () => ({
  assertActiveCustomer: vi.fn(async (tenantId: string, userId: string) => {
    if (tenantId !== 'tnt_nova' || !userId.startsWith('nova_')) throw Object.assign(new Error('denied'), { status: 403 });
    return { name: 'Alice', email: 'alice@nova.example', isDemo: true };
  }),
}));

import { allowedWidget, issueWidgetToken, requireWidget, siteOrigin, validateWidgetConfig, verifyWidgetToken } from './widget';

const SECRET = 'test-secret-test-secret-test-secret-32';
const widget = { enabled: true, name: 'Nova Assistant', color: '#3159cc', allowedOrigins: ['https://shop.nova.lk', 'http://localhost:4000'] };
const bearer = (token: string) => new Request('http://x/api/widget/chat', { headers: { Authorization: `Bearer ${token}` } });

beforeEach(() => {
  vi.stubEnv('JWT_SECRET', SECRET);
  h.tenants.clear();
  h.tenants.set('tnt_nova', { name: 'Nova Electronics', widget });
});
afterEach(() => vi.unstubAllEnvs());

describe('siteOrigin', () => {
  it.each(['https://shop.example.com', 'https://Shop.Example.com/', 'http://localhost:4000', 'http://127.0.0.1:3000'])('accepts %s', v => {
    expect(() => siteOrigin(v)).not.toThrow();
  });
  it.each(['http://shop.example.com', 'https://shop.example.com/path', 'https://shop.example.com/?q=1', 'https://u:p@shop.example.com', 'javascript:alert(1)', 'shop.example.com', 42])('rejects %s', v => {
    expect(() => siteOrigin(v)).toThrow();
  });
});

describe('validateWidgetConfig', () => {
  it('normalizes and dedupes origins', () => {
    expect(validateWidgetConfig({ ...widget, allowedOrigins: ['https://shop.nova.lk/', 'https://shop.nova.lk'] }).allowedOrigins).toEqual(['https://shop.nova.lk']);
  });
  it.each([
    { ...widget, color: 'blue' },
    { ...widget, name: 'x'.repeat(71) },
    { ...widget, allowedOrigins: Array.from({ length: 21 }, (_, i) => `https://s${i}.example.com`) },
    { ...widget, allowedOrigins: [] },
    { ...widget, enabled: 'yes' },
  ])('rejects %#', bad => expect(() => validateWidgetConfig(bad)).toThrow());
});

describe('allowedWidget', () => {
  it('allows a listed origin; refuses unknown company, disabled widget and unlisted origin with one message', async () => {
    await expect(allowedWidget('tnt_nova', 'http://localhost:4000')).resolves.toMatchObject({ tenantId: 'tnt_nova' });
    for (const [tenant, origin] of [['tnt_other', 'http://localhost:4000'], ['tnt_nova', 'https://evil.example.com'], ['../x', 'http://localhost:4000']]) {
      await expect(allowedWidget(tenant, origin)).rejects.toThrow("This assistant isn't available on this website.");
    }
    h.tenants.set('tnt_nova', { widget: { ...widget, enabled: false } });
    await expect(allowedWidget('tnt_nova', 'http://localhost:4000')).rejects.toMatchObject({ status: 403 });
  });
});

describe('widget tokens', () => {
  it('round trip, with and without a customer', async () => {
    const anon = await issueWidgetToken('tnt_nova', 'http://localhost:4000');
    expect(anon.customer).toBeNull();
    const anonCtx = await requireWidget(bearer(anon.token));
    expect(anonCtx).toMatchObject({ tenantId: 'tnt_nova', origin: 'http://localhost:4000' });
    expect(anonCtx.customer).toBeUndefined();
    const alice = await issueWidgetToken('tnt_nova', 'http://localhost:4000', 'nova_alice');
    expect(alice.customer).toEqual({ id: 'nova_alice', name: 'Alice' });
    expect((await requireWidget(bearer(alice.token))).customer).toMatchObject({ userId: 'nova_alice', name: 'Alice' });
  });

  it('refuses a token once its origin is removed from the list', async () => {
    const { token } = await issueWidgetToken('tnt_nova', 'http://localhost:4000');
    h.tenants.set('tnt_nova', { widget: { ...widget, allowedOrigins: ['https://shop.nova.lk'] } });
    await expect(requireWidget(bearer(token))).rejects.toMatchObject({ status: 403 });
  });

  it('refuses a token for another customer tenant', async () => {
    await expect(issueWidgetToken('tnt_nova', 'http://localhost:4000', 'walkwave_jane')).rejects.toThrow();
  });

  it('rejects a session cookie, a wrong audience, a wrong secret, and a missing header', async () => {
    // Same shape as lib/auth signSession: role + tenantId, subject, no issuer or audience.
    const session = await new SignJWT({ role: 'user', tenantId: 'tnt_nova' }).setProtectedHeader({ alg: 'HS256' }).setSubject('nova_alice').setExpirationTime('5m').sign(new TextEncoder().encode(SECRET));
    await expect(verifyWidgetToken(session)).rejects.toMatchObject({ status: 401 });
    const other = await new SignJWT({ tenantId: 'tnt_nova', origin: 'http://localhost:4000' }).setProtectedHeader({ alg: 'HS256' }).setIssuer('agentforge-widget').setAudience('someone-else').setExpirationTime('5m').sign(new TextEncoder().encode(SECRET));
    await expect(verifyWidgetToken(other)).rejects.toMatchObject({ status: 401 });
    const forged = await new SignJWT({ tenantId: 'tnt_nova', origin: 'http://localhost:4000' }).setProtectedHeader({ alg: 'HS256' }).setIssuer('agentforge-widget').setAudience('agentforge-widget').setExpirationTime('5m').sign(new TextEncoder().encode('wrong-secret-wrong-secret-wrong-secret'));
    await expect(verifyWidgetToken(forged)).rejects.toMatchObject({ status: 401 });
    await expect(requireWidget(new Request('http://x'))).rejects.toMatchObject({ status: 401 });
  });

  it('has no fallback secret', async () => {
    vi.stubEnv('JWT_SECRET', '');
    await expect(issueWidgetToken('tnt_nova', 'http://localhost:4000')).rejects.toThrow(/JWT_SECRET/);
  });
});
