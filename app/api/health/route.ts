export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public liveness check. Touches neither Firestore nor OpenAI.
export function GET() {
  return Response.json({ ok: true });
}
