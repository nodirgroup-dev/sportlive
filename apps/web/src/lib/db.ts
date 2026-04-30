import { db, posts, categories, users, redirects, staticPages } from '@sportlive/db';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { Locale } from '@/i18n/routing';

export type ListedPost = {
  id: number;
  legacyId: number | null;
  slug: string;
  title: string;
  summary: string | null;
  coverImage: string | null;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  publishedAt: Date | null;
  category: { slug: string; name: string; path: string } | null;
};

export type ArticleDetail = ListedPost & {
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  author: { name: string } | null;
};

async function categoryPath(catId: number | null): Promise<{ slug: string; name: string; path: string } | null> {
  if (!catId) return null;
  const segs: { slug: string; name: string }[] = [];
  const cur = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name, parentId: categories.parentId })
    .from(categories)
    .where(eq(categories.id, catId))
    .limit(1);
  if (cur.length === 0) return null;
  segs.unshift({ slug: cur[0]!.slug, name: cur[0]!.name });
  let parentId = cur[0]!.parentId;
  while (parentId) {
    const p = await db
      .select({ id: categories.id, slug: categories.slug, name: categories.name, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.id, parentId))
      .limit(1);
    if (p.length === 0) break;
    segs.unshift({ slug: p[0]!.slug, name: p[0]!.name });
    parentId = p[0]!.parentId;
  }
  return {
    slug: segs[segs.length - 1]!.slug,
    name: segs[segs.length - 1]!.name,
    path: segs.map((s) => s.slug).join('/'),
  };
}

export async function getLatestPosts(locale: Locale, limit = 20): Promise<ListedPost[]> {
  const rows = await db
    .select({
      id: posts.id,
      legacyId: posts.legacyId,
      slug: posts.slug,
      title: posts.title,
      summary: posts.summary,
      coverImage: posts.coverImage,
      coverImageWidth: posts.coverImageWidth,
      coverImageHeight: posts.coverImageHeight,
      publishedAt: posts.publishedAt,
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(and(eq(posts.locale, locale), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      category: await categoryPath(r.categoryId),
    })),
  );
}

export async function getPostByLegacyId(legacyId: number, locale: Locale): Promise<ArticleDetail | null> {
  const rows = await db
    .select({
      id: posts.id,
      legacyId: posts.legacyId,
      slug: posts.slug,
      title: posts.title,
      summary: posts.summary,
      body: posts.body,
      coverImage: posts.coverImage,
      coverImageWidth: posts.coverImageWidth,
      coverImageHeight: posts.coverImageHeight,
      publishedAt: posts.publishedAt,
      metaTitle: posts.metaTitle,
      metaDescription: posts.metaDescription,
      metaKeywords: posts.metaKeywords,
      categoryId: posts.categoryId,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(and(eq(posts.legacyId, legacyId), eq(posts.locale, locale), eq(posts.status, 'published')))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0]!;
  const cat = await categoryPath(r.categoryId);
  let author: { name: string } | null = null;
  if (r.authorId) {
    const a = await db.select({ name: users.name }).from(users).where(eq(users.id, r.authorId)).limit(1);
    if (a[0]) author = { name: a[0].name };
  }
  return { ...r, category: cat, author };
}

export async function getCategoryBySlugPath(
  slugPath: string,
  locale: Locale,
): Promise<{ id: number; name: string; description: string | null; slug: string; path: string } | null> {
  const segs = slugPath.split('/').filter(Boolean);
  if (segs.length === 0) return null;
  const lastSlug = segs[segs.length - 1]!;
  const candidates = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, lastSlug), eq(categories.locale, locale)));
  for (const c of candidates) {
    const p = await categoryPath(c.id);
    if (p && p.path === slugPath) {
      return { id: c.id, name: c.name, description: c.description, slug: c.slug, path: p.path };
    }
  }
  return null;
}

export async function getPostsByCategory(catId: number, locale: Locale, limit = 30): Promise<ListedPost[]> {
  const rows = await db
    .select({
      id: posts.id,
      legacyId: posts.legacyId,
      slug: posts.slug,
      title: posts.title,
      summary: posts.summary,
      coverImage: posts.coverImage,
      coverImageWidth: posts.coverImageWidth,
      coverImageHeight: posts.coverImageHeight,
      publishedAt: posts.publishedAt,
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(
      and(
        eq(posts.locale, locale),
        eq(posts.status, 'published'),
        eq(posts.categoryId, catId),
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
  return Promise.all(rows.map(async (r) => ({ ...r, category: await categoryPath(r.categoryId) })));
}

export async function getRedirect(fromPath: string): Promise<{ to: string; status: number } | null> {
  const r = await db.select().from(redirects).where(eq(redirects.fromPath, fromPath)).limit(1);
  if (r.length === 0) return null;
  return { to: r[0]!.toPath, status: r[0]!.statusCode };
}

export async function getAllPostsForSitemap(): Promise<
  Array<{ legacyId: number; slug: string; locale: Locale; updatedAt: Date; categoryPath: string | null }>
> {
  const rows = await db
    .select({
      legacyId: posts.legacyId,
      slug: posts.slug,
      locale: posts.locale,
      updatedAt: posts.updatedAt,
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt));
  return Promise.all(
    rows.map(async (r) => ({
      legacyId: r.legacyId!,
      slug: r.slug,
      locale: r.locale as Locale,
      updatedAt: r.updatedAt,
      categoryPath: (await categoryPath(r.categoryId))?.path ?? null,
    })),
  );
}

export type FixtureRow = {
  id: number;
  kickoffAt: Date;
  statusShort: string;
  statusLong: string | null;
  elapsed: number | null;
  homeGoals: number | null;
  awayGoals: number | null;
  league: { id: number; name: string; logo: string | null; country: string | null };
  homeTeam: { id: number; name: string; logo: string | null };
  awayTeam: { id: number; name: string; logo: string | null };
};

async function fixturesQuery(opts: { from?: Date; to?: Date; statusIn?: string[]; live?: boolean; limit?: number; order?: 'asc' | 'desc' }): Promise<FixtureRow[]> {
  const { from, to, statusIn, live, limit = 50, order = 'asc' } = opts;
  const conds: ReturnType<typeof sql>[] = [];
  if (from) conds.push(sql`f.kickoff_at >= ${from.toISOString()}::timestamptz`);
  if (to) conds.push(sql`f.kickoff_at < ${to.toISOString()}::timestamptz`);
  if (statusIn && statusIn.length > 0) {
    conds.push(sql`f.status_short IN (${sql.join(statusIn.map((s) => sql`${s}`), sql`, `)})`);
  }
  if (live) {
    const states = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];
    conds.push(sql`f.status_short IN (${sql.join(states.map((s) => sql`${s}`), sql`, `)})`);
  }

  const rows = await db.execute(sql`
    SELECT
      f.id, f.kickoff_at AS "kickoffAt", f.status_short AS "statusShort",
      f.status_long AS "statusLong", f.elapsed,
      f.home_goals AS "homeGoals", f.away_goals AS "awayGoals",
      l.id AS "leagueId", l.name AS "leagueName", l.logo AS "leagueLogo", l.country AS "leagueCountry",
      ht.id AS "homeId", ht.name AS "homeName", ht.logo AS "homeLogo",
      at.id AS "awayId", at.name AS "awayName", at.logo AS "awayLogo"
    FROM fixtures f
    JOIN leagues l ON l.id = f.league_id
    JOIN teams ht ON ht.id = f.home_team_id
    JOIN teams at ON at.id = f.away_team_id
    ${conds.length > 0 ? sql`WHERE ${sql.join(conds, sql` AND `)}` : sql``}
    ORDER BY f.kickoff_at ${sql.raw(order === 'asc' ? 'ASC' : 'DESC')}
    LIMIT ${limit}
  `);

  // postgres-js returns rows in r as the array directly when using sql.execute
  const arr = (rows as unknown as Array<Record<string, unknown>>) ?? [];
  return arr.map((r) => ({
    id: Number(r.id),
    kickoffAt: new Date(r.kickoffAt as string),
    statusShort: String(r.statusShort),
    statusLong: (r.statusLong as string) ?? null,
    elapsed: r.elapsed === null ? null : Number(r.elapsed),
    homeGoals: r.homeGoals === null ? null : Number(r.homeGoals),
    awayGoals: r.awayGoals === null ? null : Number(r.awayGoals),
    league: {
      id: Number(r.leagueId),
      name: String(r.leagueName),
      logo: (r.leagueLogo as string) ?? null,
      country: (r.leagueCountry as string) ?? null,
    },
    homeTeam: { id: Number(r.homeId), name: String(r.homeName), logo: (r.homeLogo as string) ?? null },
    awayTeam: { id: Number(r.awayId), name: String(r.awayName), logo: (r.awayLogo as string) ?? null },
  }));
}

export async function getUpcomingFixtures(daysAhead = 7, limit = 50): Promise<FixtureRow[]> {
  const from = new Date();
  const to = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return fixturesQuery({ from, to, statusIn: ['NS', 'TBD'], limit, order: 'asc' });
}

export async function getRecentResults(daysBack = 7, limit = 50): Promise<FixtureRow[]> {
  const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const to = new Date();
  return fixturesQuery({ from, to, statusIn: ['FT', 'AET', 'PEN', 'AWD', 'WO'], limit, order: 'desc' });
}

export async function getLiveFixtures(limit = 30): Promise<FixtureRow[]> {
  return fixturesQuery({ live: true, limit, order: 'asc' });
}

export type StaticPageDetail = {
  id: number;
  slug: string;
  title: string;
  body: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export async function getStaticPage(slug: string, locale: Locale): Promise<StaticPageDetail | null> {
  const r = await db
    .select({
      id: staticPages.id,
      slug: staticPages.slug,
      title: staticPages.title,
      body: staticPages.body,
      description: staticPages.description,
      metaTitle: staticPages.metaTitle,
      metaDescription: staticPages.metaDescription,
    })
    .from(staticPages)
    .where(and(eq(staticPages.slug, slug), eq(staticPages.locale, locale)))
    .limit(1);
  return r[0] ?? null;
}

export async function getFooterPages(locale: Locale): Promise<Array<{ slug: string; title: string }>> {
  return db
    .select({ slug: staticPages.slug, title: staticPages.title })
    .from(staticPages)
    .where(eq(staticPages.locale, locale))
    .orderBy(staticPages.sortOrder);
}

export async function getRecentPostsCount(locale: Locale): Promise<number> {
  const r = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.locale, locale), eq(posts.status, 'published')));
  return r[0]?.c ?? 0;
}

/** Posts published within the last 48 hours — Google News window. */
export async function getNewsPosts(): Promise<
  Array<{
    legacyId: number;
    slug: string;
    locale: Locale;
    title: string;
    publishedAt: Date;
    categoryPath: string | null;
  }>
> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const rows = await db
    .select({
      legacyId: posts.legacyId,
      slug: posts.slug,
      locale: posts.locale,
      title: posts.title,
      publishedAt: posts.publishedAt,
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(and(eq(posts.status, 'published'), gte(posts.publishedAt, cutoff)))
    .orderBy(desc(posts.publishedAt))
    .limit(1000);
  return Promise.all(
    rows
      .filter((r) => r.publishedAt !== null && r.legacyId !== null)
      .map(async (r) => ({
        legacyId: r.legacyId!,
        slug: r.slug,
        locale: r.locale as Locale,
        title: r.title,
        publishedAt: r.publishedAt!,
        categoryPath: (await categoryPath(r.categoryId))?.path ?? null,
      })),
  );
}

/** Newest posts in a locale for RSS feed. */
export async function getRssPosts(
  locale: Locale,
  limit = 50,
): Promise<
  Array<{
    legacyId: number;
    slug: string;
    title: string;
    summary: string | null;
    body: string;
    coverImage: string | null;
    publishedAt: Date | null;
    categoryPath: string | null;
    categoryName: string | null;
  }>
> {
  const rows = await db
    .select({
      legacyId: posts.legacyId,
      slug: posts.slug,
      title: posts.title,
      summary: posts.summary,
      body: posts.body,
      coverImage: posts.coverImage,
      publishedAt: posts.publishedAt,
      categoryId: posts.categoryId,
    })
    .from(posts)
    .where(and(eq(posts.locale, locale), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
  return Promise.all(
    rows.map(async (r) => {
      const cp = await categoryPath(r.categoryId);
      return {
        legacyId: r.legacyId!,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        body: r.body,
        coverImage: r.coverImage,
        publishedAt: r.publishedAt,
        categoryPath: cp?.path ?? null,
        categoryName: cp?.name ?? null,
      };
    }),
  );
}
