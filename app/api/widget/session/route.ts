import { requireApiKey } from '@/lib/auth';
import { handle, HttpError, readJson } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { issueWidgetToken, requireWidget } from '@/lib/widget';

export const runtime = 'nodejs';

// The company's server calls this after verifying its own signed-in customer (API key auth).
export const POST = handle(async (req) => {
  const { tenantId, keyId } = await requireApiKey(req);
  rateLimit(`widget-session:${keyId}`);
  const body = await readJson(req);
  if (typeof body.customerId !== 'string' || !body.customerId) throw new HttpError(400, 'A verified customerId is required.');
  const out = await issueWidgetToken(tenantId, String(body.origin ?? ''), body.customerId);
  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } });
});

// The frame checks a token it was handed before using it.
export const GET = handle(async (req) => {
  const ctx = await requireWidget(req);
  return Response.json(
    { company: ctx.tenantId, origin: ctx.origin, customer: ctx.customer ? { id: ctx.customer.userId, name: ctx.customer.name } : null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
});
