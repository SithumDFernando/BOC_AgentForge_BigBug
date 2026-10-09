'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { DemoCompany, demoCompanies } from '@/lib/demo-config';

interface Message { role: 'user' | 'assistant'; content: string; actions?: string[]; sources?: string[] }
interface Result { reply?: string; actions?: string[]; sources?: string[]; escalationId?: string; error?: string; requestId?: string }
export default function ChatPanel({ company, customerId, onClose, onBusy }: { company: DemoCompany; customerId: string; onClose?: () => void; onBusy: (busy: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<string>();
  const [decision, setDecision] = useState('pending');
  const [trace, setTrace] = useState<Result>();
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const name = demoCompanies[company].name;
  useEffect(() => { inputRef.current?.focus(); return () => abort.current?.abort(); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, loading]);
  useEffect(() => {
    if (!ticket) return;
    let cancelled = false;
    const check = async () => { try { const res = await fetch(`/api/escalation/${encodeURIComponent(ticket)}`); if (res.ok) { const data = await res.json(); if (!cancelled) setDecision(data.status); } } catch { /* next poll can recover */ } };
    void check(); const timer = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [ticket]);
  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput(''); setLoading(true); onBusy(true);
    setMessages(m => [...m, { role: 'user', content: text }]);
    abort.current = new AbortController();
    let result: Result = {};
    try {
      const res = await fetch(company === 'nova' ? '/api/demo/enterprise-chat' : '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: messages.map(m => ({ role: m.role, content: m.content })), requestId: crypto.randomUUID(), expectedCustomerId: customerId }), signal: abort.current.signal });
      if (!res.ok) {
        const failure = await res.json().catch(() => null);
        throw new Error(failure?.error || 'The assistant is temporarily unavailable. Please try again.');
      }
      if (company === 'nova') result = await res.json();
      else {
        const reader = res.body?.getReader(); if (!reader) throw new Error('No chat response received.');
        const decoder = new TextDecoder(); let buffer = '';
        while (true) {
          const { done, value } = await reader.read(); buffer += decoder.decode(value, { stream: !done });
          const blocks = buffer.split('\n\n'); buffer = blocks.pop() || '';
          for (const block of blocks) {
            if (!block.startsWith('data: ')) continue;
            const event = JSON.parse(block.slice(6));
            if (event.type === 'error') throw new Error(event.message);
            if (event.type === 'text') result.reply = event.content;
            if (event.type === 'result') result = event;
          }
          if (done) break;
        }
      }
      if (!result.reply) throw new Error('The assistant returned an empty response.');
      setMessages(m => [...m, { role: 'assistant', content: result.reply!, actions: result.actions, sources: result.sources }]);
      setTrace(result);
      if (result.escalationId) { setTicket(result.escalationId); setDecision('pending'); }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setMessages(m => [...m, { role: 'assistant', content: error instanceof Error ? error.message : 'Something went wrong. Please try again.' }]); }
    finally { setLoading(false); onBusy(false); }
  }
  const suggestions = ['What is your return policy?', company === 'walkwave' ? 'Have my shoes shipped?' : 'What is my order status?', 'Email me my shipping update', 'I want a refund of LKR 75,000'];
  return <section className={`demo-chat ${company === 'nova' ? 'enterprise-chat' : ''}`} aria-label={`${name} assistant`}>
    <header className="chat-heading"><div className="assistant-mark">{company === 'walkwave' ? 'w.' : 'N'}</div><div><strong>{name} {company === 'nova' ? 'Concierge' : 'Assistant'}</strong><span><i /> Here to help you</span></div>{onClose && <button aria-label="Close chat" onClick={onClose}>×</button>}</header>
    <div className="chat-conversation" role="log" aria-live="polite" aria-relevant="additions text">
      <div className="chat-welcome"><span className="eyebrow">YOUR PERSONAL SUPPORT</span><h3>A little help.<br />A lot less waiting.</h3><p>Ask about our policies, check your order, or request an email update.</p></div>
      {messages.map((m, i) => <div key={i} className={`chat-message ${m.role}`}><p>{m.content}</p>{m.actions?.length ? <div className="action-tags">{m.actions.map(a => <span key={a}>{a === 'queryDatabase' ? 'Order database checked' : a === 'sendEmail' ? 'Email workflow' : 'Manager review requested'}</span>)}</div> : null}{m.sources?.length ? <small>Source: {m.sources.join(', ')}</small> : null}</div>)}
      {loading && <p className="chat-loading" role="status">Checking that for you…</p>}
      {ticket && <div className="ticket-status" role="status">Manager review: <strong>{decision}</strong>{decision !== 'pending' && <span> — no payment was executed in this demo.</span>}</div>}
      <div ref={end} />
    </div>
    <div className="chat-suggestions">{suggestions.map(s => <button key={s} disabled={loading} onClick={() => void send(s)}>{s}</button>)}</div>
    <form className="chat-compose" onSubmit={(e: FormEvent) => { e.preventDefault(); void send(input); }}><input ref={inputRef} aria-label="Message" placeholder="Ask us anything…" value={input} onChange={e => setInput(e.target.value)} disabled={loading} maxLength={4000} /><button aria-label="Send message" disabled={!input.trim() || loading}>↑</button></form>
    <footer className="chat-credit">{company === 'nova' ? 'Custom interface · AgentForge enterprise API' : 'Powered by AgentForge'} · Demo company</footer>
    {company === 'nova' && <details className="api-proof"><summary>Inspect API response</summary><p>POST /api/v1/chat · customer identity verified by Nova’s server · API key stays on the server.</p><pre>{JSON.stringify(trace || { status: 'Send a message to see the real API response.' }, null, 2)}</pre></details>}
  </section>;
}
