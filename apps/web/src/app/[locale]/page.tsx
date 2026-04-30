import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import { getLatestPosts } from '@/lib/db';
import { PostCard } from '@/components/post-card';
import { PostHero, PostGridCard } from '@/components/post-hero';
import { BannerSlot } from '@/components/banner-slot';

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
  const posts = await getLatestPosts(locale, 31);

  const hero = posts[0];
  const featured = posts.slice(1, 7); // 6 cards
  const rest = posts.slice(7);

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
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {posts.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{t('home.loading')}</p>
      ) : (
        <>
          {hero ? (
            <section className="mb-8">
              <PostHero post={hero} locale={locale as Locale} />
            </section>
          ) : null}

          <div className="mb-6 flex justify-center">
            <BannerSlot position="header" />
          </div>

          {featured.length > 0 ? (
            <section className="mb-10">
              <h2 className="mb-4 text-xl font-bold tracking-tight">{t('home.latest')}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <PostGridCard key={p.id} post={p} locale={locale as Locale} />
                ))}
              </div>
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight">{t('home.popular')}</h2>
              <div className="rounded-lg border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
                {rest.map((p) => (
                  <PostCard key={p.id} post={p} locale={locale as Locale} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
