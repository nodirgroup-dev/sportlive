import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { getLiveFixtures } from '@/lib/db';
import { FixturesByLeague } from '@/components/fixture-row';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

const PAGE_TITLE: Record<Locale, string> = {
  uz: 'Jonli natijalar',
  ru: 'Онлайн-результаты',
  en: 'Live scores',
};

const EMPTY: Record<Locale, string> = {
  uz: "Hozir jonli o'yin yo'q.",
  ru: 'Сейчас матчей в прямом эфире нет.',
  en: 'No matches live right now.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const url = absoluteUrl(localePath(locale, '/live'));
  return {
    title: PAGE_TITLE[locale],
    description: EMPTY[locale],
    alternates: {
      canonical: url,
      languages: {
        uz: absoluteUrl(localePath('uz', '/live')),
        ru: absoluteUrl(localePath('ru', '/live')),
        en: absoluteUrl(localePath('en', '/live')),
      },
    },
    openGraph: { url, title: PAGE_TITLE[locale] },
  };
}

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const fixtures = await getLiveFixtures(50);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{PAGE_TITLE[locale]}</h1>
        {fixtures.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
            LIVE · {fixtures.length}
          </span>
        ) : null}
      </div>
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
