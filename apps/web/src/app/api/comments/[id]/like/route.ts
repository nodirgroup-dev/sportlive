import { NextRequest, NextResponse } from 'next/server';
import { db, comments } from '@sportlive/db';
import { eq, sql } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const ipFromRequest = (req: NextRequest) =>
  req.headers.get('cf-connecting-ip') ||
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  req.headers.get('x-real-ip') ||
  'unknown';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const ip = ipFromRequest(req);
  const rl = await checkRateLimit(`commentLike:${id}:${ip}`, 1, 24 * 60 * 60_000);
  if (!rl.ok) return NextResponse.json({ ok: true, throttled: true });

  const r = await db
    .update(comments)
    .set({ likeCount: sql`${comments.likeCount} + 1` })
    .where(eq(comments.id, id))
    .returning({ likeCount: comments.likeCount });
  if (r.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, likeCount: r[0]!.likeCount });
}
