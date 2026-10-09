import { generateApiKey, requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { handle, HttpError, readJson } from '@/lib/http';
import { recordAction } from '@/lib/log';

export const runtime = 'nodejs';

// Firestore Timestamps (the seed) and ISO strings (this route) both become ISO strings.
function iso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  const toDate = (value as { toDate?: () => Date }).toDate;
  return typeof toDate === 'function' ? toDate.call(value).toISOString() : null;
}

// Only the hash and a 7-character prefix are stored. `key` in the list is the prefix; the UI reads k.key.substring(0, 7).
export const GET = handle(async () => {
  const admin = await requireAdmin();
  const snap = await db().collection('api_keys').where('tenantId', '==', admin.tenantId).get();
  const keys = snap.docs
    .filter(d => d.get('isActive') === true)
    .map(d => ({
      id: d.id,
      name: String(d.get('name') ?? ''),
      key: `${String(d.get('prefix') ?? '')}…`,
      createdAt: iso(d.get('createdAt')) ?? '',
      lastUsed: iso(d.get('lastUsed')),
      usageCount: Number(d.get('usageCount') ?? 0),
      isActive: true,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json({ keys }, { headers: { 'Cache-Control': 'no-store' } });
});

export const POST = handle(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 80) throw new HttpError(400, 'Enter a key name of 1–80 characters.');
  const { key, prefix, keyHash } = generateApiKey();
  const createdAt = new Date().toISOString();
  const ref = await db().collection('api_keys').add({ tenantId: admin.tenantId, name, keyHash, prefix, isActive: true, usageCount: 0, lastUsed: null, createdAt, createdBy: admin.userId });
  await recordAction({ tenantId: admin.tenantId, userId: admin.userId, type: 'api_key', status: 'created', details: { keyId: ref.id } });
  // The full key is returned once and never stored.
  return Response.json({ key: { id: ref.id, name, key, createdAt, lastUsed: null, usageCount: 0, isActive: true } });
});

export const DELETE = handle(async (req) => {
  const admin = await requireAdmin();
  const id = new URL(req.url).searchParams.get('id');
  if (!id || id.includes('/') || id.length > 200) throw new HttpError(400, 'Invalid key id.');
  const ref = db().collection('api_keys').doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.get('tenantId') !== admin.tenantId) throw new HttpError(404, 'API key not found.');
  await ref.update({ isActive: false, revokedAt: new Date().toISOString() });
  await recordAction({ tenantId: admin.tenantId, userId: admin.userId, type: 'api_key', status: 'revoked', details: { keyId: id } });
  return Response.json({ success: true });
});
