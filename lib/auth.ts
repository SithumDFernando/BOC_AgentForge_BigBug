import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import { env } from './env';
import { HttpError } from './http';

export type Session = { userId: string; role: 'admin' | 'user'; tenantId: string; email?: string; name?: string };

export const SESSION_COOKIE = 'session';
const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  return new TextEncoder().encode(env('JWT_SECRET'));
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ role: s.role, tenantId: s.tenantId, email: s.email, name: s.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret());
}

// Returns null for a missing, tampered, expired or malformed token.
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    const { sub, role, tenantId, email, name } = payload;
    if (typeof sub !== 'string' || (role !== 'admin' && role !== 'user') || typeof tenantId !== 'string') return null;
    return {
      userId: sub,
      role,
      tenantId,
      email: typeof email === 'string' ? email : undefined,
      name: typeof name === 'string' ? name : undefined,
    };
  } catch {
    return null;
  }
}

export async function createSession(s: Session): Promise<void> {
  const token = await signSession(s);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export async function getSession(): Promise<Session | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== 'admin') throw new HttpError(401, 'Please sign in as an admin.');
  return s;
}

export async function requireCustomer(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== 'user') throw new HttpError(401, 'Please select a customer to continue.');
  return s;
}

export async function requireApiKey(req: Request): Promise<{ tenantId: string; keyId: string }> {
  const invalid = new HttpError(401, 'Invalid or inactive API key.');
  // Any token shape is accepted here; only a stored sha256 hash match is valid (the seeded demo key may not be af_ hex).
  const match = /^Bearer\s+(\S{8,200})$/i.exec(req.headers.get('authorization')?.trim() ?? '');
  if (!match) throw invalid;
  const snap = await db().collection('api_keys').where('keyHash', '==', hashApiKey(match[1])).limit(1).get();
  const doc = snap.docs[0];
  if (!doc || doc.get('isActive') !== true || typeof doc.get('tenantId') !== 'string') throw invalid;
  return { tenantId: doc.get('tenantId'), keyId: doc.id };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): { key: string; prefix: string; keyHash: string } {
  const key = `af_${randomBytes(24).toString('hex')}`;
  return { key, prefix: key.slice(0, 7), keyHash: hashApiKey(key) };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
