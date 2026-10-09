import { getSession } from '@/lib/auth';
import { getEscalation } from '@/lib/escalations';
import { handle, HttpError } from '@/lib/http';

export const runtime = 'nodejs';

// The customer who owns the ticket, or an admin of the same tenant. Anything else is a 404.
export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'Please sign in to continue.');
  const { id } = await params;
  if (!id || id.includes('/') || id.length > 300) throw new HttpError(400, 'Invalid ticket id.');
  const ticket = await getEscalation(id);
  const visible = ticket && ticket.tenantId === session.tenantId && (session.role === 'admin' || ticket.userId === session.userId);
  if (!visible) throw new HttpError(404, 'Ticket not found.');
  return Response.json(
    { id: ticket.id, status: ticket.status, reason: ticket.reason, adminNote: ticket.adminNote },
    { headers: { 'Cache-Control': 'no-store' } },
  );
});
