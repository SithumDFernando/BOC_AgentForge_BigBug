import { HttpError } from './http';

export type Turn = { role: 'user' | 'assistant'; content: string };

const MAX_CHARS = 4000;
const MAX_TURNS = 8;
const REQUEST_ID = /^[a-zA-Z0-9-]{8,80}$/;

export function parseChatInput(body: unknown): { message: string; history: Turn[]; requestId: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const message = typeof b.message === 'string' ? b.message.trim() : '';
  if (message.length < 1 || message.length > MAX_CHARS) {
    throw new HttpError(400, 'Enter a message between 1 and 4,000 characters.');
  }

  const history: Turn[] = (Array.isArray(b.history) ? b.history : [])
    .filter((t): t is Turn =>
      !!t && typeof t === 'object' &&
      ((t as Turn).role === 'user' || (t as Turn).role === 'assistant') &&
      typeof (t as Turn).content === 'string')
    .map(t => ({ role: t.role, content: t.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_TURNS);

  const requestId = typeof b.requestId === 'string' && REQUEST_ID.test(b.requestId) ? b.requestId : crypto.randomUUID();

  return { message, history, requestId };
}
