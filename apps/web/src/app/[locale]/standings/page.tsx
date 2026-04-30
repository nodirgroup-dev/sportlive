import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { getStandings } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

const PAGE_TITLE: Record<Locale, string> = {
  uz: 'Turnir jadvallari',
  ru: 'Турнирные таблицы',
  en: 'Standings',
};
const HEAD: Record<Locale, { rank: string; team: string; p: string; w: string; d: string; l: string; gf: string; ga: string; gd: string; pts: string; form: string }> = {
  uz: { rank: '#', team: 'Jamoa', p: 'O', w: 'G', d: 'D', l: 'M', gf: 'GU', ga: 'GO', gd: '+/-', pts: 'Bal', form: 'Forma' },
  ru: { rank: '#', team: 'Команда', p: 'И', w: 'В', d: 'Н', l: 'П', gf: 'ЗМ', ga: 'ПР', gd: '+/-', pts: 'О', form: 'Форма' },
  en: { rank: '#', team: 'Team', p: 'P', w: 'W', d: 'D', l: 'L', gf: 'GF', ga: 'GA', gd: '+/-', pts: 'Pts', form: 'Form' },
};

const FORM_COLOR: Record<string, string> = {
  W: 'bg-green-500',
  D: 'bg-neutral-400',
  L: 'bg-red-500',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const url = absoluteUrl(localePath(locale, '/standings'));
  return {
    title: PAGE_TITLE[locale],
    alternates: {
      canonical: url,
      languages: {
        uz: absoluteUrl(localePath('uz', '/standings')),
        ru: absoluteUrl(localePath('ru', '/standings')),
        en: absoluteUrl(localePath('en', '/standings')),
      },
    },
  };
}

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const tables = await getStandings();
  const t = HEAD[locale];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <h1 className="mb-1 text-2xl font-bold sm:text-3xl">{PAGE_TITLE[locale]}</h1>
      <p className="mb-6 text-sm text-neutral-500">
        {locale === 'uz'
          ? "Asosiy chempionatlar — jadvallar avtomatik yangilanib turadi"
          : locale === 'ru'
            ? 'Топ-чемпионаты — таблицы обновляются автоматически'
            : 'Top leagues — tables auto-update'}
      </p>

      {tables.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          {locale === 'uz' ? 'Jadvallar hozircha yo\'q' : locale === 'ru' ? 'Таблицы пока недоступны' : 'No standings yet'}
        </div>
      ) : (
        <div className="space-y-10">
          {tables.map((tbl) => (
            <section key={tbl.league.id}>
              <header className="mb-3 flex items-center gap-3">
                {tbl.league.logo ? (
                  <Image
                    src={tbl.league.logo}
                    alt=""
                    width={32}
                    height={32}
                    className="h-7 w-7 object-contain"
                  />
                ) : null}
                <h2 className="text-lg font-semibold">{tbl.league.name}</h2>
                {tbl.league.country ? (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {tbl.league.country}
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-neutral-500">
                  {tbl.league.season}/{(tbl.league.season + 1).toString().slice(-2)}
                </span>
              </header>

              {tbl.groups.map((group) => (
                <div key={`${tbl.league.id}-${group.name ?? 'main'}`} className="mb-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                  {group.name ? (
                    <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                      {group.name}
                    </div>
                  ) : null}
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 dark:bg-neutral-900">
                      <tr>
                        <th className="px-3 py-2 text-center">{t.rank}</th>
                        <th className="px-3 py-2 text-left">{t.team}</th>
                        <th className="px-2 py-2 text-center">{t.p}</th>
                        <th className="px-2 py-2 text-center">{t.w}</th>
                        <th className="px-2 py-2 text-center">{t.d}</th>
                        <th className="px-2 py-2 text-center">{t.l}</th>
                        <th className="px-2 py-2 text-center">{t.gf}</th>
                        <th className="px-2 py-2 text-center">{t.ga}</th>
                        <th className="px-2 py-2 text-center">{t.gd}</th>
                        <th className="px-2 py-2 text-center font-bold">{t.pts}</th>
                        <th className="px-3 py-2 text-left">{t.form}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={`${row.team.id}-${row.rank}`} className="border-t border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
                          <td className="px-3 py-2 text-center font-mono text-xs">{row.rank}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {row.team.logo ? (
                                <Image
                                  src={row.team.logo}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="h-5 w-5 flex-shrink-0 object-contain"
                                />
                              ) : null}
                              <span className="font-medium">{row.team.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center font-mono">{row.played}</td>
                          <td className="px-2 py-2 text-center font-mono text-green-600">{row.won}</td>
                          <td className="px-2 py-2 text-center font-mono text-neutral-500">{row.drew}</td>
                          <td className="px-2 py-2 text-center font-mono text-red-600">{row.lost}</td>
                          <td className="px-2 py-2 text-center font-mono">{row.goalsFor}</td>
                          <td className="px-2 py-2 text-center font-mono">{row.goalsAgainst}</td>
                          <td className="px-2 py-2 text-center font-mono">
                            {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                          </td>
                          <td className="px-2 py-2 text-center font-mono font-bold">{row.points}</td>
                          <td className="px-3 py-2">
                            {row.form ? (
                              <div className="flex gap-1">
                                {row.form.slice(-5).split('').map((ch, i) => (
                                  <span
                                    key={i}
                                    title={ch}
                                    className={`h-4 w-4 rounded-sm ${FORM_COLOR[ch] ?? 'bg-neutral-300'}`}
                                  />
                                ))}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
