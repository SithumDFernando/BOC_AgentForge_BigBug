import { assertActiveCustomer, requireCustomer } from '@/lib/auth';
import { chat } from '@/lib/chat';
import { handle, HttpError, readJson } from '@/lib/http';
import { log } from '@/lib/log';
import { rateLimit } from '@/lib/rate-limit';
import { parseChatInput } from '@/lib/validation';

export const runtime = 'nodejs';
export const maxDuration = 60;

// One-shot SSE (D6): an `agent` event per action as it happens, then `text`, then `result`; or `error`.
export const POST = handle(async (req) => {
  const session = await requireCustomer();
  const body = await readJson(req);
  if (typeof body.expectedCustomerId === 'string' && body.expectedCustomerId !== session.userId) {
    throw new HttpError(409, 'Your account changed in another tab. Select your customer again.');
  }
  const input = parseChatInput(body);
  rateLimit(`chat:${session.userId}`);
  await assertActiveCustomer(session.tenantId, session.userId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        const result = await chat(input, { tenantId: session.tenantId, userId: session.userId }, name => send({ type: 'agent', name }));
        send({ type: 'text', content: result.reply });
        const { tokens: _tokens, ...visible } = result;
        void _tokens;
        send({ type: 'result', ...visible, requestId: input.requestId });
      } catch (err) {
        log('ERROR', 'chat failed', { tenantId: session.tenantId, requestId: input.requestId, error: String(err).slice(0, 300) });
        send({ type: 'error', message: 'Something went wrong. Please try again.' });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' },
  });
});
