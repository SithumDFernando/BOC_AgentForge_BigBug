import { requireCustomer } from '@/lib/auth';
import { demoCompanies } from '@/lib/demo-config';
import { env, optionalEnv } from '@/lib/env';
import { handle, HttpError, readJson } from '@/lib/http';
import { log } from '@/lib/log';
import { parseChatInput } from '@/lib/validation';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Stands in for Nova's own backend: it holds Nova's API key server-side and calls the enterprise API.
// The key never reaches the browser, and it comes from the environment only (D19).
export const POST = handle(async (req) => {
  const session = await requireCustomer();
  if (session.tenantId !== demoCompanies.nova.tenantId) throw new HttpError(401, 'Select a Nova customer to use this company interface.');
  const body = await readJson(req);
  if (typeof body.expectedCustomerId === 'string' && body.expectedCustomerId !== session.userId) {
    throw new HttpError(409, 'Your account changed in another tab. Select your customer again.');
  }
  const input = parseChatInput(body);
  const key = optionalEnv('NOVA_DEMO_API_KEY');
  if (!key) {
    log('ERROR', 'NOVA_DEMO_API_KEY is not set', { tenantId: session.tenantId });
    throw new HttpError(503, 'The Nova demo integration key is unavailable.');
  }
  const endpoint = new URL('/api/v1/chat', env('APP_BASE_URL'));

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ message: input.message, history: input.history, requestId: input.requestId, customerId: session.userId }),
      signal: AbortSignal.timeout(50_000),
      cache: 'no-store',
    });
  } catch (err) {
    log('ERROR', 'nova integration unreachable', { requestId: input.requestId, endpoint: endpoint.origin, error: String(err).slice(0, 200) });
    throw new HttpError(502, 'Nova could not reach its AgentForge API integration.');
  }
  const data = await upstream.json().catch(() => ({ error: 'Nova could not reach its AgentForge API integration.' }));
  return Response.json(data, { status: upstream.status });
});
