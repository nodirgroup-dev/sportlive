import { ImageResponse } from 'next/og';
import { db, posts, categories } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { siteConfig } from '@/lib/site';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) return new Response('not found', { status: 404 });

  const rows = await db
    .select({
      title: posts.title,
      summary: posts.summary,
      categoryName: categories.name,
    })
    .from(posts)
    .leftJoin(categories, eq(categories.id, posts.categoryId))
    .where(eq(posts.id, id))
    .limit(1);
  if (rows.length === 0) return new Response('not found', { status: 404 });

  const r = rows[0]!;
  const title = r.title.slice(0, 220);
  const category = (r.categoryName ?? '').toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background:
            'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
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
              letterSpacing: -1,
            }}
          >
            SL
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>sportlive.uz</div>
            {category ? (
              <div
                style={{
                  fontSize: 18,
                  color: '#dc2626',
                  fontWeight: 600,
                  letterSpacing: 2,
                }}
              >
                {category}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            fontSize: title.length > 100 ? 52 : title.length > 60 ? 64 : 76,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1,
            display: 'flex',
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: '2px solid #2a2a2a',
            fontSize: 22,
            color: '#888',
          }}
        >
          <span>{siteConfig.url.replace(/^https?:\/\//, '')}</span>
          <span>⚽ {siteConfig.publisher.name}</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
      },
    },
  );
}
