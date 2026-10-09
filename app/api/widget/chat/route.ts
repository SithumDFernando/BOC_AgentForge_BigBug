import { chat } from '@/lib/chat';
import { clientIp, handle, readJson } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { parseChatInput } from '@/lib/validation';
import { requireWidget } from '@/lib/widget';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Same JSON as /api/v1/chat. Without a customer in the token, personal intents reply "Please sign in…".
export const POST = handle(async (req) => {
  const ctx = await requireWidget(req);
  rateLimit(`widget-chat:${ctx.tenantId}:${ctx.customer?.userId ?? clientIp(req)}`);
  const input = parseChatInput(await readJson(req));
  const { tokens: _tokens, ...result } = await chat(input, { tenantId: ctx.tenantId, userId: ctx.customer?.userId });
  void _tokens;
  return Response.json({ ...result, requestId: input.requestId }, { headers: { 'Cache-Control': 'no-store' } });
});
