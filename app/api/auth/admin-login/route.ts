import { createSession, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { clientIp, handle, HttpError, readJson } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Compared against when the email is unknown, so both failure paths take the same bcrypt time.
const DUMMY_HASH = '$2b$10$7DDJw6hQ6.4KkZzN9ano0emohY.xVRtx.bYVLpFVJQbyLS2SYNuxq';

export const POST = handle(async (req) => {
  rateLimit(`login:${clientIp(req)}`, 10);
  const body = await readJson(req);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) throw new HttpError(400, 'Enter your email and password.');

  const snap = await db().collection('business_admins').where('email', '==', email).limit(1).get();
  const doc = snap.docs[0];
  const hash = doc?.get('passwordHash');
  const passwordOk = await verifyPassword(password, typeof hash === 'string' ? hash : DUMMY_HASH);
  const tenantId = doc?.get('tenantId');
  if (!doc || !passwordOk || doc.get('isActive') !== true || typeof tenantId !== 'string') {
    throw new HttpError(401, 'Invalid email or password.');
  }

  await createSession({ userId: doc.id, role: 'admin', tenantId, email, name: doc.get('name') });
  return Response.json({ success: true, tenantId });
});
