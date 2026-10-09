import { db } from './db';

type Severity = 'INFO' | 'WARNING' | 'ERROR';

// One JSON object per line. Cloud Run ships stdout to Cloud Logging, which parses it into fields (D24).
// Never pass secrets, raw messages, email bodies, or tool arguments other than order IDs.
export function log(severity: Severity, message: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ severity, message, ...fields });
  if (severity === 'ERROR') console.error(line);
  else console.log(line);
}

// agent_actions record + matching log line. Best effort: a Firestore failure is logged, never thrown.
export async function recordAction(i: {
  tenantId: string;
  userId?: string;
  requestId?: string;
  type: string;
  status: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  log(i.status === 'error' ? 'WARNING' : 'INFO', `action ${i.type} ${i.status}`, {
    tenantId: i.tenantId, userId: i.userId, requestId: i.requestId, action: i.type, status: i.status, ...i.details,
  });
  try {
    await db().collection('agent_actions').add({ ...i, details: i.details ?? {}, createdAt: new Date().toISOString() });
  } catch (err) {
    log('ERROR', 'agent_actions write failed', { tenantId: i.tenantId, requestId: i.requestId, error: String(err) });
  }
}
