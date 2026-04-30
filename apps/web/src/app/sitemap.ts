import type { MetadataRoute } from 'next';
import { absoluteUrl, localePath } from '@/lib/site';
import { routing, type Locale } from '@/i18n/routing';
import { getAllPostsForSitemap } from '@/lib/db';
import { db, staticPages, tags, teams } from '@sportlive/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

const SECTION_PATHS = ['/football', '/schedule', '/results', '/standings', '/live'] as const;

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

  const sections = routing.locales.flatMap((locale) =>
    SECTION_PATHS.map((p) => ({
      url: absoluteUrl(localePath(locale, p)),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  );

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
    url: absoluteUrl(localePath(p.locale as Locale, `/${p.slug}`)),
    lastModified: p.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const tagRows = await db
    .select({ slug: tags.slug, locale: tags.locale })
    .from(tags);
  const tagEntries = tagRows.map((t) => ({
    url: absoluteUrl(localePath(t.locale as Locale, `/tag/${t.slug}`)),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }));

  // Top teams (active in our leagues, by appearance in fixtures). Cap at 200
  // to keep sitemap manageable; team pages are not super-high-traffic.
  const teamRows = await db
    .select({ id: teams.id })
    .from(teams)
    .orderBy(desc(teams.id))
    .limit(200);
  const teamEntries = routing.locales.flatMap((locale) =>
    teamRows.map((t) => ({
      url: absoluteUrl(localePath(locale, `/team/${t.id}`)),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  );

  return [...home, ...sections, ...articles, ...statics, ...tagEntries, ...teamEntries];
}
