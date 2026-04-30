import { ImageResponse } from 'next/og';
import { db, tags } from '@sportlive/db';
import { and, eq } from 'drizzle-orm';
import { hasLocale } from '@/i18n/routing';
import { siteConfig } from '@/lib/site';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const localeRaw = url.searchParams.get('locale') ?? 'uz';
  const locale = hasLocale(localeRaw) ? localeRaw : 'uz';

  const rows = await db
    .select({ name: tags.name })
    .from(tags)
    .where(and(eq(tags.locale, locale), eq(tags.slug, slug)))
    .limit(1);
  if (rows.length === 0) return new Response('not found', { status: 404 });

  const name = rows[0]!.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            SL
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>sportlive.uz</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 26, color: '#dc2626', fontWeight: 600, letterSpacing: 2 }}>TAG</div>
          <div
            style={{
              fontSize: name.length > 24 ? 96 : 132,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              display: 'flex',
            }}
          >
            #{name}
          </div>
        </div>
        <div style={{ paddingTop: 24, borderTop: '2px solid #2a2a2a', fontSize: 22, color: '#888' }}>
          {siteConfig.url.replace(/^https?:\/\//, '')}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' },
    },
  );
}
