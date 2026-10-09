'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/components/AuthProvider';

interface Document {
  id: string;
  title: string;
  filename: string;
  status: string;
  chunkCount: number;
  createdAt: string;
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/admin/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchDocuments();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to upload document');
      }
    } catch (err) {
      setError('An error occurred during upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function confirmDelete(docId: string) {
    setDocToDelete(docId);
  }

  async function handleDeleteDocument() {
    if (!docToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/admin/documents?id=${docToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments(documents.filter(d => d.id !== docToDelete));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete document');
      }
    } catch (e) {
      setError('An error occurred during deletion');
    } finally {
      setIsDeleting(false);
      setDocToDelete(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Knowledge Base</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Upload PDF/TXT policies to augment your AI agent.</p>
        </div>
        <div>
          <input
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {uploading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
            )}
            {uploading ? 'Processing & Vectorizing...' : 'Upload Document'}
          </button>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-error-container text-error rounded-xl font-medium">{error}</div>}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Document</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Type</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Status</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Indexed Chunks</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Uploaded</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4">
                    <span className="material-symbols-outlined text-[32px]">folder_open</span>
                  </div>
                  <p className="text-on-surface font-medium">No documents uploaded yet</p>
                  <p className="text-on-surface-variant text-sm mt-1">Upload your first policy document to empower your agent.</p>
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-on-surface">{doc.title}</div>
                    <div className="text-xs text-on-surface-variant">{doc.filename}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-surface-container rounded text-xs font-code-base text-on-surface-variant uppercase">
                      {doc.filename.split('.').pop()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      doc.status === 'indexed' ? 'bg-primary-container text-on-primary-container' : 
                      doc.status === 'processing' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-error-container text-error'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant font-code-base text-sm font-semibold shadow-sm">
                      {doc.chunkCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => confirmDelete(doc.id)}
                      className="text-error hover:opacity-80 font-medium text-sm transition-opacity"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {docToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-outline-variant/30 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Delete Document</h3>
              <p className="text-on-surface-variant text-sm mb-6">
                Are you sure you want to delete this document? This will permanently remove it from the Knowledge Base, and your AI agent will no longer have access to its contents.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDocToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-surface text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors disabled:opacity-50 border border-outline-variant/30"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDocument}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-error text-white rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Document'
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