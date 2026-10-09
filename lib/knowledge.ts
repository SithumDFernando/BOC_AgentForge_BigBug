import { randomUUID } from 'node:crypto';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { db } from './db';
import { HttpError } from './http';
import { embed } from './llm';
import { log } from './log';

// Policy documents: extract → chunk → embed → Firestore vectors; tenant-filtered findNearest search (D23).

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_CHARS = 80_000;
const WINDOW = 1300;
const STEP = 1100;
const BATCH = 400;
const MAX_DISTANCE = 0.8; // cosine distance; similarity ≥ 0.2

export type DocumentSummary = {
  id: string;
  title: string;
  filename: string;
  status: 'indexed';
  chunkCount: number;
  fileSize: number;
  createdAt: string;
};

export async function extractText(file: File): Promise<string> {
  if (file.size < 1) throw new HttpError(400, 'The file is empty.');
  if (file.size > MAX_BYTES) throw new HttpError(400, 'Files can be at most 4 MB.');
  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (name.endsWith('.txt')) return new TextDecoder('utf-8').decode(bytes);
  if (!name.endsWith('.pdf')) throw new HttpError(400, 'Please upload a PDF or TXT file.');
  // Load the parser and its canvas polyfills only for PDF uploads, so chat and search never start PDF.js.
  const { CanvasFactory, getData } = await import('pdf-parse/worker');
  const { PDFParse } = await import('pdf-parse');
  PDFParse.setWorker(getData());
  const parser = new PDFParse({ data: bytes, CanvasFactory });
  try {
    return (await parser.getText()).text;
  } catch (err) {
    log('WARNING', 'pdf parse failed', { error: String(err).slice(0, 200) });
    throw new HttpError(400, "This PDF couldn't be read. Upload a PDF with selectable text, or a TXT file.");
  } finally {
    await parser.destroy();
  }
}

export function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n?/g, '\n').trim();
  if (!clean) throw new HttpError(400, 'No readable text found. Use a PDF with selectable text; scanned PDFs need OCR.');
  if (clean.length > MAX_CHARS) throw new HttpError(400, 'This document is too long for the demo (maximum 80,000 characters).');
  const chunks: string[] = [];
  for (let start = 0; ; start += STEP) {
    chunks.push(clean.slice(start, start + WINDOW));
    if (start + WINDOW >= clean.length) break;
  }
  return chunks;
}

async function deleteRefs(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += BATCH) {
    const batch = db().batch();
    for (const ref of refs.slice(i, i + BATCH)) batch.delete(ref);
    await batch.commit();
  }
}

async function chunkRefs(tenantId: string, docId: string) {
  const snap = await db().collection('knowledge_chunks').where('tenantId', '==', tenantId).where('docId', '==', docId).get();
  return snap.docs.map(d => d.ref);
}

// The document record is written only after every chunk is stored; on failure, written chunks are removed.
export async function indexDocument(i: {
  tenantId: string;
  adminId: string;
  title: string;
  filename: string;
  fileSize: number;
  text: string;
  docId?: string;
}): Promise<DocumentSummary> {
  const docId = i.docId ?? randomUUID();
  const docRef = db().collection('documents').doc(docId);
  const existing = await docRef.get();
  if (existing.exists && existing.get('tenantId') !== i.tenantId) throw new HttpError(404, 'Document not found.');

  const chunks = chunkText(i.text);
  const vectors = await embed(chunks, 'document'); // nothing is written if this fails

  // Re-indexing a fixed id (the seed): replace the old chunks.
  await deleteRefs(await chunkRefs(i.tenantId, docId));

  const createdAt = new Date().toISOString();
  const written: DocumentReference[] = [];
  try {
    for (let start = 0; start < chunks.length; start += BATCH) {
      const batch = db().batch();
      const refs: DocumentReference[] = [];
      for (let n = start; n < Math.min(start + BATCH, chunks.length); n++) {
        const ref = db().collection('knowledge_chunks').doc(`${docId}_${n}`);
        batch.set(ref, { tenantId: i.tenantId, docId, title: i.title, index: n, content: chunks[n], embedding: FieldValue.vector(vectors[n]), createdAt });
        refs.push(ref);
      }
      await batch.commit();
      written.push(...refs);
    }
    const summary: DocumentSummary = { id: docId, title: i.title, filename: i.filename, status: 'indexed', chunkCount: chunks.length, fileSize: i.fileSize, createdAt };
    await docRef.set({ tenantId: i.tenantId, uploadedBy: i.adminId, title: i.title, filename: i.filename, status: 'indexed', chunkCount: chunks.length, fileSize: i.fileSize, createdAt });
    return summary;
  } catch (err) {
    try {
      await deleteRefs(written);
    } catch (cleanup) {
      log('ERROR', 'chunk rollback failed', { tenantId: i.tenantId, docId, error: String(cleanup) });
    }
    throw err;
  }
}

export async function listDocuments(tenantId: string): Promise<DocumentSummary[]> {
  const snap = await db().collection('documents').where('tenantId', '==', tenantId).get();
  return snap.docs
    .filter(d => d.get('status') === 'indexed')
    .map(d => ({
      id: d.id,
      title: String(d.get('title') ?? ''),
      filename: String(d.get('filename') ?? ''),
      status: 'indexed' as const,
      chunkCount: Number(d.get('chunkCount') ?? 0),
      fileSize: Number(d.get('fileSize') ?? 0),
      createdAt: String(d.get('createdAt') ?? ''),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// The document goes first, so search stops using it at once; then its chunks.
export async function deleteDocument(tenantId: string, docId: string): Promise<void> {
  const ref = db().collection('documents').doc(docId);
  const snap = await ref.get();
  if (!snap.exists || snap.get('tenantId') !== tenantId) throw new HttpError(404, 'Document not found.');
  await ref.delete();
  await deleteRefs(await chunkRefs(tenantId, docId));
}

export async function searchKnowledge(tenantId: string, question: string): Promise<{ text: string; sources: string[] }> {
  const [[queryVector], docs] = await Promise.all([
    embed([question], 'query'),
    db().collection('documents').where('tenantId', '==', tenantId).get(),
  ]);
  const titles = new Map(docs.docs.filter(d => d.get('status') === 'indexed').map(d => [d.id, String(d.get('title') ?? 'Company policy')]));
  if (!titles.size) return { text: '', sources: [] };

  let snap;
  try {
    snap = await db()
      .collection('knowledge_chunks')
      .where('tenantId', '==', tenantId)
      .findNearest({ vectorField: 'embedding', queryVector, limit: 5, distanceMeasure: 'COSINE', distanceResultField: 'distance' })
      .get();
  } catch (err) {
    if ((err as { code?: unknown }).code === 9) {
      log('ERROR', 'vector index missing: create it with the command in docs/THIRD_PARTY_SETUP.md §2 step 7', { tenantId });
    }
    throw err;
  }
  const hits = snap.docs.filter(d => Number(d.get('distance')) <= MAX_DISTANCE && titles.has(String(d.get('docId'))));
  if (!hits.length) return { text: '', sources: [] };
  return {
    text: hits.map(d => String(d.get('content') ?? '')).join('\n---\n'),
    sources: [...new Set(hits.map(d => titles.get(String(d.get('docId')))!))],
  };
}
