import { getSession } from '@/lib/auth';
import { demoCompanies, demoEnabled } from '@/lib/demo-config';
import { clientIp, handle, HttpError, readJson } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { issueWidgetToken } from '@/lib/widget';

export const runtime = 'nodejs';

// Nova's stand-in for "the company's own server endpoint" that a real site builds (see the docs page).
// Only the seeded Nova demo customers, only with ENABLE_DEMO, only when called from AgentForge's own pages.
export const POST = handle(async (req) => {
  if (!demoEnabled()) throw new HttpError(403, 'Demo account selection is disabled.');
  rateLimit(`widget-demo:${clientIp(req)}`, 20);
  const requestOrigin = req.headers.get('origin');
  if (requestOrigin && requestOrigin !== new URL(req.url).origin) throw new HttpError(403, 'Use the Nova storefront to start this demo.');
  const body = await readJson(req);
  const nova = demoCompanies.nova;
  if (body.company !== nova.tenantId) throw new HttpError(403, 'Unknown demo company.');
  const session = await getSession();
  const customerId = session?.role === 'user' && session.tenantId === nova.tenantId ? session.userId : nova.customers[0].id;
  if (!nova.customers.some(c => c.id === customerId)) throw new HttpError(403, 'Select a prepared Nova demo customer.');
  const out = await issueWidgetToken(nova.tenantId, String(body.origin ?? ''), customerId);
  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } });
});
