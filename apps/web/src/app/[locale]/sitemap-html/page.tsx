import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { db, posts, categories, tags } from '@sportlive/db';
import { and, asc, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

const HEADER: Record<Locale, string> = {
  uz: 'Sayt xaritasi',
  ru: 'Карта сайта',
  en: 'Site map',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    title: HEADER[locale],
    alternates: { canonical: absoluteUrl(localePath(locale, '/sitemap-html')) },
  };
}

export default async function HtmlSitemapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);

  const [recent, cats, tagList] = await Promise.all([
    db
      .select({
        id: posts.id,
        legacyId: posts.legacyId,
        slug: posts.slug,
        title: posts.title,
        categoryId: posts.categoryId,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(and(eq(posts.locale, locale), eq(posts.status, 'published')))
      .orderBy(desc(posts.publishedAt))
      .limit(500),
    db.select().from(categories).where(eq(categories.locale, locale)).orderBy(asc(categories.name)),
    db.select().from(tags).where(eq(tags.locale, locale)).orderBy(asc(tags.name)).limit(200),
  ]);

  // Build category-id → slug map
  const catMap = new Map<number, { slug: string; name: string; parentId: number | null }>();
  for (const c of cats) catMap.set(c.id, { slug: c.slug, name: c.name, parentId: c.parentId });

  function catPath(catId: number | null): string | null {
    if (!catId) return null;
    const segs: string[] = [];
    let cur = catMap.get(catId);
    while (cur) {
      segs.unshift(cur.slug);
      cur = cur.parentId ? catMap.get(cur.parentId) : undefined;
    }
    return segs.join('/');
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">{HEADER[locale]}</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {locale === 'ru' ? 'Категории' : locale === 'en' ? 'Categories' : 'Kategoriyalar'}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <li key={c.id}>
              <Link href={`/${catPath(c.id)}` as Route} className="text-sm hover:text-brand-700 hover:underline">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {tagList.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {locale === 'ru' ? 'Теги' : locale === 'en' ? 'Tags' : 'Teglar'}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {tagList.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tag/${t.slug}` as Route}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-xs hover:bg-brand-100 hover:text-brand-700 dark:bg-neutral-800 dark:hover:bg-brand-900/30"
                >
                  #{t.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {locale === 'ru' ? `Последние статьи (${recent.length})` : locale === 'en' ? `Recent articles (${recent.length})` : `So‘nggi maqolalar (${recent.length})`}
        </h2>
        <ul className="space-y-1.5">
          {recent.map((p) => (
            <li key={p.id} className="text-sm">
              <Link
                href={`/${catPath(p.categoryId) ?? ''}/${p.legacyId}-${p.slug}` as Route}
                className="hover:text-brand-700 hover:underline"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
