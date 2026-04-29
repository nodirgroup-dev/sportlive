import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import { getLatestPosts } from '@/lib/db';
import { PostCard } from '@/components/post-card';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'site' });
  return { title: `${t('name')} — ${t('tagline')}`, description: t('description') };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const posts = await getLatestPosts(locale, 30);

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: absoluteUrl(localePath(locale as Locale, '/')),
    inLanguage: locale,
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: siteConfig.publisher.name,
      url: siteConfig.url,
      logo: { '@type': 'ImageObject', url: absoluteUrl(siteConfig.publisher.logo) },
      sameAs: siteConfig.publisher.sameAs,
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(localePath(locale as Locale, `/${p.category?.path ?? ''}/${p.legacyId}-${p.slug}`)),
      name: p.title,
    })),
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('home.hero')}</h1>
      <div className="mt-4">
        {posts.length === 0 ? (
          <p className="text-neutral-500">{t('home.loading')}</p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} locale={locale as Locale} />)
        )}
      </div>
    </div>
  );
}
