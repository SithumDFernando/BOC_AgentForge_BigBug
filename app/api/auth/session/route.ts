import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { handle } from '@/lib/http';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };

// Never 401: the AuthProvider treats { user: null } as signed out.
export const GET = handle(async () => {
  const session = await getSession();
  if (!session) return Response.json({ user: null }, { headers: NO_STORE });

  const collection = session.role === 'admin' ? 'business_admins' : 'users';
  const doc = await db().collection(collection).doc(session.userId).get();
  if (!doc.exists || doc.get('isActive') !== true || doc.get('tenantId') !== session.tenantId) {
    return Response.json({ user: null }, { headers: NO_STORE });
  }

  const user = {
    userId: session.userId,
    role: session.role,
    tenantId: session.tenantId,
    email: doc.get('email') ?? session.email ?? null,
    name: doc.get('name') ?? session.name ?? null,
  };
  return Response.json({ user }, { headers: NO_STORE });
});
