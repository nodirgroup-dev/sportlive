import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import { getLatestPosts, getMostPopular, getFeaturedHero } from '@/lib/db';
import { PostCard } from '@/components/post-card';
import { PostHero, PostGridCard } from '@/components/post-hero';
import { PopularList } from '@/components/popular-list';
import { BannerSlot } from '@/components/banner-slot';
import { MatchWidget } from '@/components/match-widget';

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
  const [posts, popular, pinned] = await Promise.all([
    getLatestPosts(locale as Locale, 32),
    getMostPopular(locale as Locale, 5),
    getFeaturedHero(locale as Locale),
  ]);

  // If a pinned post exists, use it as hero and exclude it from the latest feed.
  const hero = pinned ?? posts[0] ?? null;
  const usable = pinned ? posts.filter((p) => p.id !== pinned.id) : posts.slice(1);
  const featured = usable.slice(0, 6); // 6 cards
  const rest = usable.slice(6);

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

          <section className="mb-8">
            <MatchWidget locale={locale as Locale} />
          </section>

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

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {rest.length > 0 ? (
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight">{t('home.more')}</h2>
                <div className="rounded-lg border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
                  {rest.map((p) => (
                    <PostCard key={p.id} post={p} locale={locale as Locale} />
                  ))}
                </div>
              </section>
            ) : (
              <div />
            )}

            {popular.length > 0 ? (
              <aside className="lg:sticky lg:top-20 lg:self-start">
                <h2 className="mb-4 text-xl font-bold tracking-tight">{t('home.popular')}</h2>
                <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <PopularList posts={popular} locale={locale as Locale} />
                </div>
              </aside>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
