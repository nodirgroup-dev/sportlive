import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { db, leagues } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { getTopScorers } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

const HEADER: Record<Locale, (n: string) => string> = {
  uz: (n) => `${n} — gol urgan futbolchilar`,
  ru: (n) => `${n} — лучшие бомбардиры`,
  en: (n) => `${n} top scorers`,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; league: string }>;
}): Promise<Metadata> {
  const { locale, league: leagueStr } = await params;
  if (!hasLocale(locale)) return {};
  const id = parseInt(leagueStr, 10);
  if (!Number.isFinite(id)) return {};
  const l = await db.select().from(leagues).where(eq(leagues.id, id)).limit(1);
  if (l.length === 0) return {};
  return {
    title: HEADER[locale](l[0]!.name),
    alternates: { canonical: absoluteUrl(localePath(locale, `/scorers/${id}`)) },
  };
}

export default async function ScorersPage({
  params,
}: {
  params: Promise<{ locale: string; league: string }>;
}) {
  const { locale, league: leagueStr } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const id = parseInt(leagueStr, 10);
  if (!Number.isFinite(id)) notFound();

  const l = await db.select().from(leagues).where(eq(leagues.id, id)).limit(1);
  if (l.length === 0) notFound();
  const league = l[0]!;
  const items = await getTopScorers(id, league.season, 25);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-center gap-3">
        {league.logo ? (
          <Image
            src={league.logo}
            alt=""
            width={48}
            height={48}
            unoptimized
            className="h-10 w-10 flex-shrink-0 object-contain"
          />
        ) : null}
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{league.name}</h1>
          <div className="text-sm text-neutral-500">
            {league.country ? `${league.country} · ` : ''}Season {league.season}
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No data yet. Run <code>fetch-fixtures.mjs --topscorers-only --leagues {id}</code>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="w-10 px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2 text-right">G</th>
                <th className="px-3 py-2 text-right">A</th>
                <th className="px-3 py-2 text-right">GP</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.player.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">{it.rank}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/player/${it.player.id}` as Route}
                      className="flex items-center gap-2 hover:text-brand-700"
                    >
                      {it.player.photo ? (
                        <Image
                          src={it.player.photo}
                          alt=""
                          width={28}
                          height={28}
                          unoptimized
                          className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                        />
                      ) : null}
                      <span className="font-medium">{it.player.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {it.team ? (
                      <Link
                        href={`/team/${it.team.id}` as Route}
                        className="text-neutral-700 hover:text-brand-700 dark:text-neutral-300"
                      >
                        {it.team.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums">{it.goals}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{it.assists}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{it.appearances}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
