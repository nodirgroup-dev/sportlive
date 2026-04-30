import { NextRequest, NextResponse } from 'next/server';
import { db, posts } from '@sportlive/db';
import { and, eq, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN = process.env.CRON_SECRET;

function authorized(req: NextRequest): boolean {
  if (!TOKEN) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${TOKEN}` || req.nextUrl.searchParams.get('token') === TOKEN;
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Promote scheduled posts whose publishedAt is in the past.
  const flipped = await db
    .update(posts)
    .set({ status: 'published', updatedAt: new Date() })
    .where(
      and(
        eq(posts.status, 'scheduled'),
        sql`${posts.publishedAt} IS NOT NULL`,
        lte(posts.publishedAt, new Date()),
      ),
    )
    .returning({ id: posts.id, slug: posts.slug, locale: posts.locale });

  if (flipped.length > 0) {
    revalidatePath('/');
    revalidatePath('/7071218admin/news');
  }

  return NextResponse.json({ ok: true, published: flipped });
}
