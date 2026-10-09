import { db } from './db';
import { resolveRecipient, sendEmail } from './email';
import { createEscalation } from './escalations';
import { extractEmail } from './guardrails';
import { searchKnowledge } from './knowledge';
import type { ToolCall, ToolSpec } from './llm';
import { log, recordAction } from './log';
import { describeOrder, getCustomerOrders, type Order } from './orders';

// The only actions the model can request (D22). Identity never comes from arguments: no tool takes a tenant,
// customer or email address. Arguments are checked against fixed schemas before anything runs.

const ORDER_ID = /^(WW|NV)-\d{4}$/;
const ORDER_ID_SCHEMA = { type: 'string', pattern: '^(WW|NV)-\\d{4}$', description: 'An order ID such as WW-1001, if the customer gave one.' };

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'searchPolicies',
    description: "Search this company's policy documents (delivery, returns, refunds, warranty, support). Call before answering any policy question.",
    parameters: { type: 'object', properties: { query: { type: 'string', description: 'What to look up.' } }, required: ['query'], additionalProperties: false },
  },
  {
    name: 'getMyOrders',
    description: "Get the signed-in customer's own orders: status, tracking reference and delivery estimate.",
    parameters: { type: 'object', properties: { orderId: ORDER_ID_SCHEMA }, additionalProperties: false },
  },
  {
    name: 'sendEmailUpdate',
    description: "Email the signed-in customer an update about their order. Only when the customer asks for an email. The system writes the email and picks the recipient.",
    parameters: { type: 'object', properties: { orderId: ORDER_ID_SCHEMA }, additionalProperties: false },
  },
  {
    name: 'requestManagerReview',
    description: 'Open a ticket for a human manager. Only when the customer asks for a manager or a human. It does not approve or refund anything.',
    parameters: { type: 'object', properties: { reason: { type: 'string', description: 'A short summary of what the customer needs.' } }, required: ['reason'], additionalProperties: false },
  },
];

type ArgRule = { key: string; required: boolean; check: (v: unknown) => boolean };
const str = (min: number, max: number) => (v: unknown) => typeof v === 'string' && v.trim().length >= min && v.length <= max;
const RULES: Record<string, ArgRule[]> = {
  searchPolicies: [{ key: 'query', required: true, check: str(1, 300) }],
  getMyOrders: [{ key: 'orderId', required: false, check: v => typeof v === 'string' && ORDER_ID.test(v) }],
  sendEmailUpdate: [{ key: 'orderId', required: false, check: v => typeof v === 'string' && ORDER_ID.test(v) }],
  requestManagerReview: [{ key: 'reason', required: true, check: str(1, 500) }],
};

export function validateArgs(name: string, args: unknown): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const rules = RULES[name];
  if (!rules) return { ok: false, error: 'unknown_tool' };
  if (!args || typeof args !== 'object' || Array.isArray(args)) return { ok: false, error: 'invalid_arguments' };
  const value = args as Record<string, unknown>;
  const allowed = new Set(rules.map(r => r.key));
  if (Object.keys(value).some(k => !allowed.has(k))) return { ok: false, error: 'invalid_arguments' };
  for (const r of rules) {
    if (value[r.key] === undefined) {
      if (r.required) return { ok: false, error: 'invalid_arguments' };
    } else if (!r.check(value[r.key])) {
      return { ok: false, error: 'invalid_arguments' };
    }
  }
  return { ok: true, value };
}

export type ToolState = { orders?: Order[]; sources: string[]; escalationId?: string; email?: string; calls: number };
export type ToolContext = {
  tenantId: string;
  userId?: string;
  requestId: string;
  originalMessage: string; // for the explicit email address only
  scrubbedMessage: string; // stored on tickets
  amount: number | null; // largest amount in the message, from the chat router
  companyName: string;
  state: ToolState;
};
export type ToolOutcome = { ok: boolean; status: 'ok' | 'rejected' | 'error'; result: unknown; action?: string };

async function activeUser(ctx: ToolContext) {
  const snap = await db().collection('users').doc(ctx.userId!).get();
  if (!snap.exists || snap.get('tenantId') !== ctx.tenantId || snap.get('isActive') !== true) return null;
  return { email: String(snap.get('email') ?? ''), isDemo: snap.get('isDemo') === true };
}

const NOT_SIGNED_IN: ToolOutcome = { ok: false, status: 'rejected', result: { error: 'not_signed_in' } };

async function execute(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<ToolOutcome> {
  const { state } = ctx;
  switch (name) {
    case 'searchPolicies': {
      const found = await searchKnowledge(ctx.tenantId, String(args.query));
      for (const s of found.sources) if (!state.sources.includes(s)) state.sources.push(s);
      return { ok: true, status: 'ok', result: { found: !!found.text, text: found.text, sources: found.sources } };
    }
    case 'getMyOrders': {
      if (!ctx.userId) return NOT_SIGNED_IN;
      const orders = await getCustomerOrders(ctx.tenantId, ctx.userId, args.orderId as string | undefined, ctx.requestId);
      state.orders = orders;
      return { ok: true, status: 'ok', action: 'queryDatabase', result: { orders: orders.map(o => ({ ...o, summary: describeOrder(o) })) } };
    }
    case 'sendEmailUpdate': {
      if (!ctx.userId) return NOT_SIGNED_IN;
      if (state.email) return { ok: false, status: 'rejected', result: { error: 'already_requested' } };
      const user = await activeUser(ctx);
      if (!user) return NOT_SIGNED_IN;
      const orderId = args.orderId as string | undefined;
      let orders = state.orders ?? await getCustomerOrders(ctx.tenantId, ctx.userId, orderId, ctx.requestId);
      if (orderId) orders = orders.filter(o => o.orderId === orderId);
      if (!orders.length) return { ok: false, status: 'rejected', result: { error: 'no_orders' } };
      const recipient = resolveRecipient(user, extractEmail(ctx.originalMessage));
      if ('error' in recipient) {
        state.email = recipient.error;
        return { ok: false, status: 'rejected', action: 'sendEmail', result: { error: 'recipient_not_allowed' } };
      }
      // The body comes from the order records, never from the model.
      const body = [...orders.map(describeOrder), '', `This is an automated message from the ${ctx.companyName} assistant (AgentForge demo).`].join('\n');
      const { status } = await sendEmail({ tenantId: ctx.tenantId, userId: ctx.userId, requestId: ctx.requestId, to: recipient.to, subject: `${ctx.companyName}: your order update`, body });
      state.email = status;
      return { ok: status !== 'failed', status: status === 'failed' ? 'error' : 'ok', action: 'sendEmail', result: { status } };
    }
    case 'requestManagerReview': {
      if (!ctx.userId) return NOT_SIGNED_IN;
      state.escalationId ??= await createEscalation({
        tenantId: ctx.tenantId, userId: ctx.userId, requestId: ctx.requestId, reason: String(args.reason).trim(),
        userMessage: ctx.scrubbedMessage, reviewRule: 'The assistant requested a manager review.', amount: ctx.amount,
      });
      return { ok: true, status: 'ok', action: 'escalateToHuman', result: { escalationId: state.escalationId, status: 'pending' } };
    }
    default:
      return { ok: false, status: 'rejected', result: { error: 'unknown_tool' } };
  }
}

export async function runTool(call: ToolCall, ctx: ToolContext): Promise<ToolOutcome> {
  ctx.state.calls++;
  const valid = validateArgs(call.name, call.args);
  let outcome: ToolOutcome;
  if (!valid.ok) {
    outcome = { ok: false, status: 'rejected', result: { error: valid.error } };
  } else {
    try {
      outcome = await execute(call.name, valid.value, ctx);
    } catch (err) {
      log('ERROR', 'tool failed', { tenantId: ctx.tenantId, requestId: ctx.requestId, tool: call.name, error: String(err).slice(0, 300) });
      outcome = { ok: false, status: 'error', result: { error: 'tool_failed' } };
    }
  }
  const orderId = valid.ok && typeof valid.value.orderId === 'string' ? valid.value.orderId : undefined;
  await recordAction({ tenantId: ctx.tenantId, userId: ctx.userId, requestId: ctx.requestId, type: 'tool', status: outcome.status, details: { tool: call.name, ...(orderId ? { orderId } : {}) } });
  return outcome;
}
