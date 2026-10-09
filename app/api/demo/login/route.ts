import { createSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { demoCompanies, demoEnabled, type DemoCompany } from '@/lib/demo-config';
import { handle, HttpError, readJson } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handle(async (req) => {
  if (!demoEnabled()) throw new HttpError(403, 'Demo account selection is disabled.');
  const body = await readJson(req);

  const company = typeof body.company === 'string' && Object.hasOwn(demoCompanies, body.company)
    ? demoCompanies[body.company as DemoCompany]
    : undefined;
  if (!company) throw new HttpError(400, 'Unknown demo company.');

  const customer = company.customers.find(c => c.id === body.customerId);
  if (!customer) throw new HttpError(403, 'This customer is not part of that demo company.');

  const doc = await db().collection('users').doc(customer.id).get();
  if (!doc.exists || doc.get('isActive') !== true || doc.get('isDemo') !== true || doc.get('tenantId') !== company.tenantId) {
    throw new HttpError(409, 'Demo data is not ready. Run npm run seed.');
  }

  await createSession({
    userId: customer.id,
    role: 'user',
    tenantId: company.tenantId,
    email: doc.get('email') ?? customer.email,
    name: doc.get('name') ?? customer.name,
  });
  return Response.json({ success: true });
});
