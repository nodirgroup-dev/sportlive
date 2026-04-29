import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale } from '@/i18n/routing';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'site' });
  return {
    title: `${t('name')} — ${t('tagline')}`,
    description: t('description'),
  };
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

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: absoluteUrl(localePath(locale, '/')),
    inLanguage: locale,
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: siteConfig.publisher.name,
      url: siteConfig.url,
      logo: { '@type': 'ImageObject', url: absoluteUrl(siteConfig.publisher.logo) },
      sameAs: siteConfig.publisher.sameAs,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={query}`,
      'query-input': 'required name=query',
    },
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <h1 className="text-4xl font-bold tracking-tight">{t('home.hero')}</h1>
      <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">{t('site.tagline')}</p>
      <div className="mt-8 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
        <p className="text-sm text-neutral-500">
          {t('home.loading')} — yangi sayt qurilish bosqichida.
        </p>
      </div>
    </div>
  );
}
