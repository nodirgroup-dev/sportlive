import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { getFixtureById } from '@/lib/db';

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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm text-neutral-500">
          {f.league.logo ? (
            <Image src={f.league.logo} alt="" width={24} height={24} className="h-5 w-5 object-contain" />
          ) : null}
          <span>{f.league.name}</span>
          {f.round ? <span className="text-neutral-400">· {f.round}</span> : null}
        </div>

        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            {f.homeTeam.logo ? (
              <Image src={f.homeTeam.logo} alt="" width={64} height={64} className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
            ) : null}
            <span className="text-sm font-bold sm:text-lg">{f.homeTeam.name}</span>
          </div>

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

          <div className="flex flex-col items-center gap-2 text-center">
            {f.awayTeam.logo ? (
              <Image src={f.awayTeam.logo} alt="" width={64} height={64} className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
            ) : null}
            <span className="text-sm font-bold sm:text-lg">{f.awayTeam.name}</span>
          </div>
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
                    {ev.time?.elapsed}'{ev.time?.extra ? `+${ev.time.extra}` : ''}
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
