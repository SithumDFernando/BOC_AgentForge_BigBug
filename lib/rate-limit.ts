import { HttpError } from './http';

// In-memory sliding window, per instance. Keys: `chat:<userId>`, `v1:<keyId>`, `login:<ip>`.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): void {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    throw new HttpError(429, 'Too many requests. Please wait a moment and try again.');
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) prune(now, windowMs);
}

function prune(now: number, windowMs: number) {
  for (const [key, times] of hits) {
    if (times.every(t => now - t >= windowMs)) hits.delete(key);
  }
}
