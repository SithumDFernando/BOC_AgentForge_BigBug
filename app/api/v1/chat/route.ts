import { FieldValue } from 'firebase-admin/firestore';
import { assertActiveCustomer, requireApiKey } from '@/lib/auth';
import { chat } from '@/lib/chat';
import { db } from '@/lib/db';
import { handle, readJson } from '@/lib/http';
import { log } from '@/lib/log';
import { rateLimit } from '@/lib/rate-limit';
import { parseChatInput } from '@/lib/validation';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Enterprise API: the company's server calls this with its key. `customerId` is trusted only after
// checking that it's an active user of the key's tenant (SECURITY rule 1).
export const POST = handle(async (req) => {
  const { tenantId, keyId } = await requireApiKey(req);
  rateLimit(`v1:${keyId}`);
  const body = await readJson(req);
  const input = parseChatInput(body);
  const customerId = typeof body.customerId === 'string' && body.customerId ? body.customerId : undefined;
  if (customerId) await assertActiveCustomer(tenantId, customerId);

  const { tokens: _tokens, ...result } = await chat(input, { tenantId, userId: customerId });
  void _tokens;

  try {
    await db().collection('api_keys').doc(keyId).update({ usageCount: FieldValue.increment(1), lastUsed: new Date().toISOString() });
  } catch (err) {
    log('ERROR', 'api key usage update failed', { tenantId, keyId, error: String(err) });
  }
  return Response.json({ ...result, requestId: input.requestId });
});
