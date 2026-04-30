import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/uploads/posts';
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
const TARGET_WIDTH = 1600;
const QUALITY = 82;

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

  const inBuf = Buffer.from(await file.arrayBuffer());

  // Convert + resize to WebP. Animated GIFs keep their original format and
  // skip the resize step (sharp would flatten them).
  let outBuf = inBuf;
  let outName = `${randomBytes(16).toString('hex')}`;
  let outType = file.type;
  let width: number | null = null;
  let height: number | null = null;

  if (file.type === 'image/gif') {
    outName += '.gif';
  } else {
    try {
      const sharp = (await import('sharp')).default;
      const pipeline = sharp(inBuf, { failOn: 'none' }).rotate(); // EXIF orientation
      const meta = await pipeline.metadata();
      const w = meta.width ?? TARGET_WIDTH;
      const resize = w > TARGET_WIDTH
        ? pipeline.resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        : pipeline;
      const out = await resize.webp({ quality: QUALITY, effort: 4 }).toBuffer({ resolveWithObject: true });
      outBuf = Buffer.from(out.data);
      width = out.info.width;
      height = out.info.height;
      outName += '.webp';
      outType = 'image/webp';
    } catch (e) {
      // Fall back to raw upload if sharp fails (e.g. exotic format).
      console.error('[upload] sharp failed, saving raw', e);
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1] || 'bin';
      outName += `.${ext}`;
    }
  }

  const fullPath = path.join(dir, outName);
  await writeFile(fullPath, outBuf);

  const url = `/uploads/posts/${yyyymm}/${outName}`;
  return NextResponse.json({
    url,
    sizeBytes: outBuf.length,
    originalBytes: inBuf.length,
    type: outType,
    width,
    height,
  });
}
