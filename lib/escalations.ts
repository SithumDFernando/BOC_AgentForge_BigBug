import { db } from './db';
import { HttpError } from './http';
import { recordAction } from './log';

export type EscalationStatus = 'pending' | 'approved' | 'rejected';
export type Escalation = {
  id: string;
  tenantId: string;
  userId: string;
  reason: string;
  userMessage: string;
  reviewRule: string;
  amount: number | null;
  urgency: string;
  status: EscalationStatus;
  createdAt: string;
  adminId: string | null;
  adminNote: string | null;
  decidedAt: string | null;
};
export type EscalationView = Escalation & { customerName: string | null; customerEmail: string | null };

function fromDoc(id: string, d: FirebaseFirestore.DocumentData): Escalation {
  return {
    id,
    tenantId: String(d.tenantId),
    userId: String(d.userId ?? ''),
    reason: String(d.reason ?? ''),
    userMessage: String(d.userMessage ?? ''),
    reviewRule: String(d.reviewRule ?? ''),
    amount: typeof d.amount === 'number' ? d.amount : null,
    urgency: String(d.urgency ?? 'high'),
    status: d.status as EscalationStatus,
    createdAt: String(d.createdAt ?? ''),
    adminId: d.adminId ?? null,
    adminNote: d.adminNote ?? null,
    decidedAt: d.decidedAt ?? null,
  };
}

// Idempotent per requestId: the same request never creates a second ticket.
export async function createEscalation(i: {
  tenantId: string;
  userId: string;
  requestId: string;
  reason: string;
  userMessage: string;
  reviewRule: string;
  amount: number | null;
}): Promise<string> {
  const id = `${i.tenantId}_${i.userId}_${i.requestId}`;
  const ref = db().collection('escalations').doc(id);
  const created = await db().runTransaction(async tx => {
    if ((await tx.get(ref)).exists) return false;
    tx.set(ref, {
      tenantId: i.tenantId, userId: i.userId, reason: i.reason, userMessage: i.userMessage.slice(0, 4000), reviewRule: i.reviewRule,
      amount: i.amount, urgency: 'high', status: 'pending', createdAt: new Date().toISOString(), adminId: null, adminNote: null, decidedAt: null,
    });
    return true;
  });
  await recordAction({ tenantId: i.tenantId, userId: i.userId, requestId: i.requestId, type: 'escalation', status: created ? 'ok' : 'duplicate', details: { escalationId: id } });
  return id;
}

export async function getEscalation(id: string): Promise<Escalation | null> {
  const snap = await db().collection('escalations').doc(id).get();
  return snap.exists ? fromDoc(snap.id, snap.data()!) : null;
}

export async function listEscalations(tenantId: string, status: EscalationStatus): Promise<EscalationView[]> {
  const snap = await db().collection('escalations').where('tenantId', '==', tenantId).get();
  const tickets = snap.docs
    .map(d => fromDoc(d.id, d.data()))
    .filter(t => t.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100);
  const userIds = [...new Set(tickets.map(t => t.userId).filter(u => u && !u.includes('/')))];
  const users = new Map<string, FirebaseFirestore.DocumentData>();
  if (userIds.length) {
    const refs = userIds.map(u => db().collection('users').doc(u));
    for (const u of await db().getAll(...refs)) if (u.exists) users.set(u.id, u.data()!);
  }
  return tickets.map(t => {
    const u = users.get(t.userId);
    const same = u?.tenantId === tenantId; // never show another tenant's customer details
    return { ...t, customerName: same ? String(u!.name ?? '') || null : null, customerEmail: same ? String(u!.email ?? '') || null : null };
  });
}

// A ticket is decided once, by an admin of the same tenant, atomically.
export async function decideEscalation(tenantId: string, adminId: string, id: string, decision: 'approved' | 'rejected', note?: string): Promise<void> {
  const ref = db().collection('escalations').doc(id);
  await db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get('tenantId') !== tenantId) throw new HttpError(404, 'Ticket not found.');
    if (snap.get('status') !== 'pending') throw new HttpError(409, 'This ticket was already reviewed.');
    tx.update(ref, { status: decision, adminId, adminNote: note?.trim().slice(0, 1000) || null, decidedAt: new Date().toISOString() });
  });
  await recordAction({ tenantId, userId: adminId, type: 'decision', status: decision, details: { escalationId: id } });
}
