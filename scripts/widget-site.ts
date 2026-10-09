// npm run widget-site: a stand-in "company website" on http://localhost:4000 that embeds the AgentForge
// widget from APP_BASE_URL (F12). It shows a cross-origin install with one script tag.
//   /        signed in as Alice: this server plays Nova's backend and gets a customer token with the API key
//   /guest   no token endpoint: anonymous visitor, policy questions only
// Reads .env.local / .env; never prints the key.
import { createServer } from 'node:http';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const PORT = 4000;
const ORIGIN = `http://localhost:${PORT}`;
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`widget-site stopped. Set ${name} in .env.local (see .env.example).`);
    process.exit(1);
  }
  return value;
}
const base = required('APP_BASE_URL');
const key = required('NOVA_DEMO_API_KEY');
const widgetSrc = new URL('/widget.js', base).href;

function page(signedIn: boolean) {
  const tokenAttr = signedIn ? ' data-token-url="/api/support/widget-token"' : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nova Electronics — partner site (widget test)</title>
<style>body{font-family:Arial,sans-serif;margin:0;background:#f6f7fb;color:#202f4e}main{max-width:720px;margin:60px auto;padding:0 20px}code{background:#e5eafa;padding:2px 6px;border-radius:4px}a{color:#3159cc}</style></head>
<body><main>
<p><small>Fictional test website on ${ORIGIN}: a different origin from AgentForge (${new URL(base).origin}).</small></p>
<h1>Nova Electronics</h1>
<p>${signedIn ? 'You are signed in to this site as <strong>Alice</strong>. This site&#39;s own server vouches for her by calling <code>POST /api/widget/session</code> with its API key.' : 'You are a guest. The assistant answers policy questions; order questions ask you to sign in.'}</p>
<p>The whole integration is one tag: <code>&lt;script src="${widgetSrc}" data-company="tnt_nova"${signedIn ? ' data-token-url="/api/support/widget-token"' : ''} defer&gt;</code></p>
<p><a href="${signedIn ? '/guest' : '/'}">${signedIn ? 'View as a guest' : 'View as Alice'}</a></p>
</main>
<script src="${widgetSrc}" data-company="tnt_nova"${tokenAttr} defer></script>
</body></html>`;
}

// This plays the company's backend: it has verified its own customer (Alice) and asks AgentForge for a token.
async function customerToken(): Promise<{ status: number; body: string }> {
  const res = await fetch(new URL('/api/widget/session', base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ customerId: 'nova_alice', origin: ORIGIN }),
  });
  return { status: res.status, body: await res.text() };
}

createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/support/widget-token') {
      const out = await customerToken();
      res.writeHead(out.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(out.body);
      return;
    }
    if (req.method === 'GET' && (req.url === '/' || req.url === '/guest')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page(req.url === '/'));
      return;
    }
    res.writeHead(404).end('Not found');
  } catch (err) {
    console.error('widget-site error:', err instanceof Error ? err.message : err);
    res.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Could not reach AgentForge.' }));
  }
}).listen(PORT, () => console.log(`Widget test site on ${ORIGIN} (embedding ${widgetSrc}). Guest view: ${ORIGIN}/guest`));
