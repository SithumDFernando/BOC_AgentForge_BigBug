import { AggregateField } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { handle } from '@/lib/http';

export const runtime = 'nodejs';

// Every number is counted from Firestore for this tenant; tokenUsage is the model provider's reported usage.
export const GET = handle(async () => {
  const { tenantId } = await requireAdmin();
  const scoped = (name: string) => db().collection(name).where('tenantId', '==', tenantId);
  const [users, docs, escalations, tokens] = await Promise.all([
    scoped('users').count().get(),
    scoped('documents').count().get(),
    scoped('escalations').count().get(),
    scoped('chat_history').aggregate({ total: AggregateField.sum('tokens') }).get(),
  ]);
  return Response.json(
    { totalUsers: users.data().count, totalDocs: docs.data().count, tokenUsage: tokens.data().total ?? 0, totalEscalations: escalations.data().count },
    { headers: { 'Cache-Control': 'no-store' } },
  );
});
