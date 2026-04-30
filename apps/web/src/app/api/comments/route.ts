import { NextRequest, NextResponse } from 'next/server';
import { db, comments, posts } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/rate-limit';
import { notifyOps } from '@/lib/notify';
import { siteConfig } from '@/lib/site';
import { moderateComment } from '@/lib/comment-moderation';

export const runtime = 'nodejs';

const ipFromRequest = (req: NextRequest) =>
  req.headers.get('cf-connecting-ip') ||
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  req.headers.get('x-real-ip') ||
  null;

export async function POST(req: NextRequest) {
  const ip0 = ipFromRequest(req) ?? 'unknown';
  const rl = await checkRateLimit(`comments:${ip0}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429, headers: { 'retry-after': String(Math.ceil(rl.resetMs / 1000)) } });
  }

  let body: { postId?: number; parentId?: number | null; name?: string | null; email?: string | null; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const postId = Number(body.postId);
  const text = (body.body ?? '').trim();
  const authorName = body.name?.toString().trim().slice(0, 100) || null;
  const authorEmail = body.email?.toString().trim().slice(0, 255) || null;
  const rawParentId = body.parentId === null || body.parentId === undefined ? null : Number(body.parentId);
  const parentId = Number.isFinite(rawParentId) && rawParentId !== null ? rawParentId : null;

  if (!Number.isFinite(postId) || text.length < 5 || text.length > 4000) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  }
  if (!authorName) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }

  const exists = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (exists.length === 0) {
    return NextResponse.json({ error: 'post not found' }, { status: 404 });
  }

  // If a parent is provided, verify it belongs to the same post and is approved.
  if (parentId !== null) {
    const parent = await db
      .select({ postId: comments.postId, status: comments.status })
      .from(comments)
      .where(eq(comments.id, parentId))
      .limit(1);
    if (parent.length === 0 || parent[0]!.postId !== postId || parent[0]!.status !== 'approved') {
      return NextResponse.json({ error: 'invalid parent' }, { status: 400 });
    }
  }

  const ip = ipFromRequest(req)?.slice(0, 45) ?? null;

  // AI moderation (best-effort): score >= 80 → spam, < 30 → auto-approve.
  const moderation = await moderateComment(text, authorName);

  let status: 'pending' | 'approved' | 'spam' = 'pending';
  if (moderation && moderation.score >= 80) status = 'spam';
  else if (moderation && moderation.score < 30) status = 'approved';

  const inserted = await db
    .insert(comments)
    .values({
      postId,
      parentId,
      authorName,
      authorEmail,
      authorIp: ip,
      body: text,
      status,
      aiSpamScore: moderation?.score ?? null,
    })
    .returning({ id: comments.id });

  if (status === 'pending') {
    notifyOps({
      text: `💬 New comment pending moderation by ${authorName}: ${text.slice(0, 100)}`,
      url: `${siteConfig.url}/7071218admin/comments`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status, id: inserted[0]?.id });
}
