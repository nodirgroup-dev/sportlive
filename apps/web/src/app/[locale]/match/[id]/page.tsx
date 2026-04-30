import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import { getFixtureById, getLiveEntries, getMatchLineups, getHeadToHead } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

const localeFmt: Record<Locale, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

const STATUS_LABEL: Record<string, Record<Locale, string>> = {
  NS: { uz: "Boshlanmagan", ru: 'Не начат', en: 'Not started' },
  TBD: { uz: "Vaqt belgilanmagan", ru: 'Время не определено', en: 'TBD' },
  '1H': { uz: '1-bo\'lim', ru: 'Первый тайм', en: '1st half' },
  HT: { uz: 'Tanaffus', ru: 'Перерыв', en: 'Half time' },
  '2H': { uz: '2-bo\'lim', ru: 'Второй тайм', en: '2nd half' },
  ET: { uz: 'Qo\'shimcha vaqt', ru: 'Доп. время', en: 'Extra time' },
  P: { uz: 'Penaltilar', ru: 'Серия пенальти', en: 'Penalties' },
  FT: { uz: 'Yakunlandi', ru: 'Завершён', en: 'Full time' },
  AET: { uz: 'Yakunlandi (qo\'sh.)', ru: 'Завершён (доп.)', en: 'After extra time' },
  PEN: { uz: 'Yakunlandi (pen.)', ru: 'Завершён (пен.)', en: 'After penalties' },
  PST: { uz: "Ko'chirilgan", ru: 'Перенесён', en: 'Postponed' },
  CANC: { uz: 'Bekor qilingan', ru: 'Отменён', en: 'Cancelled' },
  ABD: { uz: 'To\'xtatilgan', ru: 'Прерван', en: 'Abandoned' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id: idStr } = await params;
  if (!hasLocale(locale)) return {};
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) return {};
  const f = await getFixtureById(id);
  if (!f) return {};
  const title = `${f.homeTeam.name} vs ${f.awayTeam.name}`;
  return {
    title: `${title} — ${f.league.name}`,
    description: f.venue ? `${f.venue.name}, ${f.venue.city ?? ''}` : title,
    alternates: { canonical: absoluteUrl(localePath(locale, `/match/${id}`)) },
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: idStr } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();
  const f = await getFixtureById(id);
  if (!f) notFound();

  const live = ['1H', '2H', 'HT', 'ET', 'P'].includes(f.statusShort);
  const finished = ['FT', 'AET', 'PEN'].includes(f.statusShort);
  const showScore = live || finished;
  const statusText = STATUS_LABEL[f.statusShort]?.[locale] ?? f.statusShort;

  const date = new Intl.DateTimeFormat(localeFmt[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(f.kickoffAt);

  const eventsRaw = (f.raw as { events?: unknown[] } | null)?.events ?? [];
  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  const [liveEntries, lineups, h2h] = await Promise.all([
    getLiveEntries(id),
    getMatchLineups(id),
    getHeadToHead(f.homeTeam.id, f.awayTeam.id, 5),
  ]);

  const TYPE_LABEL: Record<string, string> = {
    comment: '💬',
    goal: '⚽',
    yellow_card: '🟨',
    red_card: '🟥',
    sub: '🔄',
    var: '📺',
    kickoff: '🟢',
    half_time: '⏸',
    full_time: '🏁',
    general: '📢',
  };
  const TYPE_TINT: Record<string, string> = {
    goal: 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30',
    yellow_card: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/30',
    red_card: 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30',
    sub: 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30',
    var: 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-900/30',
  };

  const matchUrl = absoluteUrl(localePath(locale, `/match/${id}`));
  const matchEnd = new Date(f.kickoffAt.getTime() + 110 * 60 * 1000);
  const eventStatus = finished
    ? 'https://schema.org/EventScheduled'
    : f.statusShort === 'PST'
      ? 'https://schema.org/EventPostponed'
      : f.statusShort === 'CANC'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${f.homeTeam.name} vs ${f.awayTeam.name}`,
    sport: 'Football',
    startDate: f.kickoffAt.toISOString(),
    endDate: matchEnd.toISOString(),
    eventStatus,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: matchUrl,
    location: f.venue
      ? {
          '@type': 'Place',
          name: f.venue.name,
          address: f.venue.city ? { '@type': 'PostalAddress', addressLocality: f.venue.city } : undefined,
        }
      : { '@type': 'VirtualLocation', url: matchUrl },
    homeTeam: { '@type': 'SportsTeam', name: f.homeTeam.name, logo: f.homeTeam.logo ?? undefined },
    awayTeam: { '@type': 'SportsTeam', name: f.awayTeam.name, logo: f.awayTeam.logo ?? undefined },
    competitor: [
      { '@type': 'SportsTeam', name: f.homeTeam.name },
      { '@type': 'SportsTeam', name: f.awayTeam.name },
    ],
    organizer: { '@type': 'Organization', name: f.league.name },
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm text-neutral-500">
          {f.league.logo ? (
            <Image src={f.league.logo} alt="" width={24} height={24} className="h-5 w-5 object-contain" />
          ) : null}
          <span>{f.league.name}</span>
          {f.round ? <span className="text-neutral-400">· {f.round}</span> : null}
        </div>

        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          <Link
            href={`/team/${f.homeTeam.id}` as Route}
            className="flex flex-col items-center gap-2 text-center hover:text-brand-700"
          >
            {f.homeTeam.logo ? (
              <Image src={f.homeTeam.logo} alt="" width={64} height={64} className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
            ) : null}
            <span className="text-sm font-bold sm:text-lg">{f.homeTeam.name}</span>
          </Link>

          <div className="text-center">
            {showScore ? (
              <div className={`font-mono text-3xl font-bold sm:text-5xl ${live ? 'text-red-600' : ''}`}>
                {f.homeGoals ?? 0} : {f.awayGoals ?? 0}
              </div>
            ) : (
              <div className="text-2xl font-bold text-neutral-400 sm:text-3xl">vs</div>
            )}
            <div className={`mt-2 text-xs font-semibold uppercase tracking-wider ${live ? 'text-red-600' : 'text-neutral-500'}`}>
              {live && f.elapsed ? `${f.elapsed}'` : statusText}
            </div>
          </div>

          <Link
            href={`/team/${f.awayTeam.id}` as Route}
            className="flex flex-col items-center gap-2 text-center hover:text-brand-700"
          >
            {f.awayTeam.logo ? (
              <Image src={f.awayTeam.logo} alt="" width={64} height={64} className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
            ) : null}
            <span className="text-sm font-bold sm:text-lg">{f.awayTeam.name}</span>
          </Link>
        </div>

        <div className="text-sm text-neutral-500">{date}</div>
        {f.venue ? (
          <div className="mt-1 text-sm text-neutral-500">
            🏟 {f.venue.name}
            {f.venue.city ? `, ${f.venue.city}` : ''}
          </div>
        ) : null}
        {f.refereeName ? <div className="mt-1 text-xs text-neutral-500">🟡 {f.refereeName}</div> : null}
      </header>

      {h2h.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {locale === 'uz' ? "O'zaro o'yinlar" : locale === 'ru' ? 'Личные встречи' : 'Head-to-head'}
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            {h2h.map((m) => (
              <Link
                key={m.id}
                href={`/match/${m.id}` as Route}
                className="grid grid-cols-[80px_1fr_60px_1fr] items-center gap-2 border-b border-neutral-100 px-3 py-2 text-sm last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                <time className="font-mono text-xs text-neutral-500" dateTime={m.kickoffAt.toISOString()}>
                  {new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: 'short', year: '2-digit' }).format(m.kickoffAt)}
                </time>
                <div className="truncate text-right font-medium">{m.homeTeam.name}</div>
                <div className="text-center font-mono font-bold tabular-nums">
                  {m.homeGoals ?? 0} : {m.awayGoals ?? 0}
                </div>
                <div className="truncate font-medium">{m.awayTeam.name}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {lineups.length > 0 ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {lineups.map((l) => (
            <div
              key={l.team.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <header className="mb-3 flex items-center gap-2">
                {l.team.logo ? (
                  <Image src={l.team.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                ) : null}
                <span className="text-sm font-bold">{l.team.name}</span>
                {l.formation ? (
                  <span className="ml-auto rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs dark:bg-neutral-800">
                    {l.formation}
                  </span>
                ) : null}
              </header>
              {l.coachName ? (
                <div className="mb-2 text-xs text-neutral-500">👤 {l.coachName}</div>
              ) : null}
              <ol className="space-y-1 text-xs">
                {l.startXi.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-[10px] font-bold dark:bg-neutral-800">
                      {p.number ?? '·'}
                    </span>
                    <span className="font-medium">{p.name}</span>
                    {p.pos ? <span className="ml-auto text-neutral-500">{p.pos}</span> : null}
                  </li>
                ))}
              </ol>
              {l.substitutes.length > 0 ? (
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-neutral-500">
                    Substitutes ({l.substitutes.length})
                  </summary>
                  <ol className="mt-2 space-y-1">
                    {l.substitutes.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 text-neutral-500">
                        <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 font-mono text-[10px] dark:bg-neutral-900">
                          {p.number ?? '·'}
                        </span>
                        <span>{p.name}</span>
                        {p.pos ? <span className="ml-auto">{p.pos}</span> : null}
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {liveEntries.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {locale === 'uz' ? 'Jonli sharh' : locale === 'ru' ? 'Live-блог' : 'Live blog'}
          </h2>
          <div className="space-y-3">
            {liveEntries.map((e) => (
              <article
                key={e.id}
                className={`rounded-lg border p-4 ${TYPE_TINT[e.type] ?? 'bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800'}`}
              >
                <header className="mb-1 flex items-center gap-2 text-sm">
                  {e.minute !== null ? (
                    <span className="font-mono text-base font-bold">{e.minute}&apos;</span>
                  ) : null}
                  <span className="text-base">{TYPE_LABEL[e.type] ?? '·'}</span>
                  {e.pinned ? (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      📌 Pinned
                    </span>
                  ) : null}
                  <time className="ml-auto text-xs text-neutral-500" dateTime={e.occurredAt.toISOString()}>
                    {new Intl.DateTimeFormat(localeFmt[locale], { hour: '2-digit', minute: '2-digit' }).format(e.occurredAt)}
                  </time>
                </header>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{e.body}</p>
                {e.embedUrl ? (
                  <a
                    href={e.embedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-brand-700 hover:underline"
                  >
                    ↗ {e.embedUrl}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {events.length > 0 ? (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {locale === 'uz' ? 'Voqealar' : locale === 'ru' ? 'События' : 'Events'}
          </h2>
          <ul className="space-y-2 text-sm">
            {events.map((e, i) => {
              const ev = e as { time?: { elapsed?: number; extra?: number }; team?: { name?: string }; player?: { name?: string }; type?: string; detail?: string };
              return (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="w-12 font-mono text-xs text-neutral-500">
                    {ev.time?.elapsed}&#39;{ev.time?.extra ? `+${ev.time.extra}` : ''}
                  </span>
                  <span className="flex-1">
                    <b>{ev.player?.name ?? ''}</b>
                    {ev.detail ? <span className="ml-2 text-neutral-500">{ev.detail}</span> : null}
                    {ev.team?.name ? <span className="ml-2 text-xs text-neutral-400">({ev.team.name})</span> : null}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-neutral-400">{ev.type}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
