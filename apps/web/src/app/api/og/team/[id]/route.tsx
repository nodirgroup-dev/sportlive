import { ImageResponse } from 'next/og';
import { db, teams, venues } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { siteConfig } from '@/lib/site';

export const runtime = 'nodejs';

const W = 1200;
const H = 630;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) return new Response('not found', { status: 404 });

  const rows = await db
    .select({
      name: teams.name,
      country: teams.country,
      founded: teams.founded,
      logo: teams.logo,
      venueName: venues.name,
      venueCity: venues.city,
    })
    .from(teams)
    .leftJoin(venues, eq(venues.id, teams.venueId))
    .where(eq(teams.id, id))
    .limit(1);
  if (rows.length === 0) return new Response('not found', { status: 404 });
  const r = rows[0]!;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          padding: 64,
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            paddingRight: 32,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 22, color: '#dc2626', fontWeight: 600, letterSpacing: 2 }}>TEAM</div>
            <div
              style={{
                fontSize: r.name.length > 22 ? 64 : 88,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
              }}
            >
              {r.name}
            </div>
            <div style={{ display: 'flex', gap: 28, fontSize: 22, color: '#a3a3a3', flexWrap: 'wrap' }}>
              {r.country ? <span>🌍 {r.country}</span> : null}
              {r.founded ? <span>📅 {r.founded}</span> : null}
              {r.venueName ? (
                <span>🏟 {r.venueName}{r.venueCity ? `, ${r.venueCity}` : ''}</span>
              ) : null}
            </div>
          </div>
          <div style={{ paddingTop: 16, borderTop: '2px solid #2a2a2a', fontSize: 20, color: '#888' }}>
            {siteConfig.url.replace(/^https?:\/\//, '')}
          </div>
        </div>
        {r.logo ? (
          <div
            style={{
              width: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              borderRadius: 24,
              padding: 32,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.logo} alt="" width={240} height={240} style={{ objectFit: 'contain' }} />
          </div>
        ) : null}
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } },
  );
}
