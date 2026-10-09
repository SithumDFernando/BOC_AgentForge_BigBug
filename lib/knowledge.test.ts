import { beforeEach, describe, expect, it, vi } from 'vitest';

// A minimal in-memory Firestore: enough for documents, chunks, batches and a scripted findNearest.
const store = vi.hoisted(() => ({
  data: new Map<string, Record<string, unknown>>(),
  nearest: [] as { id: string; distance: number }[],
  nearestQuery: undefined as unknown,
  failBatchAt: -1,
  batches: 0,
  failSet: '',
}));

vi.mock('firebase-admin/firestore', () => ({ FieldValue: { vector: (v: number[]) => ({ vector: v }) } }));
vi.mock('./log', () => ({ log: vi.fn() }));
vi.mock('./llm', () => ({ embed: vi.fn(async (texts: string[]) => texts.map(() => [1, 0])) }));
vi.mock('./db', () => {
  const snapOf = (path: string) => {
    const d = store.data.get(path);
    return { id: path.split('/')[1], exists: !!d, ref: ref(path), get: (f: string) => d?.[f] };
  };
  const ref = (path: string) => ({
    id: path.split('/')[1],
    path,
    get: async () => snapOf(path),
    set: async (v: Record<string, unknown>) => {
      if (store.failSet && path.startsWith(store.failSet)) throw new Error('write failed');
      store.data.set(path, v);
    },
    delete: async () => void store.data.delete(path),
  });
  const query = (name: string, filters: [string, unknown][]) => ({
    where: (f: string, _op: string, v: unknown) => query(name, [...filters, [f, v]]),
    get: async () => ({
      docs: [...store.data.keys()]
        .filter(k => k.startsWith(name + '/') && filters.every(([f, v]) => store.data.get(k)![f] === v))
        .map(snapOf),
    }),
    findNearest: (opts: unknown) => {
      store.nearestQuery = { filters, opts };
      return {
        get: async () => ({
          docs: store.nearest
            .filter(n => filters.every(([f, v]) => store.data.get(`knowledge_chunks/${n.id}`)?.[f] === v))
            .map(n => {
              const s = snapOf(`knowledge_chunks/${n.id}`);
              return { ...s, get: (f: string) => (f === 'distance' ? n.distance : s.get(f)) };
            }),
        }),
      };
    },
  });
  return {
    db: () => ({
      collection: (name: string) => ({ ...query(name, []), doc: (id: string) => ref(`${name}/${id}`) }),
      batch: () => {
        const ops: (() => void)[] = [];
        return {
          set: (r: { path: string }, v: Record<string, unknown>) => void ops.push(() => store.data.set(r.path, v)),
          delete: (r: { path: string }) => void ops.push(() => store.data.delete(r.path)),
          commit: async () => {
            if (store.batches++ === store.failBatchAt) throw new Error('batch failed');
            ops.forEach(op => op());
          },
        };
      },
    }),
  };
});

import { embed } from './llm';
import { chunkText, deleteDocument, indexDocument, searchKnowledge } from './knowledge';
import { HttpError } from './http';

const base = { tenantId: 'tnt_walkwave', adminId: 'walkwave_admin', title: 'Walkwave policies', filename: 'p.txt', fileSize: 10 };
const chunkKeys = () => [...store.data.keys()].filter(k => k.startsWith('knowledge_chunks/'));

beforeEach(() => {
  store.data.clear();
  store.nearest = [];
  store.failBatchAt = -1;
  store.batches = 0;
  store.failSet = '';
  vi.mocked(embed).mockImplementation(async (texts: string[]) => texts.map(() => [1, 0]));
});

describe('chunkText', () => {
  it('splits 3000 characters into 3 chunks with a 200-character overlap', () => {
    const text = Array.from({ length: 3000 }, (_, i) => String.fromCharCode(97 + (i % 26))).join('');
    const chunks = chunkText(text);
    expect(chunks.map(c => c.length)).toEqual([1300, 1300, 800]);
    expect(chunks[0].slice(1100)).toBe(chunks[1].slice(0, 200));
  });
  it('rejects empty and over-long text with a 400', () => {
    expect(() => chunkText(' \r\n ')).toThrow(HttpError);
    expect(() => chunkText('x'.repeat(80_001))).toThrow(/80,000/);
  });
});

describe('indexDocument', () => {
  it('writes vector chunks, then the indexed document', async () => {
    const doc = await indexDocument({ ...base, text: 'Returns within 30 days.', docId: 'd1' });
    expect(doc).toMatchObject({ id: 'd1', status: 'indexed', chunkCount: 1 });
    expect(store.data.get('knowledge_chunks/d1_0')).toMatchObject({ tenantId: 'tnt_walkwave', docId: 'd1', embedding: { vector: [1, 0] } });
    expect(store.data.get('documents/d1')).toMatchObject({ status: 'indexed', tenantId: 'tnt_walkwave' });
  });
  it('writes nothing when embedding fails', async () => {
    vi.mocked(embed).mockRejectedValueOnce(new Error('down'));
    await expect(indexDocument({ ...base, text: 'abc', docId: 'd1' })).rejects.toThrow('down');
    expect(store.data.size).toBe(0);
  });
  it('deletes the chunks already written when the document write fails', async () => {
    store.failSet = 'documents/';
    await expect(indexDocument({ ...base, text: 'y'.repeat(3000), docId: 'd1' })).rejects.toThrow('write failed');
    expect(chunkKeys()).toEqual([]);
    expect(store.data.has('documents/d1')).toBe(false);
  });
  it('writes no chunks when the chunk batch fails', async () => {
    store.failBatchAt = 0;
    await expect(indexDocument({ ...base, text: 'abc', docId: 'd1' })).rejects.toThrow('batch failed');
    expect(store.data.size).toBe(0);
  });
  it('replaces old chunks when re-indexing a fixed id', async () => {
    await indexDocument({ ...base, text: 'y'.repeat(3000), docId: 'seed' });
    expect(chunkKeys()).toHaveLength(3);
    await indexDocument({ ...base, text: 'short', docId: 'seed' });
    expect(chunkKeys()).toEqual(['knowledge_chunks/seed_0']);
  });
  it("refuses to overwrite another tenant's document id", async () => {
    store.data.set('documents/d1', { tenantId: 'tnt_nova', status: 'indexed' });
    await expect(indexDocument({ ...base, text: 'abc', docId: 'd1' })).rejects.toMatchObject({ status: 404 });
  });
});

describe('deleteDocument', () => {
  it("deletes the document and its chunks, and 404s for another tenant's document", async () => {
    await indexDocument({ ...base, text: 'y'.repeat(3000), docId: 'd1' });
    await expect(deleteDocument('tnt_nova', 'd1')).rejects.toMatchObject({ status: 404 });
    await deleteDocument('tnt_walkwave', 'd1');
    expect(store.data.size).toBe(0);
  });
});

describe('searchKnowledge', () => {
  beforeEach(() => {
    store.data.set('documents/d1', { tenantId: 'tnt_walkwave', status: 'indexed', title: 'Walkwave policies' });
    store.data.set('knowledge_chunks/d1_0', { tenantId: 'tnt_walkwave', docId: 'd1', content: 'Returns within 30 days.' });
    store.data.set('knowledge_chunks/d1_1', { tenantId: 'tnt_walkwave', docId: 'd1', content: 'Delivery LKR 350.' });
    store.data.set('knowledge_chunks/gone_0', { tenantId: 'tnt_walkwave', docId: 'gone', content: 'Orphan chunk.' });
    store.data.set('documents/n1', { tenantId: 'tnt_nova', status: 'indexed', title: 'Nova policies' });
    store.data.set('knowledge_chunks/n1_0', { tenantId: 'tnt_nova', docId: 'n1', content: 'Nova returns.' });
  });

  it('uses a tenant-filtered cosine findNearest and keeps close chunks of indexed documents only', async () => {
    store.nearest = [{ id: 'd1_0', distance: 0.1 }, { id: 'gone_0', distance: 0.05 }, { id: 'n1_0', distance: 0.01 }, { id: 'd1_1', distance: 0.95 }];
    const out = await searchKnowledge('tnt_walkwave', 'return policy?');
    expect(store.nearestQuery).toEqual({
      filters: [['tenantId', 'tnt_walkwave']],
      opts: { vectorField: 'embedding', queryVector: [1, 0], limit: 5, distanceMeasure: 'COSINE', distanceResultField: 'distance' },
    });
    expect(out).toEqual({ text: 'Returns within 30 days.', sources: ['Walkwave policies'] });
    expect(embed).toHaveBeenCalledWith(['return policy?'], 'query');
  });

  it('returns nothing when no chunk is close enough', async () => {
    store.nearest = [{ id: 'd1_1', distance: 0.81 }];
    expect(await searchKnowledge('tnt_walkwave', 'q')).toEqual({ text: '', sources: [] });
  });

  it('returns nothing when the tenant has no indexed documents', async () => {
    expect(await searchKnowledge('tnt_other', 'q')).toEqual({ text: '', sources: [] });
  });
});
