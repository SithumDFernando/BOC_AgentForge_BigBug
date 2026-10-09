import { getEscalation } from '@/lib/escalations';
import { handle, HttpError } from '@/lib/http';
import { requireWidget } from '@/lib/widget';

export const runtime = 'nodejs';

export const GET = handle(async (req) => {
  const ctx = await requireWidget(req);
  if (!ctx.customer) throw new HttpError(401, 'Sign in to view your review request.');
  const id = new URL(req.url).searchParams.get('id');
  if (!id || id.includes('/') || id.length > 300) throw new HttpError(400, 'Invalid ticket id.');
  const ticket = await getEscalation(id);
  if (!ticket || ticket.tenantId !== ctx.tenantId || ticket.userId !== ctx.customer.userId) throw new HttpError(404, 'Ticket not found.');
  return Response.json({ id: ticket.id, status: ticket.status, adminNote: ticket.adminNote }, { headers: { 'Cache-Control': 'no-store' } });
});
