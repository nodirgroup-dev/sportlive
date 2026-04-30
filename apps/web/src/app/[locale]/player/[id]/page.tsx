import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath, siteConfig } from '@/lib/site';
import { getPlayerById, getPlayerStats } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

const LABELS: Record<Locale, { stats: string; nationality: string; height: string; weight: string; team: string; position: string; born: string; gp: string; min: string; g: string; a: string; yc: string; rc: string; rating: string }> = {
  uz: {
    stats: 'Mavsumlar statistikasi',
    nationality: 'Millati',
    height: 'Bo‘y',
    weight: 'Vazn',
    team: 'Jamoa',
    position: 'Pozitsiya',
    born: 'Tug‘ilgan yil',
    gp: 'O‘yin', min: 'Daqiqa', g: 'Gol', a: 'Uzatma', yc: 'SK', rc: 'QK', rating: 'Reyting',
  },
  ru: {
    stats: 'Статистика по сезонам',
    nationality: 'Гражданство',
    height: 'Рост',
    weight: 'Вес',
    team: 'Клуб',
    position: 'Позиция',
    born: 'Год рождения',
    gp: 'Игр', min: 'Минут', g: 'Голы', a: 'Передачи', yc: 'ЖК', rc: 'КК', rating: 'Рейтинг',
  },
  en: {
    stats: 'Season stats',
    nationality: 'Nationality',
    height: 'Height',
    weight: 'Weight',
    team: 'Team',
    position: 'Position',
    born: 'Born',
    gp: 'GP', min: 'Min', g: 'G', a: 'A', yc: 'YC', rc: 'RC', rating: 'Rating',
  },
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
  const p = await getPlayerById(id);
  if (!p) return {};
  const url = absoluteUrl(localePath(locale, `/player/${id}`));
  return {
    title: p.team ? `${p.name} — ${p.team.name}` : p.name,
    description: p.nationality ? `${p.name}, ${p.nationality}${p.position ? `, ${p.position}` : ''}` : p.name,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      url,
      title: p.name,
      images: p.photo ? [{ url: p.photo, alt: p.name }] : undefined,
    },
  };
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: idStr } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();
  const p = await getPlayerById(id);
  if (!p) notFound();
  const stats = await getPlayerStats(id);
  const t = LABELS[locale];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    givenName: p.firstname ?? undefined,
    familyName: p.lastname ?? undefined,
    nationality: p.nationality ?? undefined,
    image: p.photo ?? undefined,
    height: p.height ?? undefined,
    weight: p.weight ?? undefined,
    birthDate: p.birthYear ? `${p.birthYear}` : undefined,
    affiliation: p.team
      ? { '@type': 'SportsTeam', name: p.team.name, sport: 'Football' }
      : undefined,
    url: absoluteUrl(localePath(locale, `/player/${id}`)),
    isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        {p.photo ? (
          <Image
            src={p.photo}
            alt=""
            width={128}
            height={128}
            unoptimized
            className="h-24 w-24 flex-shrink-0 rounded-full object-cover sm:h-32 sm:w-32"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{p.name}</h1>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400 sm:grid-cols-3">
            {p.team ? (
              <div className="flex items-center gap-1">
                <dt className="text-neutral-500">{t.team}:</dt>
                <Link
                  href={`/team/${p.team.id}` as Route}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {p.team.name}
                </Link>
              </div>
            ) : null}
            {p.position ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">{t.position}:</dt>
                <dd className="font-medium">{p.position}</dd>
              </div>
            ) : null}
            {p.nationality ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">{t.nationality}:</dt>
                <dd className="font-medium">{p.nationality}</dd>
              </div>
            ) : null}
            {p.birthYear ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">{t.born}:</dt>
                <dd className="font-medium">{p.birthYear}</dd>
              </div>
            ) : null}
            {p.height ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">{t.height}:</dt>
                <dd className="font-medium">{p.height}</dd>
              </div>
            ) : null}
            {p.weight ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">{t.weight}:</dt>
                <dd className="font-medium">{p.weight}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </header>

      {stats.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-bold tracking-tight">{t.stats}</h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 dark:bg-neutral-900">
                <tr>
                  <th className="px-3 py-2 text-left">Season</th>
                  <th className="px-3 py-2 text-left">League</th>
                  <th className="px-3 py-2 text-left">{t.team}</th>
                  <th className="px-3 py-2 text-right">{t.gp}</th>
                  <th className="px-3 py-2 text-right">{t.min}</th>
                  <th className="px-3 py-2 text-right">{t.g}</th>
                  <th className="px-3 py-2 text-right">{t.a}</th>
                  <th className="px-3 py-2 text-right">{t.yc}</th>
                  <th className="px-3 py-2 text-right">{t.rc}</th>
                  <th className="px-3 py-2 text-right">{t.rating}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="px-3 py-2 font-mono text-xs">{s.season}</td>
                    <td className="px-3 py-2">
                      {s.league.country ? <span className="text-neutral-500">{s.league.country} · </span> : null}
                      {s.league.name}
                    </td>
                    <td className="px-3 py-2">
                      {s.team ? (
                        <Link href={`/team/${s.team.id}` as Route} className="text-brand-700 hover:underline">
                          {s.team.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.appearances}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.minutes}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{s.goals}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.assists}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.yellowCards}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.redCards}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.rating ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
