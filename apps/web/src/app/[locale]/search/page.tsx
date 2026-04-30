import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { searchPosts } from '@/lib/db';
import { PostCard } from '@/components/post-card';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const PAGE_TITLE: Record<Locale, string> = { uz: 'Qidiruv', ru: 'Поиск', en: 'Search' };
const HINTS: Record<Locale, { type: string; min: string; nothing: string; results: (n: number) => string }> = {
  uz: { type: 'Kamida 4 ta belgi yozing', min: 'Qidiruv uchun matn kerak', nothing: 'Hech narsa topilmadi', results: (n) => `${n} ta natija` },
  ru: { type: 'Введите минимум 4 символа', min: 'Введите запрос', nothing: 'Ничего не найдено', results: (n) => `${n} результатов` },
  en: { type: 'At least 4 characters', min: 'Enter a query', nothing: 'No results', results: (n) => `${n} results` },
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  if (!hasLocale(locale)) return {};
  const title = sp.q ? `${PAGE_TITLE[locale]}: ${sp.q}` : PAGE_TITLE[locale];
  return {
    title,
    robots: { index: false, follow: true }, // search results don't need to be indexed
    alternates: { canonical: absoluteUrl(localePath(locale, '/search')) },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const q = (sp.q ?? '').trim();
  const hints = HINTS[locale];
  const results = q.length >= 4 ? await searchPosts(q, locale, 50) : [];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">{PAGE_TITLE[locale]}</h1>

      <form className="mb-6 flex gap-2" method="GET">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t('nav.searchPlaceholder')}
          autoFocus
          minLength={4}
          className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          {t('nav.search')}
        </button>
      </form>

      {q.length === 0 ? (
        <p className="text-sm text-neutral-500">{hints.min}</p>
      ) : q.length < 4 ? (
        <p className="text-sm text-neutral-500">{hints.type}</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-neutral-500">{hints.nothing}</p>
      ) : (
        <>
          <p className="mb-3 text-xs uppercase tracking-wider text-neutral-500">{hints.results(results.length)}</p>
          <div className="rounded-lg border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
            {results.map((p) => (
              <PostCard key={p.id} post={p} locale={locale} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
