import { randomUUID } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import { assertActiveCustomer } from './auth';
import { db } from './db';
import { env } from './env';
import { HttpError } from './http';

// Embeddable widget (F12, D27). Tokens use JWT_SECRET with their own issuer/audience and no `role` claim,
// so a widget token is never accepted as a session cookie and a session cookie is never a widget token.

export type WidgetConfig = { enabled: boolean; name: string; color: string; allowedOrigins: string[] };
export type WidgetContext = {
  tenantId: string;
  origin: string;
  config: WidgetConfig;
  customer?: { userId: string; name: string; email: string; isDemo: boolean };
};

const AUDIENCE = 'agentforge-widget';
const TOKEN_MINUTES = 30;
const TENANT_ID = /^[a-zA-Z0-9_-]{1,100}$/;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const unavailable = () => new HttpError(403, "This assistant isn't available on this website.");

function key() {
  return new TextEncoder().encode(env('JWT_SECRET'));
}

export function siteOrigin(value: unknown): string {
  const invalid = new HttpError(400, 'Use a website origin such as https://shop.example.com (HTTPS, no path). Localhost may use HTTP.');
  if (typeof value !== 'string' || value.length > 200) throw invalid;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw invalid;
  }
  const local = LOCAL_HOSTS.has(url.hostname);
  const schemeOk = url.protocol === 'https:' || (local && url.protocol === 'http:');
  if (!schemeOk || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw invalid;
  if (value.trim().replace(/\/$/, '').toLowerCase() !== url.origin.toLowerCase()) throw invalid; // no path, even "/x"
  return url.origin;
}

export function validateWidgetConfig(value: unknown): WidgetConfig {
  if (!value || typeof value !== 'object') throw new HttpError(400, 'Widget settings are required.');
  const v = value as Record<string, unknown>;
  if (typeof v.enabled !== 'boolean') throw new HttpError(400, 'Choose whether the widget is enabled.');
  if (typeof v.name !== 'string' || !v.name.trim() || v.name.trim().length > 70) throw new HttpError(400, 'Enter an assistant name of up to 70 characters.');
  if (typeof v.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(v.color)) throw new HttpError(400, 'Choose a six-digit hex colour, such as #214d3b.');
  if (!Array.isArray(v.allowedOrigins) || v.allowedOrigins.length > 20) throw new HttpError(400, 'Add up to 20 website origins.');
  const allowedOrigins = [...new Set(v.allowedOrigins.map(siteOrigin))];
  if (v.enabled && !allowedOrigins.length) throw new HttpError(400, 'Add a website origin before enabling the widget.');
  return { enabled: v.enabled, name: v.name.trim(), color: v.color.toLowerCase(), allowedOrigins };
}

export async function getWidgetConfig(tenantId: string): Promise<WidgetConfig> {
  const snap = await db().collection('tenants').doc(tenantId).get();
  const fallback: WidgetConfig = { enabled: false, name: `${String(snap.get('name') ?? 'Company')} Assistant`, color: '#214d3b', allowedOrigins: [] };
  const stored = snap.exists ? snap.get('widget') : undefined;
  if (!stored) return fallback;
  try {
    return validateWidgetConfig(stored);
  } catch {
    return fallback; // a broken stored config disables the widget rather than loading it
  }
}

// One message for unknown company, disabled widget and unlisted origin: no tenant enumeration.
export async function allowedWidget(tenantId: unknown, origin: unknown): Promise<{ tenantId: string; origin: string; config: WidgetConfig }> {
  if (typeof tenantId !== 'string' || !TENANT_ID.test(tenantId)) throw unavailable();
  let normalized: string;
  try {
    normalized = siteOrigin(origin);
  } catch {
    throw unavailable();
  }
  const config = await getWidgetConfig(tenantId);
  if (!config.enabled || !config.allowedOrigins.includes(normalized)) throw unavailable();
  return { tenantId, origin: normalized, config };
}

export async function issueWidgetToken(tenantId: string, origin: string, customerId?: string) {
  const { config } = await allowedWidget(tenantId, origin);
  const customer = customerId ? await assertActiveCustomer(tenantId, customerId) : undefined;
  const expiresAt = new Date(Date.now() + TOKEN_MINUTES * 60_000).toISOString();
  const token = await new SignJWT({ tenantId, origin, ...(customerId ? { customerId } : {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(AUDIENCE)
    .setAudience(AUDIENCE)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MINUTES}m`)
    .sign(key());
  return { token, expiresAt, customer: customer && customerId ? { id: customerId, name: customer.name } : null, name: config.name };
}

export async function verifyWidgetToken(token: string): Promise<{ tenantId: string; origin: string; customerId?: string }> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, key(), { algorithms: ['HS256'], issuer: AUDIENCE, audience: AUDIENCE }));
  } catch {
    throw new HttpError(401, 'Your chat session expired. Close and reopen the assistant.');
  }
  const { tenantId, origin, customerId } = payload;
  if (typeof tenantId !== 'string' || typeof origin !== 'string' || (customerId !== undefined && typeof customerId !== 'string')) {
    throw new HttpError(401, 'Invalid chat session.');
  }
  return { tenantId, origin, customerId: customerId as string | undefined };
}

// Every widget request re-checks that the origin is still allowed and the customer still active.
export async function requireWidget(req: Request): Promise<WidgetContext> {
  const match = /^Bearer\s+(\S{20,4000})$/i.exec(req.headers.get('authorization')?.trim() ?? '');
  if (!match) throw new HttpError(401, 'Open the assistant to start a session.');
  const claims = await verifyWidgetToken(match[1]);
  const { config } = await allowedWidget(claims.tenantId, claims.origin);
  if (!claims.customerId) return { tenantId: claims.tenantId, origin: claims.origin, config };
  const customer = await assertActiveCustomer(claims.tenantId, claims.customerId);
  return { tenantId: claims.tenantId, origin: claims.origin, config, customer: { userId: claims.customerId, ...customer } };
}
