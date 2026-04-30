import { NextRequest, NextResponse } from 'next/server';
import { db, posts } from '@sportlive/db';
import { eq, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  // Best-effort fire-and-forget increment.
  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, id));

  return NextResponse.json({ ok: true });
}
