import { handle, HttpError } from '@/lib/http';
import { allowedWidget } from '@/lib/widget';

export const runtime = 'nodejs';

// Called by widget.js from the company's page (cross-origin); CORS is granted to that origin only.
export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const ctx = await allowedWidget(url.searchParams.get('company'), url.searchParams.get('origin'));
  const requestOrigin = req.headers.get('origin');
  if (requestOrigin && requestOrigin !== ctx.origin) throw new HttpError(403, "This assistant isn't available on this website.");
  return Response.json(
    { company: ctx.tenantId, name: ctx.config.name, color: ctx.config.color },
    { headers: { 'Access-Control-Allow-Origin': ctx.origin, Vary: 'Origin', 'Cache-Control': 'no-store' } },
  );
});
