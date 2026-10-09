export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

const GENERIC_ERROR = 'Something went wrong. Please try again.';

// Wraps a route handler: HttpError → { error } with its status; anything else is logged and returns a generic 500.
export function handle<C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
      console.error(err);
      return Response.json({ error: GENERIC_ERROR }, { status: 500 });
    }
  };
}
