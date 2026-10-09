'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocs: 0,
    tokenUsage: 0,
    totalEscalations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json().catch(() => ({}));
        if (res.ok) setStats(data);
        else setError(data.error || 'Unable to load the dashboard numbers.');
      } catch {
        setError('Unable to load the dashboard numbers.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Welcome, {user?.name || 'Admin'}</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Tenant ID: {user?.tenantId}</p>
        </div>
      </div>
      
      {loading && <p role="status" className="text-on-surface-variant mb-6">Loading dashboard…</p>}
      {error && <p role="alert" className="mb-6 p-4 bg-error-container text-error rounded-xl font-medium">{error}</p>}
      {!loading && !error && <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Total End Users</div>
          <div className="text-headline-md font-bold text-on-surface">{stats.totalUsers}</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Knowledge Base</div>
          <div className="text-headline-md font-bold text-on-surface">{stats.totalDocs} Docs</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Token Usage</div>
          <div className="text-headline-md font-bold text-on-surface">{stats.tokenUsage}</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Escalations</div>
          <div className="text-headline-md font-bold text-error">{stats.totalEscalations}</div>
        </div>
      </div>}
    </div>
  );
}