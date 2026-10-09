'use client';
import { useEffect, useState } from 'react';
interface Ticket { id: string; userId?: string; customerName?: string; customerEmail?: string; reason?: string; userMessage?: string; reviewRule?: string; urgency?: string; status: string; createdAt?: string; decidedAt?: string; adminNote?: string }
export default function AdminEscalations() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState('pending');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string>();
  const [notes, setNotes] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the view before each refetch; the fetch itself awaits
    setLoading(true); setError('');
    async function load() {
      try { const res = await fetch(`/api/escalation?status=${status}`); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Unable to load tickets.'); if (!cancelled) setTickets(data.escalations || []); }
      catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load tickets.'); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [status, refresh]);
  async function decide(id: string, decision: 'approved' | 'rejected') {
    setBusy(id); setError('');
    try { const res = await fetch('/api/escalation', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, decision, adminNote: notes[id] || '' }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Unable to review ticket.'); setRefresh(r => r + 1); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save decision.'); }
    finally { setBusy(undefined); }
  }
  return <div className="p-8 text-on-surface">
    <div className="flex flex-wrap justify-between gap-4 mb-6"><div><h1 className="text-headline-lg font-bold">Escalations Queue</h1><p className="text-on-surface-variant mt-2">Review customer requests that the website assistant cannot complete automatically.</p></div><button className="px-4 py-2 border rounded-lg" onClick={() => setRefresh(r => r + 1)}>Refresh tickets</button></div>
    <div className="bg-surface-container-low rounded-xl p-5 mb-6"><h2 className="font-semibold">How manager review works</h2><p className="text-sm mt-2">A refund above LKR 50,000, a foreign-currency refund request, or a request for a manager creates a pending ticket. Check the customer’s request and the review reason, add your decision note, then approve or reject it.</p><p className="text-sm mt-2">The customer’s chat checks for your decision every five seconds. In this demo, approval records permission only: it does not issue a refund, charge a card, or automatically send an email.</p></div>
    <label className="text-sm font-semibold" htmlFor="ticket-status">Show tickets</label><select id="ticket-status" className="ml-3 border rounded-lg p-2 mb-6 bg-surface" value={status} onChange={e => setStatus(e.target.value)}><option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
    {error && <p role="alert" className="text-error mb-4">{error}</p>}
    {loading ? <p role="status">Loading tickets…</p> : tickets.length === 0 ? <div className="border rounded-xl p-8"><h2 className="font-semibold">No {status} tickets</h2><p className="text-sm mt-2">To demonstrate this flow, ask the company’s assistant “I want a refund of LKR 75,000”, then refresh this queue. Use a separate browser profile for the customer session.</p></div> : <div className="space-y-5">{tickets.map(ticket => <article key={ticket.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="font-semibold">{ticket.customerName || ticket.userId || 'Customer'} — review request</h2><span className="text-sm capitalize">{ticket.status} · {ticket.urgency || 'medium'} priority</span></div>
      <p className="text-sm text-on-surface-variant mt-2">{ticket.customerEmail || ''} · Submitted {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Unknown date'}</p><p className="text-xs break-all text-on-surface-variant mt-1">Customer ID: {ticket.userId || 'Unavailable'} · Ticket: {ticket.id}</p>
      <h3 className="text-sm font-semibold mt-5">Customer request</h3><p className="bg-surface-container-low rounded-lg p-4 mt-2 whitespace-pre-wrap text-sm">{ticket.userMessage || ticket.reason || 'No request text recorded.'}</p>
      <h3 className="text-sm font-semibold mt-4">Why this needs review</h3><p className="text-sm mt-2">{ticket.reviewRule || ticket.reason || 'The assistant requested a manager decision.'}</p>
      {ticket.status === 'pending' ? <><label className="block text-sm font-semibold mt-4" htmlFor={`note-${ticket.id}`}>Decision note (optional)</label><textarea id={`note-${ticket.id}`} maxLength={1000} value={notes[ticket.id] || ''} onChange={e => setNotes(n => ({ ...n, [ticket.id]: e.target.value }))} className="w-full border rounded-lg bg-surface p-3 mt-2" placeholder="Explain the decision for the review record."/><div className="flex gap-3 mt-4"><button disabled={!!busy} onClick={() => void decide(ticket.id, 'rejected')} className="border rounded-lg px-4 py-2 text-error">Reject request</button><button disabled={!!busy} onClick={() => void decide(ticket.id, 'approved')} className="bg-primary text-on-primary rounded-lg px-4 py-2">Approve request</button>{busy === ticket.id && <span role="status">Saving…</span>}</div></> : <p className="text-sm mt-4">Decision recorded {ticket.decidedAt ? new Date(ticket.decidedAt).toLocaleString() : ''}. {ticket.adminNote || 'No note added.'}</p>}
    </article>)}</div>}
  </div>;
}
