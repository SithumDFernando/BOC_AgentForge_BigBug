import { destroySession } from '@/lib/auth';
import { handle } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handle(async () => {
  await destroySession();
  return Response.json({ success: true });
});
