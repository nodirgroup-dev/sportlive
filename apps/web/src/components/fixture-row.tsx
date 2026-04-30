import Image from 'next/image';
import type { FixtureRow as FixtureRowT } from '@/lib/db';
import type { Locale } from '@/i18n/routing';

const localeFmt: Record<Locale, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

const STATUS_CLASS: Record<string, string> = {
  NS: 'text-neutral-500',
  TBD: 'text-neutral-500',
  FT: 'text-neutral-700 dark:text-neutral-300',
  AET: 'text-neutral-700 dark:text-neutral-300',
  PEN: 'text-neutral-700 dark:text-neutral-300',
  AWD: 'text-neutral-500',
  WO: 'text-neutral-500',
  '1H': 'text-red-600 font-semibold',
  '2H': 'text-red-600 font-semibold',
  HT: 'text-amber-600 font-semibold',
  ET: 'text-red-600 font-semibold',
  P: 'text-red-600 font-semibold',
  LIVE: 'text-red-600 font-semibold',
};

function statusLabel(f: FixtureRowT): string {
  if (f.statusShort === 'NS' || f.statusShort === 'TBD') return '';
  if (['1H', '2H', 'ET', 'P'].includes(f.statusShort) && f.elapsed) return `${f.elapsed}'`;
  if (f.statusShort === 'HT') return 'HT';
  if (['FT', 'AET', 'PEN'].includes(f.statusShort)) return f.statusShort;
  return f.statusShort;
}

export function FixtureRowItem({ fixture, locale }: { fixture: FixtureRowT; locale: Locale }) {
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(fixture.statusShort);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.statusShort);
  const showScore = isLive || isFinished;

  const time = new Intl.DateTimeFormat(localeFmt[locale], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(fixture.kickoffAt);

  const dateLabel = new Intl.DateTimeFormat(localeFmt[locale], {
    day: 'numeric',
    month: 'short',
  }).format(fixture.kickoffAt);

  return (
    <div className="grid grid-cols-[120px_1fr_60px_1fr] items-center gap-3 border-b border-neutral-200 py-3 text-sm dark:border-neutral-800 sm:gap-4">
      <div className="flex flex-col text-xs text-neutral-500">
        <time dateTime={fixture.kickoffAt.toISOString()}>{dateLabel}</time>
        <span className={STATUS_CLASS[fixture.statusShort] ?? ''}>
          {showScore ? statusLabel(fixture) : time}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 truncate text-right">
        <span className="truncate font-medium">{fixture.homeTeam.name}</span>
        {fixture.homeTeam.logo ? (
          <Image
            src={fixture.homeTeam.logo}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 flex-shrink-0 object-contain"
          />
        ) : null}
      </div>

      <div className="text-center font-mono">
        {showScore ? (
          <span className={isLive ? 'font-semibold text-red-600' : 'font-semibold'}>
            {fixture.homeGoals ?? 0} : {fixture.awayGoals ?? 0}
          </span>
        ) : (
          <span className="text-neutral-400">vs</span>
        )}
      </div>

      <div className="flex items-center gap-2 truncate">
        {fixture.awayTeam.logo ? (
          <Image
            src={fixture.awayTeam.logo}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 flex-shrink-0 object-contain"
          />
        ) : null}
        <span className="truncate font-medium">{fixture.awayTeam.name}</span>
      </div>
    </div>
  );
}

export function FixturesByLeague({
  fixtures,
  locale,
}: {
  fixtures: FixtureRowT[];
  locale: Locale;
}) {
  const groups = new Map<number, { name: string; logo: string | null; items: FixtureRowT[] }>();
  for (const f of fixtures) {
    const g = groups.get(f.league.id);
    if (g) g.items.push(f);
    else groups.set(f.league.id, { name: f.league.name, logo: f.league.logo, items: [f] });
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.values()).map((g) => (
        <section key={g.name}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {g.logo ? (
              <Image
                src={g.logo}
                alt=""
                width={18}
                height={18}
                className="h-4 w-4 object-contain"
              />
            ) : null}
            {g.name}
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-950">
            {g.items.map((f) => (
              <FixtureRowItem key={f.id} fixture={f} locale={locale} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
