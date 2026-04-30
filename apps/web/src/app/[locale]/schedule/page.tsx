import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import { getUpcomingFixtures } from '@/lib/db';
import { FixturesByLeague } from '@/components/fixture-row';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const PAGE_TITLE: Record<Locale, string> = {
  uz: "O'yinlar jadvali",
  ru: 'Расписание матчей',
  en: 'Match schedule',
};

const EMPTY: Record<Locale, string> = {
  uz: 'Hozircha rejalashtirilgan o‘yinlar yo‘q. Ma‘lumotlar har soatda yangilanadi.',
  ru: 'Запланированных матчей пока нет. Данные обновляются ежечасно.',
  en: 'No upcoming fixtures yet. Data refreshes every hour.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const url = absoluteUrl(localePath(locale, '/schedule'));
  return {
    title: PAGE_TITLE[locale],
    description: EMPTY[locale],
    alternates: {
      canonical: url,
      languages: {
        uz: absoluteUrl(localePath('uz', '/schedule')),
        ru: absoluteUrl(localePath('ru', '/schedule')),
        en: absoluteUrl(localePath('en', '/schedule')),
      },
    },
    openGraph: { url, title: PAGE_TITLE[locale] },
  };
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const fixtures = await getUpcomingFixtures(7, 100);
  void siteConfig;
  void t;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <h1 className="mb-1 text-2xl font-bold sm:text-3xl">{PAGE_TITLE[locale]}</h1>
      <p className="mb-6 text-sm text-neutral-500">{EMPTY[locale]}</p>
      {fixtures.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700">
          {EMPTY[locale]}
        </div>
      ) : (
        <FixturesByLeague fixtures={fixtures} locale={locale} />
      )}
    </div>
  );
}
