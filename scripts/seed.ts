// npm run seed: idempotent demo data. Fixed document IDs, set with merge, never deletes other data.
// Reads .env.local; never writes to it and never prints passwords or keys.
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const REQUIRED = ['FIREBASE_PROJECT_ID', 'WALKWAVE_ADMIN_PASSWORD', 'NOVA_ADMIN_PASSWORD', 'NOVA_DEMO_API_KEY'];

// The seed indexes the policy documents, so it needs the embedding provider too.
const EMBEDDING_ENV: Record<string, string[]> = {
  vertex: ['GOOGLE_CLOUD_PROJECT', 'VERTEX_LOCATION', 'VERTEX_EMBEDDING_MODEL'],
  openai: ['OPENAI_API_KEY', 'OPENAI_EMBEDDING_MODEL'],
};

function checkEnv() {
  const provider = process.env.LLM_PROVIDER?.trim() ?? '';
  const required = [
    ...REQUIRED,
    ...(process.env.FIREBASE_PRIVATE_KEY ? ['FIREBASE_CLIENT_EMAIL'] : []),
    ...(EMBEDDING_ENV[provider] ?? ['LLM_PROVIDER']),
  ];
  const missing = required.filter(name => !process.env[name]?.trim());
  if (missing.length) {
    console.error(`Seed stopped. Missing env vars in .env.local (or .env): ${missing.join(', ')}`);
    console.error('See .env.example and docs/THIRD_PARTY_SETUP.md.');
    process.exit(1);
  }
}

async function main() {
  checkEnv();
  // Imported after loadEnvConfig so nothing reads env before it's loaded.
  const { FieldValue } = await import('firebase-admin/firestore');
  const { db } = await import('@/lib/db');
  const { hashApiKey, hashPassword } = await import('@/lib/auth');
  const { demoCompanies } = await import('@/lib/demo-config');
  const { env } = await import('@/lib/env');
  const { indexDocument } = await import('@/lib/knowledge');
  const { readFile } = await import('node:fs/promises');

  const summary: string[] = [];

  // Merge-writes `data`; fields in `onCreate` are written only when the document doesn't exist yet.
  async function upsert(path: string, data: Record<string, unknown>, onCreate: Record<string, unknown> = {}) {
    const ref = db().doc(path);
    const exists = (await ref.get()).exists;
    await ref.set(exists ? data : { ...data, ...onCreate }, { merge: true });
    summary.push(`${exists ? 'updated' : 'created'}  ${path}`);
  }

  const created = { createdAt: FieldValue.serverTimestamp() };

  for (const c of Object.values(demoCompanies)) {
    await upsert(`tenants/${c.tenantId}`, { name: c.name, currency: 'LKR', refundLimit: c.refundLimit }, created);
  }

  const admins = [
    { id: 'walkwave_admin', tenantId: 'tnt_walkwave', email: 'admin@walkwave.example', name: 'Walkwave Manager', password: env('WALKWAVE_ADMIN_PASSWORD') },
    { id: 'nova_admin', tenantId: 'tnt_nova', email: 'admin@nova.example', name: 'Nova Manager', password: env('NOVA_ADMIN_PASSWORD') },
  ];
  for (const a of admins) {
    await upsert(`business_admins/${a.id}`, {
      tenantId: a.tenantId, email: a.email, name: a.name, passwordHash: await hashPassword(a.password), isActive: true,
    }, created);
  }

  for (const c of Object.values(demoCompanies)) {
    for (const u of c.customers) {
      await upsert(`users/${u.id}`, { tenantId: c.tenantId, name: u.name, email: u.email, isActive: true, isDemo: true }, created);
    }
  }

  const orders = [
    { orderId: 'WW-1001', tenantId: 'tnt_walkwave', customerId: 'walkwave_jane', productName: 'Coast Runner', shippingStatus: 'Shipped', trackingNumber: 'WW-DEMO-1001', estimatedDelivery: '2026-10-13', totalAmount: 13250 },
    { orderId: 'WW-1002', tenantId: 'tnt_walkwave', customerId: 'walkwave_bob', productName: 'City Stride', shippingStatus: 'Processing', trackingNumber: null, estimatedDelivery: null, totalAmount: 10400 },
    { orderId: 'NV-1001', tenantId: 'tnt_nova', customerId: 'nova_alice', productName: 'Nova Air Headphones', shippingStatus: 'Delivered', trackingNumber: 'NV-DEMO-1001', estimatedDelivery: '2026-10-09', totalAmount: 24900 },
    { orderId: 'NV-1002', tenantId: 'tnt_nova', customerId: 'nova_sam', productName: 'NovaBook 14', shippingStatus: 'Shipped', trackingNumber: 'NV-DEMO-1002', estimatedDelivery: '2026-10-14', totalAmount: 189900 },
  ];
  for (const o of orders) {
    await upsert(`demo_orders/${o.orderId}`, { ...o, currency: 'LKR' }, created);
  }

  const novaKey = env('NOVA_DEMO_API_KEY');
  await upsert('api_keys/nova_demo_key', {
    tenantId: 'tnt_nova', name: 'Nova server integration', keyHash: hashApiKey(novaKey), prefix: novaKey.slice(0, 7), isActive: true,
  }, { usageCount: 0, lastUsed: null, ...created });

  // Fixed ids, so re-running replaces the chunks instead of adding new ones.
  const policies = [
    { docId: 'demo_walkwave_policy', tenantId: 'tnt_walkwave', title: 'Walkwave policies', file: 'data/walkwave/policies.md' },
    { docId: 'demo_nova_policy', tenantId: 'tnt_nova', title: 'Nova Electronics policies', file: 'data/nova/policies.md' },
  ];
  for (const p of policies) {
    const text = await readFile(p.file, 'utf8');
    const doc = await indexDocument({
      docId: p.docId, tenantId: p.tenantId, adminId: 'seed', title: p.title, filename: 'policies.md', fileSize: Buffer.byteLength(text), text,
    });
    summary.push(`indexed  documents/${doc.id} (${doc.chunkCount} chunks)`);
  }

  console.log(summary.join('\n'));
  console.log(`\nSeed complete: ${summary.length} documents.`);
}

main().then(
  () => process.exit(0),
  (err: unknown) => {
    console.error('Seed failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
