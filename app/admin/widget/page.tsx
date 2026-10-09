'use client';
import { FormEvent, useEffect, useState } from 'react';
import type { WidgetConfig } from '@/lib/widget';

// Adapted from the old repo's WidgetSettings (122bfa4). Settings live at /api/admin/widget (F12).
const fieldClass = 'w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-primary';

export default function AdminWidget() {
  const [config, setConfig] = useState<WidgetConfig>();
  const [company, setCompany] = useState('');
  const [base, setBase] = useState('');
  const [origins, setOrigins] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [personal, setPersonal] = useState(false);
  const [tokenUrl, setTokenUrl] = useState('/api/support/widget-token');

  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/admin/widget', { signal: abort.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load widget settings.');
        setBase(new URL(data.snippet.match(/src="([^"]+)"/)?.[1] ?? '/widget.js', window.location.href).origin);
        setCompany(data.companyId);
        setConfig(data.widget);
        setOrigins(data.widget.allowedOrigins.join('\n'));
        setSaved(JSON.stringify(data.widget));
      } catch (err) {
        if (!abort.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to load widget settings.');
      }
    }
    void load();
    return () => abort.abort();
  }, []);

  const current = config ? { ...config, allowedOrigins: origins.split('\n').map(s => s.trim()).filter(Boolean) } : undefined;
  const dirty = current ? JSON.stringify(current) !== saved : true;
  const ready = !!config?.enabled && !dirty;
  const safeTokenUrl = /^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(tokenUrl);
  const snippet = `<script\n  src="${base}/widget.js"\n  data-company="${company}"${personal && safeTokenUrl ? `\n  data-token-url="${tokenUrl}"` : ''}\n  defer>\n</script>`;

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/widget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ widget: current }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save widget settings.');
      setConfig(data.widget); setOrigins(data.widget.allowedOrigins.join('\n')); setSaved(JSON.stringify(data.widget)); setNotice('Website widget settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save widget settings.');
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(snippet); setNotice('Installation code copied.'); setError(''); }
    catch { setError('Select and copy the installation code below.'); }
  }

  return <div className="p-8 max-w-4xl text-on-surface">
    <h1 className="text-headline-lg font-bold">Website widget</h1>
    <p className="text-on-surface-variant mt-2">Add your assistant to your own website with one script tag.</p>
    <section className="mt-6 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm" aria-labelledby="website-widget-heading">
      <h2 id="website-widget-heading" className="text-title-md font-semibold">Settings</h2>
      {!config ? <p role={error ? 'alert' : 'status'} className={`mt-4 text-sm ${error ? 'text-error' : ''}`}>{error || 'Loading widget settings…'}</p> : <>
        <form onSubmit={save} className="mt-4 space-y-4">
          <label className="flex gap-3 items-center text-sm font-semibold"><input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />Enable website chat widget</label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Assistant name<input className={`${fieldClass} mt-2`} value={config.name} maxLength={70} required onChange={e => setConfig({ ...config, name: e.target.value })} /></label><label className="text-sm font-semibold">Brand colour<div className="mt-2 flex items-center gap-3"><input aria-label="Choose brand colour" type="color" value={config.color} onChange={e => setConfig({ ...config, color: e.target.value })} className="h-10 w-14 rounded border" /><span className="font-mono font-normal">{config.color}</span></div></label></div>
          <label className="block text-sm font-semibold">Allowed website origins<textarea className={`${fieldClass} mt-2 h-28 font-mono`} value={origins} placeholder="https://www.your-company.com" onChange={e => setOrigins(e.target.value)} /></label>
          <p className="text-xs text-on-surface-variant">One origin per line, including https://. Add www and non-www separately if you use both. Localhost may use http:// for testing.</p>
          <button disabled={saving} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">{saving ? 'Saving…' : 'Save widget settings'}</button>
        </form>
        <div className="mt-7 border-t border-outline-variant/20 pt-6"><h3 className="font-semibold">Install on your website</h3><p className="mt-2 text-sm text-on-surface-variant">Paste this before the closing &lt;/body&gt; tag, or into your website’s shared layout.</p>
          <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={personal} onChange={e => setPersonal(e.target.checked)} />Connect signed-in customers for personal orders</label>
          {personal && <div className="mt-3"><label className="text-sm font-semibold">Your website’s customer token endpoint<input className={`${fieldClass} mt-2`} value={tokenUrl} onChange={e => setTokenUrl(e.target.value)} /></label><p className="mt-2 text-xs text-on-surface-variant">Your developer builds this endpoint. It verifies the customer’s login on your site, then calls AgentForge’s session API from your server with an API key.</p>{!safeTokenUrl && <p role="alert" className="text-sm text-error mt-2">Enter a relative path such as /api/support/widget-token.</p>}</div>}
          <pre className="integration-code mt-4 overflow-x-auto rounded-lg p-4">{snippet}</pre>
          <button type="button" onClick={() => void copy()} disabled={!ready || (personal && !safeTokenUrl)} className="mt-3 rounded-lg border border-outline-variant/50 px-4 py-2 text-sm font-semibold disabled:opacity-50">Copy installation code</button>
          {!ready && <p className="mt-2 text-xs text-on-surface-variant">Enable the widget and save your settings before copying.</p>}
        </div>
        {notice && <p role="status" className="mt-4 text-sm text-green-700">{notice}</p>}
        {error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}
      </>}
    </section>
  </div>;
}
