import { log } from './log';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through to the 400 below
  }
  throw new HttpError(400, 'Invalid request body.');
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

// Wraps a route handler: HttpError → { error } with its status; anything else is logged and returns a generic 500.
export function handle<C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
      log('ERROR', 'unhandled route error', { method: req.method, path: new URL(req.url).pathname, error: err instanceof Error ? (err.stack ?? err.message).slice(0, 1500) : String(err) });
      return Response.json({ error: GENERIC_ERROR }, { status: 500 });
    }
  };
}
