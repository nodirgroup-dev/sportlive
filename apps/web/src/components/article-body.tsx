import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import type { Locale } from '@/i18n/routing';
import { getFixtureById, getTeamById } from '@/lib/db';

// Matches [fixture id=N], [team id=N], [youtube id=ABC], [tweet id=NNNN]
const SHORTCODE_RE = /\[(fixture|team|youtube|tweet)\s+id=([A-Za-z0-9_-]+)\s*\]/gi;

type Chunk =
  | { type: 'html'; value: string }
  | { type: 'fixture'; id: number }
  | { type: 'team'; id: number }
  | { type: 'youtube'; id: string }
  | { type: 'tweet'; id: string };

function splitBody(html: string): Chunk[] {
  const chunks: Chunk[] = [];
  let lastIndex = 0;
  for (const m of html.matchAll(SHORTCODE_RE)) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) chunks.push({ type: 'html', value: html.slice(lastIndex, idx) });
    const kind = m[1]!.toLowerCase() as 'fixture' | 'team' | 'youtube' | 'tweet';
    const raw = m[2]!;
    if (kind === 'fixture' || kind === 'team') {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n)) chunks.push({ type: kind, id: n });
    } else if (kind === 'youtube' || kind === 'tweet') {
      if (raw.length > 0 && raw.length <= 64) chunks.push({ type: kind, id: raw });
    }
    lastIndex = idx + m[0].length;
  }
  if (lastIndex < html.length) chunks.push({ type: 'html', value: html.slice(lastIndex) });
  return chunks;
}

function YouTubeEmbed({ id }: { id: string }) {
  return (
    <div className="my-6 overflow-hidden rounded-lg shadow-sm" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0`}
        title="YouTube"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
    </div>
  );
}

function TweetEmbed({ id }: { id: string }) {
  // No external script: render a clean link card. Twitter/X has been hostile
  // to oEmbed lately and the platform script bloats pages — link is good enough.
  return (
    <a
      href={`https://twitter.com/i/web/status/${encodeURIComponent(id)}`}
      target="_blank"
      rel="noreferrer"
      className="my-6 block rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-brand-400"
    >
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
        <span style={{ fontWeight: 700, color: '#0f1419' }} className="dark:!text-neutral-200">𝕏</span>
        <span>twitter.com</span>
      </div>
      <div className="text-sm font-medium">View this post on X →</div>
      <div className="mt-1 break-all text-xs text-neutral-500">/i/web/status/{id}</div>
    </a>
  );
}

async function FixtureEmbed({ id, locale }: { id: number; locale: Locale }) {
  const f = await getFixtureById(id);
  if (!f) return null;
  const live = ['1H', '2H', 'HT', 'ET', 'P'].includes(f.statusShort);
  const finished = ['FT', 'AET', 'PEN'].includes(f.statusShort);
  const showScore = live || finished;
  const date = new Intl.DateTimeFormat(
    locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
  ).format(f.kickoffAt);

  return (
    <Link
      href={`/match/${f.id}` as Route}
      className="my-6 block rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-brand-500 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-brand-400 dark:hover:bg-neutral-900"
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
        {f.league.logo ? (
          <Image src={f.league.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" unoptimized />
        ) : null}
        <span className="font-medium">{f.league.name}</span>
        <span>·</span>
        <time dateTime={f.kickoffAt.toISOString()}>{date}</time>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="flex items-center justify-end gap-2 truncate text-right">
          <span className="truncate text-sm font-semibold sm:text-base">{f.homeTeam.name}</span>
          {f.homeTeam.logo ? (
            <Image src={f.homeTeam.logo} alt="" width={28} height={28} className="h-6 w-6 flex-shrink-0 object-contain sm:h-8 sm:w-8" unoptimized />
          ) : null}
        </div>
        <div className={`text-center font-mono ${live ? 'font-bold text-red-600' : 'font-semibold'}`}>
          {showScore ? <>{f.homeGoals ?? 0} : {f.awayGoals ?? 0}</> : <span className="text-neutral-400">vs</span>}
        </div>
        <div className="flex items-center gap-2 truncate">
          {f.awayTeam.logo ? (
            <Image src={f.awayTeam.logo} alt="" width={28} height={28} className="h-6 w-6 flex-shrink-0 object-contain sm:h-8 sm:w-8" unoptimized />
          ) : null}
          <span className="truncate text-sm font-semibold sm:text-base">{f.awayTeam.name}</span>
        </div>
      </div>
    </Link>
  );
}

async function TeamEmbed({ id }: { id: number; locale: Locale }) {
  const t = await getTeamById(id);
  if (!t) return null;
  return (
    <Link
      href={`/team/${t.id}` as Route}
      className="my-6 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-brand-500 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-brand-400 dark:hover:bg-neutral-900"
    >
      {t.logo ? (
        <Image src={t.logo} alt="" width={48} height={48} className="h-12 w-12 flex-shrink-0 object-contain" unoptimized />
      ) : null}
      <div className="min-w-0">
        <div className="text-sm font-semibold sm:text-base">{t.name}</div>
        <div className="text-xs text-neutral-500">
          {t.country ?? ''}{t.country && t.founded ? ' · ' : ''}{t.founded ? `с ${t.founded}` : ''}
        </div>
      </div>
    </Link>
  );
}

export async function ArticleBody({ html, locale }: { html: string; locale: Locale }) {
  const chunks = splitBody(html);
  return (
    <div className="article-body">
      {chunks.map((c, i) => {
        if (c.type === 'html') {
          return <div key={i} dangerouslySetInnerHTML={{ __html: c.value }} />;
        }
        if (c.type === 'fixture') {
          return <FixtureEmbed key={i} id={c.id} locale={locale} />;
        }
        if (c.type === 'team') {
          return <TeamEmbed key={i} id={c.id} locale={locale} />;
        }
        if (c.type === 'youtube') {
          return <YouTubeEmbed key={i} id={c.id} />;
        }
        return <TweetEmbed key={i} id={c.id} />;
      })}
    </div>
  );
}
