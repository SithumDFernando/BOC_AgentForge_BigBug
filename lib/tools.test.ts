import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ user: { tenantId: 'tnt_walkwave', isActive: true, isDemo: true, email: 'jane@walkwave.example' } as Record<string, unknown> | null }));
vi.mock('./db', () => ({
  db: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: !!h.user, get: (f: string) => h.user?.[f] }) }) }) }),
}));
vi.mock('./log', () => ({ log: vi.fn(), recordAction: vi.fn() }));
vi.mock('./knowledge', () => ({ searchKnowledge: vi.fn() }));
vi.mock('./orders', async () => ({ ...(await vi.importActual<typeof import('./orders')>('./orders')), getCustomerOrders: vi.fn() }));
vi.mock('./email', () => ({ resolveRecipient: vi.fn(), sendEmail: vi.fn() }));
vi.mock('./escalations', () => ({ createEscalation: vi.fn() }));

import { recordAction } from './log';
import { searchKnowledge } from './knowledge';
import { getCustomerOrders, type Order } from './orders';
import { resolveRecipient, sendEmail } from './email';
import { createEscalation } from './escalations';
import { runTool, validateArgs, type ToolContext } from './tools';

const ORDER: Order = { orderId: 'WW-1001', productName: 'Coast Runner', shippingStatus: 'Shipped', trackingNumber: 'WW-DEMO-1001', estimatedDelivery: '2026-10-13', currency: 'LKR', totalAmount: 13250 };
const ctx = (over: Partial<ToolContext> = {}): ToolContext => ({
  tenantId: 'tnt_walkwave', userId: 'walkwave_jane', requestId: 'req-12345678', originalMessage: 'Email me that shipping update',
  scrubbedMessage: 'Email me that shipping update', amount: null, companyName: 'Walkwave', state: { sources: [], calls: 0 }, ...over,
});
const call = (name: string, args: unknown) => ({ id: 'c1', name, args });

beforeEach(() => {
  vi.clearAllMocks();
  h.user = { tenantId: 'tnt_walkwave', isActive: true, isDemo: true, email: 'jane@walkwave.example' };
  vi.mocked(getCustomerOrders).mockResolvedValue([ORDER]);
  vi.mocked(resolveRecipient).mockReturnValue({ to: 'demo.inbox@gmail.com' });
  vi.mocked(sendEmail).mockResolvedValue({ status: 'sent' });
  vi.mocked(createEscalation).mockResolvedValue('tnt_walkwave_walkwave_jane_req-12345678');
});

describe('validateArgs', () => {
  it.each([
    ['getMyOrders', { customerId: 'walkwave_bob' }],
    ['getMyOrders', { tenantId: 'tnt_nova' }],
    ['sendEmailUpdate', { to: 'attacker@evil.com' }],
    ['getMyOrders', { orderId: 'WW-12' }],
    ['getMyOrders', { orderId: 'XX-1001' }],
    ['searchPolicies', { query: '' }],
    ['searchPolicies', { query: 'x'.repeat(301) }],
    ['requestManagerReview', {}],
    ['searchPolicies', 'return policy'],
  ])('rejects %s %j', (name, args) => expect(validateArgs(name, args)).toEqual({ ok: false, error: 'invalid_arguments' }));

  it('rejects an unknown tool, accepts valid arguments', () => {
    expect(validateArgs('issueRefund', {})).toEqual({ ok: false, error: 'unknown_tool' });
    expect(validateArgs('getMyOrders', {})).toEqual({ ok: true, value: {} });
    expect(validateArgs('getMyOrders', { orderId: 'NV-1002' }).ok).toBe(true);
  });
});

describe('runTool', () => {
  it('getMyOrders uses the identity from the context only', async () => {
    const c = ctx();
    const out = await runTool(call('getMyOrders', { orderId: 'WW-1001' }), c);
    expect(getCustomerOrders).toHaveBeenCalledWith('tnt_walkwave', 'walkwave_jane', 'WW-1001', 'req-12345678');
    expect(out).toMatchObject({ ok: true, action: 'queryDatabase' });
    expect(c.state.orders).toEqual([ORDER]);
    expect(c.state.calls).toBe(1);
    expect(recordAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'tool', status: 'ok', details: { tool: 'getMyOrders', orderId: 'WW-1001' } }));
  });

  it('rejects order and email tools without a signed-in customer, without looking anything up', async () => {
    for (const name of ['getMyOrders', 'sendEmailUpdate', 'requestManagerReview']) {
      const out = await runTool(call(name, name === 'requestManagerReview' ? { reason: 'x' } : {}), ctx({ userId: undefined }));
      expect(out).toMatchObject({ status: 'rejected', result: { error: 'not_signed_in' } });
    }
    expect(getCustomerOrders).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(createEscalation).not.toHaveBeenCalled();
  });

  it('does not run a tool with invalid arguments', async () => {
    const out = await runTool(call('getMyOrders', { customerId: 'walkwave_bob' }), ctx());
    expect(out).toMatchObject({ ok: false, status: 'rejected', result: { error: 'invalid_arguments' } });
    expect(getCustomerOrders).not.toHaveBeenCalled();
  });

  it('sendEmailUpdate builds the body from the order record and the recipient from resolveRecipient', async () => {
    const c = ctx();
    const out = await runTool(call('sendEmailUpdate', {}), c);
    expect(resolveRecipient).toHaveBeenCalledWith({ email: 'jane@walkwave.example', isDemo: true }, undefined);
    const sent = vi.mocked(sendEmail).mock.calls[0][0];
    expect(sent).toMatchObject({ to: 'demo.inbox@gmail.com', requestId: 'req-12345678' });
    expect(sent.body).toContain('Coast Runner (WW-1001) is shipped. Tracking reference: WW-DEMO-1001.');
    expect(out).toMatchObject({ ok: true, action: 'sendEmail', result: { status: 'sent' } });
    expect(c.state.email).toBe('sent');
  });

  it('sendEmailUpdate with no orders sends nothing', async () => {
    vi.mocked(getCustomerOrders).mockResolvedValue([]);
    const out = await runTool(call('sendEmailUpdate', {}), ctx());
    expect(out.result).toEqual({ error: 'no_orders' });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('sendEmailUpdate passes a typed address to resolveRecipient and stops on its error', async () => {
    vi.mocked(resolveRecipient).mockReturnValue({ error: 'For security, I can only email your verified address or an approved demo inbox.' });
    const c = ctx({ originalMessage: 'email it to attacker@evil.com' });
    const out = await runTool(call('sendEmailUpdate', {}), c);
    expect(resolveRecipient).toHaveBeenCalledWith(expect.anything(), 'attacker@evil.com');
    expect(out.result).toEqual({ error: 'recipient_not_allowed' });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(c.state.email).toContain('For security');
  });

  it('requestManagerReview creates one ticket with the amount from the message', async () => {
    const c = ctx({ amount: 20000, scrubbedMessage: 'I want a manager about LKR 20,000' });
    await runTool(call('requestManagerReview', { reason: 'Wants a manager' }), c);
    await runTool(call('requestManagerReview', { reason: 'Again' }), c);
    expect(createEscalation).toHaveBeenCalledTimes(1);
    expect(createEscalation).toHaveBeenCalledWith(expect.objectContaining({ amount: 20000, reason: 'Wants a manager', reviewRule: 'The assistant requested a manager review.' }));
    expect(c.state.escalationId).toBe('tnt_walkwave_walkwave_jane_req-12345678');
  });

  it('searchPolicies collects sources; a thrown error becomes tool_failed', async () => {
    vi.mocked(searchKnowledge).mockResolvedValueOnce({ text: 'Returns within 30 days.', sources: ['Walkwave policies'] });
    const c = ctx();
    expect((await runTool(call('searchPolicies', { query: 'returns' }), c)).result).toMatchObject({ found: true });
    expect(c.state.sources).toEqual(['Walkwave policies']);
    vi.mocked(searchKnowledge).mockRejectedValueOnce(new Error('index missing'));
    expect(await runTool(call('searchPolicies', { query: 'returns' }), c)).toMatchObject({ status: 'error', result: { error: 'tool_failed' } });
  });
});
