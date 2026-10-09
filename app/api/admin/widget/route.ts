import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { handle, readJson } from '@/lib/http';
import { recordAction } from '@/lib/log';
import { getWidgetConfig, validateWidgetConfig } from '@/lib/widget';

export const runtime = 'nodejs';

function snippet(tenantId: string) {
  const src = new URL('/widget.js', env('APP_BASE_URL')).href;
  return `<script src="${src}" data-company="${tenantId}" defer></script>`;
}

export const GET = handle(async () => {
  const { tenantId } = await requireAdmin();
  return Response.json({ companyId: tenantId, widget: await getWidgetConfig(tenantId), snippet: snippet(tenantId) }, { headers: { 'Cache-Control': 'no-store' } });
});

export const POST = handle(async (req) => {
  const admin = await requireAdmin();
  const widget = validateWidgetConfig((await readJson(req)).widget);
  await db().collection('tenants').doc(admin.tenantId).set({ widget }, { merge: true });
  await recordAction({ tenantId: admin.tenantId, userId: admin.userId, type: 'widget_config', status: 'updated', details: { enabled: widget.enabled, origins: widget.allowedOrigins.length } });
  return Response.json({ success: true, widget });
});
