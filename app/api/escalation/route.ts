import { requireAdmin } from '@/lib/auth';
import { decideEscalation, listEscalations, type EscalationStatus } from '@/lib/escalations';
import { handle, HttpError, readJson } from '@/lib/http';

export const runtime = 'nodejs';

const STATUSES: EscalationStatus[] = ['pending', 'approved', 'rejected'];

export const GET = handle(async (req) => {
  const admin = await requireAdmin();
  const params = new URL(req.url).searchParams;
  const tenantId = params.get('tenantId');
  if (tenantId && tenantId !== admin.tenantId) throw new HttpError(403, 'You can only view your own company.');
  const status = (params.get('status') ?? 'pending') as EscalationStatus;
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Unknown ticket status.');
  const escalations = await listEscalations(admin.tenantId, status);
  return Response.json({ escalations, count: escalations.length }, { headers: { 'Cache-Control': 'no-store' } });
});

// Any adminId in the body is ignored: the deciding admin is the session.
export const PATCH = handle(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const { id, decision, adminNote } = body;
  if (typeof id !== 'string' || !id || id.includes('/') || id.length > 300) throw new HttpError(400, 'Invalid ticket id.');
  if (decision !== 'approved' && decision !== 'rejected') throw new HttpError(400, 'Choose approve or reject.');
  if (adminNote !== undefined && (typeof adminNote !== 'string' || adminNote.length > 1000)) throw new HttpError(400, 'The decision note can be at most 1,000 characters.');
  await decideEscalation(admin.tenantId, admin.userId, id, decision, adminNote as string | undefined);
  return Response.json({ success: true, id, decision });
});
