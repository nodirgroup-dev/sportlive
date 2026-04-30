import type { MetadataRoute } from 'next';
import { absoluteUrl, localePath } from '@/lib/site';
import { routing } from '@/i18n/routing';
import { getAllPostsForSitemap } from '@/lib/db';
import { db, staticPages } from '@sportlive/db';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

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

  const posts = await getAllPostsForSitemap();
  const articles = posts
    .filter((p) => p.legacyId && p.categoryPath)
    .map((p) => {
      const path = `/${p.categoryPath}/${p.legacyId}-${p.slug}`;
      return {
        url: absoluteUrl(localePath(p.locale, path)),
        lastModified: p.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      };
    });

  const sp = await db
    .select({ slug: staticPages.slug, locale: staticPages.locale, updatedAt: staticPages.updatedAt })
    .from(staticPages);
  const statics = sp.map((p) => ({
    url: absoluteUrl(localePath(p.locale as 'uz' | 'ru' | 'en', `/${p.slug}`)),
    lastModified: p.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...home, ...articles, ...statics];
}
