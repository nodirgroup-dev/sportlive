import { NextRequest, NextResponse } from 'next/server';
import { db, comments, posts } from '@sportlive/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const ipFromRequest = (req: NextRequest) =>
  req.headers.get('cf-connecting-ip') ||
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  req.headers.get('x-real-ip') ||
  null;

export async function POST(req: NextRequest) {
  let body: { postId?: number; name?: string | null; email?: string | null; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const postId = Number(body.postId);
  const text = (body.body ?? '').trim();
  const authorName = body.name?.toString().trim().slice(0, 100) || null;
  const authorEmail = body.email?.toString().trim().slice(0, 255) || null;

  if (!Number.isFinite(postId) || text.length < 5 || text.length > 4000) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  }
  if (!authorName) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }

  // Sanity: post exists
  const exists = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (exists.length === 0) {
    return NextResponse.json({ error: 'post not found' }, { status: 404 });
  }

  const ip = ipFromRequest(req)?.slice(0, 45) ?? null;

  await db.insert(comments).values({
    postId,
    authorName,
    authorEmail,
    authorIp: ip,
    body: text,
    status: 'pending',
  });

  return NextResponse.json({ ok: true, status: 'pending' });
}
