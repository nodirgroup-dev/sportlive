import type { MetadataRoute } from 'next';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import { routing } from '@/i18n/routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const home = routing.locales.map((locale) => ({
    url: absoluteUrl(localePath(locale, '/')),
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 1.0,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, absoluteUrl(localePath(l, '/'))]),
      ),
    },
  }));

  // TODO: append article URLs from DB once migration lands
  void siteConfig;
  return [...home];
}
