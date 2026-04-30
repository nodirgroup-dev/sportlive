import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { getRecentResults } from '@/lib/db';
import { FixturesByLeague } from '@/components/fixture-row';

export const dynamic = 'force-dynamic';
export const revalidate = 120;

const PAGE_TITLE: Record<Locale, string> = {
  uz: "O'yin natijalari",
  ru: 'Результаты матчей',
  en: 'Match results',
};

const EMPTY: Record<Locale, string> = {
  uz: 'Yaqinda yakunlangan o‘yinlar yo‘q.',
  ru: 'Недавно завершённых матчей нет.',
  en: 'No recent results.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const url = absoluteUrl(localePath(locale, '/results'));
  return {
    title: PAGE_TITLE[locale],
    description: EMPTY[locale],
    alternates: {
      canonical: url,
      languages: {
        uz: absoluteUrl(localePath('uz', '/results')),
        ru: absoluteUrl(localePath('ru', '/results')),
        en: absoluteUrl(localePath('en', '/results')),
      },
    },
    openGraph: { url, title: PAGE_TITLE[locale] },
  };
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const fixtures = await getRecentResults(7, 100);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{PAGE_TITLE[locale]}</h1>
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
