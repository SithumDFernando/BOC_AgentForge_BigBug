export const demoCompanies = {
  walkwave: { name: 'Walkwave', tenantId: 'tnt_walkwave', path: '/walkwave', refundLimit: 50000, customers: [{ id: 'walkwave_jane', name: 'Jane', email: 'jane@walkwave.example' }, { id: 'walkwave_bob', name: 'Bob', email: 'bob@walkwave.example' }] },
  nova: { name: 'Nova Electronics', tenantId: 'tnt_nova', path: '/nova', refundLimit: 50000, customers: [{ id: 'nova_alice', name: 'Alice', email: 'alice@nova.example' }, { id: 'nova_sam', name: 'Sam', email: 'sam@nova.example' }] },
} as const;
export type DemoCompany = keyof typeof demoCompanies;
export function demoEnabled() { return process.env.ENABLE_DEMO === 'true'; }
export function companyForTenant(tenantId: string) { return Object.values(demoCompanies).find(c => c.tenantId === tenantId); }
