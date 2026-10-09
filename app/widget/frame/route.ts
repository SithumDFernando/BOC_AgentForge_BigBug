import { HttpError } from '@/lib/http';
import { log } from '@/lib/log';
import { allowedWidget } from '@/lib/widget';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (v: string) => v.replace(/[&<>"']/g, c => ENTITIES[c]);

// The chat panel inside the company's page. It may only be framed by the company's allowed origins.
export async function GET(req: Request) {
  const url = new URL(req.url);
  let ctx;
  try {
    ctx = await allowedWidget(url.searchParams.get('company'), url.searchParams.get('origin'));
  } catch (err) {
    if (!(err instanceof HttpError)) log('ERROR', 'widget frame failed', { error: String(err).slice(0, 300) });
    const known = err instanceof HttpError;
    return new Response(known ? err.message : 'The assistant is temporarily unavailable.', {
      status: known ? err.status : 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Security-Policy': "frame-ancestors 'none'", 'Cache-Control': 'no-store' },
    });
  }
  const { config } = ctx;
  const name = escapeHtml(config.name);
  const data = JSON.stringify({ company: ctx.tenantId, origin: ctx.origin, name: config.name, color: config.color }).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><link rel="stylesheet" href="/widget/frame.css"><script id="widget-config" type="application/json">${data}</script><script src="/widget/frame.js" defer></script></head><body>
<section class="widget-shell" aria-label="${name}">
<header><span class="mark" aria-hidden="true">${escapeHtml(config.name.charAt(0))}</span><div><h1>${name}</h1><p id="identity">Connecting…</p></div><button id="close" aria-label="Close chat">×</button></header>
<main id="conversation" role="log" aria-live="polite" aria-relevant="additions text"><div class="welcome"><span>YOUR PERSONAL SUPPORT</span><h2>A little help.<br>A lot less waiting.</h2><p>Ask about our policies, check an order, or request an email update.</p></div></main>
<div id="review" role="status" hidden></div><p id="status" role="status">Opening your assistant…</p>
<div id="suggestions"><button disabled>What is your return policy?</button><button disabled>What is my order status?</button><button disabled>Email me my shipping update</button><button disabled>I want a refund of LKR 75,000</button></div>
<form id="compose"><label class="sr-only" for="message">Message</label><input id="message" placeholder="Ask us anything…" maxlength="4000" autocomplete="off" disabled><button id="send" aria-label="Send message" disabled>↑</button></form>
<footer>Powered by AgentForge</footer>
</section></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors ${config.allowedOrigins.join(' ')}; base-uri 'none'; form-action 'none'`,
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
