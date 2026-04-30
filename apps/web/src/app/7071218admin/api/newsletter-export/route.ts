import { NextResponse } from 'next/server';
import { db, newsletterSubscribers } from '@sportlive/db';
import { asc, isNull } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

function csvEscape(v: string | null): string {
  const s = v ?? '';
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const rows = await db
    .select({
      email: newsletterSubscribers.email,
      locale: newsletterSubscribers.locale,
      createdAt: newsletterSubscribers.createdAt,
      ip: newsletterSubscribers.ip,
    })
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt))
    .orderBy(asc(newsletterSubscribers.createdAt));

  const lines = ['email,locale,created_at,ip'];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.email),
        csvEscape(r.locale),
        csvEscape(r.createdAt.toISOString()),
        csvEscape(r.ip),
      ].join(','),
    );
  }
  const csv = lines.join('\n') + '\n';

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="sportlive-newsletter-${today}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
