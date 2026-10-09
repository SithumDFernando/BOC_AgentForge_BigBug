'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthProvider';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshSession } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      await refreshSession();
      router.push('/admin/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface w-full">
      <div className="w-full max-w-md p-8 bg-surface-container-low rounded-xl shadow-lg border border-outline-variant/20">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[24px]">domain</span>
          </div>
        </div>
        <h1 className="text-headline-md font-bold text-on-surface text-center">Business Admin Login</h1>
        <p className="text-center text-on-surface-variant font-body-sm mt-2 mb-6">Access your tenant control plane</p>
        
        {error && <div className="mb-4 p-3 bg-error-container text-error rounded-lg text-sm text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}