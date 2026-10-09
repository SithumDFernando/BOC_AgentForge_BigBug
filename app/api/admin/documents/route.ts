import { requireAdmin } from '@/lib/auth';
import { handle, HttpError } from '@/lib/http';
import { deleteDocument, extractText, indexDocument, listDocuments } from '@/lib/knowledge';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_REQUEST_BYTES = 5 * 1024 * 1024; // a 4 MB file plus multipart overhead

export const GET = handle(async () => {
  const admin = await requireAdmin();
  return Response.json({ documents: await listDocuments(admin.tenantId) });
});

export const POST = handle(async (req) => {
  const admin = await requireAdmin();
  if (Number(req.headers.get('content-length') ?? 0) > MAX_REQUEST_BYTES) throw new HttpError(400, 'Files can be at most 4 MB.');

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, 'Upload a PDF or TXT file.');
  }
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'Upload a PDF or TXT file.');
  const rawTitle = form.get('title');
  const title = (typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim() : file.name).slice(0, 200);

  const text = await extractText(file);
  const document = await indexDocument({ tenantId: admin.tenantId, adminId: admin.userId, title, filename: file.name, fileSize: file.size, text });
  log('INFO', 'document indexed', { tenantId: admin.tenantId, docId: document.id, chunkCount: document.chunkCount });
  return Response.json({ success: true, document });
});

export const DELETE = handle(async (req) => {
  const admin = await requireAdmin();
  const id = new URL(req.url).searchParams.get('id');
  if (!id || id.includes('/') || id.length > 200) throw new HttpError(400, 'Invalid document id.');
  await deleteDocument(admin.tenantId, id);
  return Response.json({ success: true });
});
