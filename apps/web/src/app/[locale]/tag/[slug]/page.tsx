import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath, siteConfig } from '@/lib/site';
import { getTagBySlug, getPostsByTag } from '@/lib/db';
import { PostCard } from '@/components/post-card';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const HEADER: Record<Locale, (n: string) => string> = {
  uz: (n) => `“${n}” bo'yicha maqolalar`,
  ru: (n) => `Материалы по тегу «${n}»`,
  en: (n) => `Articles tagged "${n}"`,
};

const EMPTY: Record<Locale, string> = {
  uz: "Hech qanday maqola topilmadi",
  ru: 'Материалов не найдено',
  en: 'No articles yet',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const tag = await getTagBySlug(slug, locale);
  if (!tag) return {};
  const url = absoluteUrl(localePath(locale, `/tag/${tag.slug}`));
  const title = HEADER[locale](tag.name);
  return {
    title,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      images: [{ url: absoluteUrl(`/api/og/tag/${encodeURIComponent(tag.slug)}?locale=${locale}`), width: 1200, height: 630, alt: tag.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [absoluteUrl(`/api/og/tag/${encodeURIComponent(tag.slug)}?locale=${locale}`)],
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const tag = await getTagBySlug(slug, locale);
  if (!tag) notFound();

  const items = await getPostsByTag(tag.id, locale, 50);
  const tagUrl = absoluteUrl(localePath(locale, `/tag/${tag.slug}`));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: HEADER[locale](tag.name),
    url: tagUrl,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: absoluteUrl(localePath(locale, '/')),
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(localePath(locale, `/${p.category?.path ?? ''}/${p.legacyId}-${p.slug}`)),
        name: p.title,
      })),
    },
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        # <span>{tag.name}</span>
      </h1>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">{EMPTY[locale]}</p>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
          {items.map((p) => (
            <PostCard key={p.id} post={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
