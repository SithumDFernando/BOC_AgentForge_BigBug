'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newKeyString, setNewKeyString] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch('/api/admin/api-keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (res.ok) {
        const data = await res.json();
        setKeys([data.key, ...keys]);
        setNewKeyString(data.key.key);
        setName('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate key');
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  function confirmRevoke(keyId: string) {
    setKeyToDelete(keyId);
  }

  async function handleRevoke() {
    if (!keyToDelete) return;
    setIsRevoking(true);
    
    try {
      const res = await fetch(`/api/admin/api-keys?id=${keyToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setKeys(keys.filter(k => k.id !== keyToDelete));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to revoke key');
      }
    } catch (e) {
      setError('An error occurred during revocation');
    } finally {
      setIsRevoking(false);
      setKeyToDelete(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">API Keys</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Generate keys to integrate AgentForge with your backend systems.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setNewKeyString(null); }}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">vpn_key</span>
          Generate New Key
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Name</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Key Prefix</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Created</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Last Used</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">No API keys generated.</td>
              </tr>
            ) : (
              keys.map(k => (
                <tr key={k.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-on-surface">{k.name}</td>
                  <td className="px-6 py-4 font-code-base text-sm text-on-surface-variant">{k.key.substring(0, 7)}...</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => confirmRevoke(k.id)}
                      className="text-error hover:opacity-80 font-medium text-sm transition-opacity"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-outline-variant/30">
            <div className="p-6 border-b border-outline-variant/20">
              <h2 className="text-headline-sm font-bold text-on-surface">Generate API Key</h2>
            </div>
            
            {newKeyString ? (
              <div className="p-6 space-y-4">
                <div className="p-4 bg-primary-container/30 border border-primary/20 rounded-xl">
                  <p className="text-sm text-on-surface font-medium mb-3">Please copy your API key now. You will not be able to see it again.</p>
                  <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-1.5 pl-3">
                    <code className="flex-1 font-code-base text-sm text-on-surface break-all select-all">
                      {newKeyString}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newKeyString);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className={`shrink-0 p-2 rounded-md transition-colors ${copied ? 'bg-primary/10 text-primary' : 'bg-surface hover:bg-surface-container text-on-surface-variant'}`}
                      title="Copy to clipboard"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {error && <div className="p-3 bg-error-container text-error rounded-lg text-sm">{error}</div>}
                <div>
                  <label className="block text-xs font-label-caps uppercase text-on-surface-variant mb-1.5">Key Name</label>
                  <input required type="text" className="w-full px-4 py-2 bg-surface text-on-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production Backend" />
                </div>
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/20 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-medium">Cancel</button>
                  <button disabled={submitting} type="submit" className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 disabled:opacity-50">
                    {submitting ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {keyToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-outline-variant/30 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]">key_off</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Revoke API Key</h3>
              <p className="text-on-surface-variant text-sm mb-6">
                Are you sure you want to permanently revoke this API Key? Any external systems or scripts currently using this key will immediately lose access. This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setKeyToDelete(null)}
                  disabled={isRevoking}
                  className="px-4 py-2 bg-surface text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors disabled:opacity-50 border border-outline-variant/30"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="px-4 py-2 bg-error text-white rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isRevoking ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Revoking...
                    </>
                  ) : (
                    'Revoke Key'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}