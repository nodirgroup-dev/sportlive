import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath, siteConfig } from '@/lib/site';
import {
  getTeamById,
  getTeamUpcoming,
  getTeamRecent,
  getTeamStandings,
  teamFormFromFixtures,
  type TeamFormResult,
} from '@/lib/db';
import { FixtureRowItem } from '@/components/fixture-row';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const FORM_CHIP: Record<TeamFormResult, string> = {
  W: 'bg-green-600 text-white',
  D: 'bg-neutral-400 text-white dark:bg-neutral-600',
  L: 'bg-red-600 text-white',
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
  const team = await getTeamById(id);
  if (!team) return {};
  const title = team.country ? `${team.name} (${team.country})` : team.name;
  const description = team.venue?.name
    ? `${team.name} — ${team.venue.name}${team.venue.city ? `, ${team.venue.city}` : ''}`
    : team.name;
  const url = absoluteUrl(localePath(locale, `/team/${id}`));
  const ogImage = team.logo
    ? absoluteUrl(team.logo)
    : absoluteUrl(`/api/og/team/${id}?locale=${locale}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: team.name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: idStr } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();

  const team = await getTeamById(id);
  if (!team) notFound();

  const t = await getTranslations({ locale, namespace: 'team' });
  const [upcoming, recent, standings] = await Promise.all([
    getTeamUpcoming(id, 10),
    getTeamRecent(id, 10),
    getTeamStandings(id),
  ]);
  const form = teamFormFromFixtures(id, recent);
  const teamUrl = absoluteUrl(localePath(locale, `/team/${id}`));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.name,
    sport: 'Football',
    url: teamUrl,
    logo: team.logo ? absoluteUrl(team.logo) : undefined,
    location: team.venue
      ? {
          '@type': 'Place',
          name: team.venue.name,
          address: team.venue.city
            ? { '@type': 'PostalAddress', addressLocality: team.venue.city, addressCountry: team.country ?? undefined }
            : undefined,
        }
      : team.country
        ? { '@type': 'Country', name: team.country }
        : undefined,
    foundingDate: team.founded ? `${team.founded}` : undefined,
    isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        {team.logo ? (
          <Image
            src={team.logo}
            alt=""
            width={96}
            height={96}
            className="h-20 w-20 flex-shrink-0 object-contain sm:h-24 sm:w-24"
            unoptimized
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{team.name}</h1>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400 sm:grid-cols-3">
            {team.country ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">{t('country')}:</dt>
                <dd className="font-medium text-neutral-700 dark:text-neutral-300">{team.country}</dd>
              </div>
            ) : null}
            {team.founded ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">{t('founded')}:</dt>
                <dd className="font-medium text-neutral-700 dark:text-neutral-300">{team.founded}</dd>
              </div>
            ) : null}
            {team.venue ? (
              <div className="flex gap-1">
                <dt className="text-neutral-500">{t('stadium')}:</dt>
                <dd className="truncate font-medium text-neutral-700 dark:text-neutral-300">
                  {team.venue.name}
                  {team.venue.city ? `, ${team.venue.city}` : ''}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </header>

      {form.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t('form')}
          </h2>
          <div className="flex items-center gap-1.5">
            {form.map((r, i) => (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold ${FORM_CHIP[r]}`}
                aria-label={r}
              >
                {r}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {standings.length > 0 ? (
        <section className="mb-8">
          <div className="space-y-3">
            {standings.map((s, i) => (
              <div
                key={`${s.league.id}-${s.groupName ?? 'main'}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
              >
                {s.league.logo ? (
                  <Image
                    src={s.league.logo}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 flex-shrink-0 object-contain"
                    unoptimized
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{s.league.name}</div>
                  {s.groupName ? (
                    <div className="text-xs text-neutral-500">{s.groupName}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-base font-bold tabular-nums">{s.rank}</div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">#</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold tabular-nums">{s.points}</div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">pts</div>
                  </div>
                  <div className="hidden text-center sm:block">
                    <div className="font-mono tabular-nums">
                      {s.won}-{s.drew}-{s.lost}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">w-d-l</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold tracking-tight">{t('upcoming')}</h2>
        {upcoming.length > 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-950">
            {upcoming.map((f) => (
              <FixtureRowItem key={f.id} fixture={f} locale={locale as Locale} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{t('noUpcoming')}</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight">{t('recent')}</h2>
        {recent.length > 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white px-3 dark:border-neutral-800 dark:bg-neutral-950">
            {recent.map((f) => (
              <FixtureRowItem key={f.id} fixture={f} locale={locale as Locale} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{t('noRecent')}</p>
        )}
      </section>
    </div>
  );
}
