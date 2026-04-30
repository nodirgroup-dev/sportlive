import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import { getMatchSnapshot } from '@/lib/db';
import type { Locale } from '@/i18n/routing';

const localeFmt: Record<Locale, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
const HEADING: Record<Locale, string> = {
  uz: "Bugungi o'yinlar",
  ru: 'Матчи дня',
  en: "Today's matches",
};
const VIEW_ALL: Record<Locale, string> = {
  uz: 'Barcha o‘yinlar →',
  ru: 'Все матчи →',
  en: 'All matches →',
};

export async function MatchWidget({ locale }: { locale: Locale }) {
  const list = await getMatchSnapshot(6).catch(() => []);
  if (list.length === 0) return null;

  const liveCount = list.filter((f) =>
    ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.statusShort),
  ).length;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold">
          {liveCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
              LIVE · {liveCount}
            </span>
          ) : null}
          {HEADING[locale]}
        </h2>
        <Link
          href={'/schedule' as Route}
          className="text-xs font-medium text-brand-700 hover:text-brand-500"
        >
          {VIEW_ALL[locale]}
        </Link>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((f) => {
          const live = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(f.statusShort);
          const finished = ['FT', 'AET', 'PEN'].includes(f.statusShort);
          const showScore = live || finished;
          const time = new Intl.DateTimeFormat(localeFmt[locale], {
            hour: '2-digit',
            minute: '2-digit',
          }).format(f.kickoffAt);
          const date = new Intl.DateTimeFormat(localeFmt[locale], {
            day: 'numeric',
            month: 'short',
          }).format(f.kickoffAt);
          return (
            <Link
              key={f.id}
              href={`/match/${f.id}` as Route}
              className="group rounded-lg border border-neutral-100 p-3 transition-colors hover:border-brand-500/60 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-brand-500/40 dark:hover:bg-neutral-900"
            >
              <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-500">
                <span className="truncate">{f.league.name}</span>
                {live ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
                    {f.elapsed ? `${f.elapsed}'` : 'LIVE'}
                  </span>
                ) : finished ? (
                  <span className="font-semibold">FT</span>
                ) : (
                  <span>
                    {date} · {time}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {f.homeTeam.logo ? (
                  <Image
                    src={f.homeTeam.logo}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 flex-shrink-0 object-contain"
                  />
                ) : null}
                <span className="flex-1 truncate font-medium">{f.homeTeam.name}</span>
                {showScore ? (
                  <span className={`font-mono font-bold ${live ? 'text-red-600' : ''}`}>
                    {f.homeGoals ?? 0}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                {f.awayTeam.logo ? (
                  <Image
                    src={f.awayTeam.logo}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 flex-shrink-0 object-contain"
                  />
                ) : null}
                <span className="flex-1 truncate font-medium">{f.awayTeam.name}</span>
                {showScore ? (
                  <span className={`font-mono font-bold ${live ? 'text-red-600' : ''}`}>
                    {f.awayGoals ?? 0}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
