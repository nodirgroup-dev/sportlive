import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { searchPosts, type ListedPost } from '@/lib/db';
import { Highlight } from '@/components/highlight';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const PAGE_SIZE = 20;

const PAGE_TITLE: Record<Locale, string> = { uz: 'Qidiruv', ru: 'Поиск', en: 'Search' };
const HINTS: Record<
  Locale,
  {
    type: string;
    min: string;
    nothing: string;
    results: (n: number) => string;
    prev: string;
    next: string;
    pageOf: (cur: number, total: number) => string;
  }
> = {
  uz: {
    type: 'Kamida 4 ta belgi yozing',
    min: 'Qidiruv uchun matn kerak',
    nothing: 'Hech narsa topilmadi',
    results: (n) => `${n} ta natija`,
    prev: '← Oldingi',
    next: 'Keyingi →',
    pageOf: (c, t) => `${c} / ${t}`,
  },
  ru: {
    type: 'Введите минимум 4 символа',
    min: 'Введите запрос',
    nothing: 'Ничего не найдено',
    results: (n) => `${n} результатов`,
    prev: '← Назад',
    next: 'Вперёд →',
    pageOf: (c, t) => `${c} / ${t}`,
  },
  en: {
    type: 'At least 4 characters',
    min: 'Enter a query',
    nothing: 'No results',
    results: (n) => `${n} results`,
    prev: '← Previous',
    next: 'Next →',
    pageOf: (c, t) => `${c} / ${t}`,
  },
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  if (!hasLocale(locale)) return {};
  const title = sp.q ? `${PAGE_TITLE[locale]}: ${sp.q}` : PAGE_TITLE[locale];
  return {
    title,
    robots: { index: false, follow: true },
    alternates: { canonical: absoluteUrl(localePath(locale, '/search')) },
  };
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function summarySnippet(text: string, q: string, max = 220): string {
  if (!q || text.length <= max) return text.slice(0, max);
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text.slice(0, max);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + q.length + 160);
  return (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
}

function articleHref(p: ListedPost): string {
  const cat = p.category?.path ?? '';
  return `/${cat}/${p.legacyId}-${p.slug}`;
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const q = (sp.q ?? '').trim();
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const hints = HINTS[locale];

  const data =
    q.length >= 4
      ? await searchPosts(q, locale, { page, pageSize: PAGE_SIZE })
      : { items: [], total: 0, page, pageSize: PAGE_SIZE };
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

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
      ) : data.items.length === 0 ? (
        <p className="text-sm text-neutral-500">{hints.nothing}</p>
      ) : (
        <>
          <p className="mb-3 text-xs uppercase tracking-wider text-neutral-500">
            {hints.results(data.total)}
          </p>
          <div className="rounded-lg border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
            {data.items.map((p) => {
              const summary = summarySnippet(stripHtml(p.summary), q);
              const date = p.publishedAt
                ? new Intl.DateTimeFormat(
                    locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
                    { year: 'numeric', month: 'short', day: 'numeric' },
                  ).format(p.publishedAt)
                : '';
              return (
                <article
                  key={p.id}
                  className="group flex gap-4 border-b border-neutral-200 py-4 last:border-0 dark:border-neutral-800"
                >
                  {p.coverImage ? (
                    <Link href={articleHref(p) as never} className="block flex-shrink-0">
                      <Image
                        src={p.coverImage}
                        alt={p.title}
                        width={p.coverImageWidth ?? 200}
                        height={p.coverImageHeight ?? 150}
                        className="h-20 w-28 rounded object-cover sm:h-24 sm:w-36"
                        unoptimized
                        sizes="(max-width: 640px) 112px, 144px"
                      />
                    </Link>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Link href={articleHref(p) as never} className="block">
                      <h2 className="text-base font-semibold leading-tight group-hover:text-brand-700 sm:text-lg">
                        <Highlight text={p.title} q={q} />
                      </h2>
                      {summary ? (
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <Highlight text={summary} q={q} />
                        </p>
                      ) : null}
                    </Link>
                    <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                      {p.category ? (
                        <Link
                          href={`/${p.category.path}` as never}
                          className="rounded bg-neutral-100 px-2 py-0.5 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
                        >
                          {p.category.name}
                        </Link>
                      ) : null}
                      {date ? <span>{date}</span> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <nav className="mt-6 flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link
                  href={{ pathname: '/search', query: { q, page: page - 1 } } as never}
                  className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium hover:border-brand-500 dark:border-neutral-800 dark:hover:border-brand-400"
                >
                  {hints.prev}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-xs text-neutral-500">{hints.pageOf(page, totalPages)}</span>
              {page < totalPages ? (
                <Link
                  href={{ pathname: '/search', query: { q, page: page + 1 } } as never}
                  className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium hover:border-brand-500 dark:border-neutral-800 dark:hover:border-brand-400"
                >
                  {hints.next}
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
