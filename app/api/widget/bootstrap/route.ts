import { clientIp, handle, readJson } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { issueWidgetToken } from '@/lib/widget';

export const runtime = 'nodejs';

// An anonymous token: policy questions only. Called by the frame (same origin as AgentForge).
export const POST = handle(async (req) => {
  rateLimit(`widget-bootstrap:${clientIp(req)}`, 20);
  const body = await readJson(req);
  const out = await issueWidgetToken(String(body.company ?? ''), String(body.origin ?? ''));
  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } });
});
