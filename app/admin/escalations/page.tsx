'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';

export default function AdminEscalations() {
  const { user, loading: authLoading } = useAuth();
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEscalations() {
      try {
        console.log('Fetching escalations...');
        const tId = user?.tenantId || 'tnt_sample01'; 
        const res = await fetch(`/api/escalation?tenantId=${tId}&status=pending`);
        console.log('Fetch response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Fetched escalations:', data.escalations);
          setEscalations(data.escalations || []);
        }
      } catch (e) {
        console.error('Failed to load escalations:', e);
      } finally {
        setLoading(false);
      }
    }
    loadEscalations();
  }, [user, refresh]);

  async function handleDecision(id: string, decision: 'approved' | 'rejected') {
    try {
      const res = await fetch('/api/escalation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision, adminId: user?.userId })
      });
      if (res.ok) {
        setEscalations(prev => prev.filter(e => e.id !== id));
      } else {
        setError((await res.json()).error || 'Unable to review ticket.');
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Escalations Queue</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Human-in-the-loop review for agent actions lacking confidence.</p>
        </div>
        <button className="px-4 py-2 border rounded-lg" onClick={() => setRefresh(r => r + 1)}>Refresh tickets</button>
      </div>
      {error && <p role="alert" className="text-error mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
        </div>
      ) : escalations.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant mb-6 border border-outline-variant/30">
            <span className="material-symbols-outlined text-[40px]">task_alt</span>
          </div>
          <h2 className="text-headline-sm font-semibold text-on-surface mb-2">No Active Escalations</h2>
          <p className="text-on-surface-variant text-sm max-w-md">
            The AI agent is currently handling all queries within confidence thresholds. Any action requiring human review will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalations.map((esc) => (
            <div key={esc.id} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-error/10 text-error px-2 py-0.5 rounded text-xs font-semibold uppercase">{esc.urgency || esc.riskLevel || 'Medium'} RISK</span>
                    <span className="text-sm font-medium text-on-surface-variant">ID: {esc.id}</span>
                  </div>
                  <h3 className="text-title-md font-semibold text-on-surface">Agent Escalation Request</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDecision(esc.id, 'rejected')}
                    className="px-4 py-2 border border-outline-variant/30 rounded-lg text-error hover:bg-error/5 font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleDecision(esc.id, 'approved')}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 font-medium transition-colors shadow-sm"
                  >
                    Approve
                  </button>
                </div>
              </div>
              
              <div className="bg-surface-container-low p-4 rounded-lg font-mono text-sm text-on-surface overflow-x-auto whitespace-pre-wrap">
                {esc.reason || JSON.stringify(esc.toolParameters, null, 2)}
              </div>
              {esc.userMessage && (
                <div className="mt-4 text-sm text-on-surface-variant">
                  <strong>User Message:</strong> {esc.userMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
