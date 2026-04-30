import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/uploads/posts';
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'editor' && user.role !== 'author')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'bad form' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file too large (max 8 MB)' }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: `unsupported type ${file.type}` }, { status: 415 });
  }

  const now = new Date();
  const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(UPLOAD_DIR, yyyymm);
  await mkdir(dir, { recursive: true });

  const ext = EXT_BY_MIME[file.type] ?? 'bin';
  const name = `${randomBytes(16).toString('hex')}.${ext}`;
  const fullPath = path.join(dir, name);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);

  const url = `/uploads/posts/${yyyymm}/${name}`;
  return NextResponse.json({ url, sizeBytes: buf.length, type: file.type });
}
