import { db, posts, categories, users, redirects, staticPages, banners, comments } from '@sportlive/db';
import { and, asc, desc, eq, gte, ne, sql } from 'drizzle-orm';
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
  author: { id: number; name: string } | null;
  categoryId: number | null;
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
  let author: { id: number; name: string } | null = null;
  if (r.authorId) {
    const a = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, r.authorId)).limit(1);
    if (a[0]) author = { id: a[0].id, name: a[0].name };
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

/** For homepage widget: live first, then nearest upcoming. */
export async function getMatchSnapshot(limit = 6): Promise<FixtureRow[]> {
  const live = await fixturesQuery({ live: true, limit: 6, order: 'asc' });
  if (live.length >= limit) return live.slice(0, limit);
  const upcoming = await fixturesQuery({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    statusIn: ['NS', 'TBD'],
    limit: limit - live.length,
    order: 'asc',
  });
  return [...live, ...upcoming];
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

export type CommentView = {
  id: number;
  authorName: string | null;
  body: string;
  createdAt: Date;
  parentId: number | null;
};

export async function getApprovedComments(postId: number): Promise<CommentView[]> {
  return db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      body: comments.body,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
    })
    .from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.status, 'approved')))
    .orderBy(asc(comments.createdAt));
}

export type AuthorPublic = {
  id: number;
  name: string;
  bio: string | null;
  avatar: string | null;
};

export async function getAuthorById(id: number): Promise<AuthorPublic | null> {
  const r = await db
    .select({ id: users.id, name: users.name, bio: users.bio, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return r[0] ?? null;
}

export async function getPostsByAuthor(authorId: number, locale: Locale, limit = 30): Promise<ListedPost[]> {
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
    .where(and(eq(posts.locale, locale), eq(posts.status, 'published'), eq(posts.authorId, authorId)))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
  return Promise.all(rows.map(async (r) => ({ ...r, category: await categoryPath(r.categoryId) })));
}

export type StandingsRow = {
  rank: number;
  groupName: string | null;
  points: number;
  played: number;
  won: number;
  drew: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  form: string | null;
  description: string | null;
  team: { id: number; name: string; logo: string | null };
};

export type StandingsTable = {
  league: { id: number; name: string; logo: string | null; country: string | null; season: number };
  groups: Array<{ name: string | null; rows: StandingsRow[] }>;
};

export type LiveEntryView = {
  id: number;
  minute: number | null;
  type: string;
  body: string;
  embedUrl: string | null;
  pinned: number;
  occurredAt: Date;
  author: { id: number; name: string } | null;
};

export async function getLiveEntries(fixtureId: number): Promise<LiveEntryView[]> {
  const rows = (await db.execute(sql`
    SELECT le.id, le.minute, le.type, le.body, le.embed_url AS "embedUrl",
           le.pinned, le.occurred_at AS "occurredAt",
           u.id AS "authorId", u.name AS "authorName"
      FROM live_entries le
      LEFT JOIN users u ON u.id = le.author_id
     WHERE le.fixture_id = ${fixtureId}
     ORDER BY le.pinned DESC, le.occurred_at DESC
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: Number(r.id),
    minute: r.minute === null ? null : Number(r.minute),
    type: String(r.type),
    body: String(r.body),
    embedUrl: (r.embedUrl as string) ?? null,
    pinned: Number(r.pinned),
    occurredAt: new Date(r.occurredAt as string),
    author: r.authorId ? { id: Number(r.authorId), name: String(r.authorName) } : null,
  }));
}

export type FixtureDetail = FixtureRow & {
  round: string | null;
  refereeName: string | null;
  venue: { name: string; city: string | null } | null;
  scoreDetail: unknown;
  raw: unknown;
};

export async function getFixtureById(id: number): Promise<FixtureDetail | null> {
  const rows = (await db.execute(sql`
    SELECT
      f.id, f.kickoff_at AS "kickoffAt", f.status_short AS "statusShort",
      f.status_long AS "statusLong", f.elapsed,
      f.home_goals AS "homeGoals", f.away_goals AS "awayGoals",
      f.round, f.referee_name AS "refereeName",
      f.score_detail AS "scoreDetail", f.raw,
      l.id AS "leagueId", l.name AS "leagueName", l.logo AS "leagueLogo", l.country AS "leagueCountry",
      ht.id AS "homeId", ht.name AS "homeName", ht.logo AS "homeLogo",
      at.id AS "awayId", at.name AS "awayName", at.logo AS "awayLogo",
      v.name AS "venueName", v.city AS "venueCity"
    FROM fixtures f
    JOIN leagues l ON l.id = f.league_id
    JOIN teams ht ON ht.id = f.home_team_id
    JOIN teams at ON at.id = f.away_team_id
    LEFT JOIN venues v ON v.id = f.venue_id
    WHERE f.id = ${id}
    LIMIT 1
  `)) as unknown as Array<Record<string, unknown>>;
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return {
    id: Number(r.id),
    kickoffAt: new Date(r.kickoffAt as string),
    statusShort: String(r.statusShort),
    statusLong: (r.statusLong as string) ?? null,
    elapsed: r.elapsed === null ? null : Number(r.elapsed),
    homeGoals: r.homeGoals === null ? null : Number(r.homeGoals),
    awayGoals: r.awayGoals === null ? null : Number(r.awayGoals),
    round: (r.round as string) ?? null,
    refereeName: (r.refereeName as string) ?? null,
    league: {
      id: Number(r.leagueId),
      name: String(r.leagueName),
      logo: (r.leagueLogo as string) ?? null,
      country: (r.leagueCountry as string) ?? null,
    },
    homeTeam: { id: Number(r.homeId), name: String(r.homeName), logo: (r.homeLogo as string) ?? null },
    awayTeam: { id: Number(r.awayId), name: String(r.awayName), logo: (r.awayLogo as string) ?? null },
    venue: r.venueName ? { name: String(r.venueName), city: (r.venueCity as string) ?? null } : null,
    scoreDetail: r.scoreDetail,
    raw: r.raw,
  };
}

export async function searchPosts(q: string, locale: Locale, limit = 30): Promise<ListedPost[]> {
  const term = `%${q.trim().replace(/[%_]/g, '\\$&')}%`;
  if (!term || term.length < 4) return [];
  const rows = await db.execute(sql`
    SELECT p.id, p.legacy_id AS "legacyId", p.slug, p.title, p.summary,
           p.cover_image AS "coverImage", p.cover_image_width AS "coverImageWidth",
           p.cover_image_height AS "coverImageHeight", p.published_at AS "publishedAt",
           p.category_id AS "categoryId"
      FROM posts p
     WHERE p.locale = ${locale}
       AND p.status = 'published'
       AND (p.title ILIKE ${term} OR p.body ILIKE ${term})
     ORDER BY p.published_at DESC
     LIMIT ${limit}
  `);
  const arr = (rows as unknown as Array<Record<string, unknown>>) ?? [];
  return Promise.all(
    arr.map(async (r) => ({
      id: Number(r.id),
      legacyId: r.legacyId === null ? null : Number(r.legacyId),
      slug: String(r.slug),
      title: String(r.title),
      summary: (r.summary as string) ?? null,
      coverImage: (r.coverImage as string) ?? null,
      coverImageWidth: r.coverImageWidth === null ? null : Number(r.coverImageWidth),
      coverImageHeight: r.coverImageHeight === null ? null : Number(r.coverImageHeight),
      publishedAt: r.publishedAt ? new Date(r.publishedAt as string) : null,
      category: await categoryPath(r.categoryId === null ? null : Number(r.categoryId)),
    })),
  );
}

export async function getStandings(): Promise<StandingsTable[]> {
  const rows = (await db.execute(sql`
    SELECT s.league_id AS "leagueId", l.name AS "leagueName", l.logo AS "leagueLogo",
           l.country AS "leagueCountry", s.season,
           s.rank, s.group_name AS "groupName",
           s.points, s.played, s.won, s.drew, s.lost,
           s.goals_for AS "goalsFor", s.goals_against AS "goalsAgainst", s.goals_diff AS "goalsDiff",
           s.form, s.description,
           t.id AS "teamId", t.name AS "teamName", t.logo AS "teamLogo"
      FROM standings s
      JOIN leagues l ON l.id = s.league_id
      JOIN teams t ON t.id = s.team_id
     ORDER BY l.country NULLS LAST, l.name, s.group_name NULLS FIRST, s.rank
  `)) as unknown as Array<Record<string, unknown>>;

  const tables = new Map<string, StandingsTable>();
  for (const r of rows) {
    const key = `${r.leagueId}:${r.season}`;
    let table = tables.get(key);
    if (!table) {
      table = {
        league: {
          id: Number(r.leagueId),
          name: String(r.leagueName),
          logo: (r.leagueLogo as string) ?? null,
          country: (r.leagueCountry as string) ?? null,
          season: Number(r.season),
        },
        groups: [],
      };
      tables.set(key, table);
    }
    const groupName = (r.groupName as string) ?? null;
    let group = table.groups.find((g) => g.name === groupName);
    if (!group) {
      group = { name: groupName, rows: [] };
      table.groups.push(group);
    }
    group.rows.push({
      rank: Number(r.rank),
      groupName,
      points: Number(r.points),
      played: Number(r.played),
      won: Number(r.won),
      drew: Number(r.drew),
      lost: Number(r.lost),
      goalsFor: Number(r.goalsFor),
      goalsAgainst: Number(r.goalsAgainst),
      goalsDiff: Number(r.goalsDiff),
      form: (r.form as string) ?? null,
      description: (r.description as string) ?? null,
      team: { id: Number(r.teamId), name: String(r.teamName), logo: (r.teamLogo as string) ?? null },
    });
  }
  return [...tables.values()];
}

export async function getRelatedPosts(
  excludeId: number,
  categoryId: number | null,
  locale: Locale,
  limit = 4,
): Promise<ListedPost[]> {
  const conds = [eq(posts.locale, locale), eq(posts.status, 'published'), ne(posts.id, excludeId)];
  if (categoryId) conds.push(eq(posts.categoryId, categoryId));
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
    .where(and(...conds))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
  return Promise.all(rows.map(async (r) => ({ ...r, category: await categoryPath(r.categoryId) })));
}

export type BannerView = {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  altText: string | null;
  htmlSnippet: string | null;
};

export async function getActiveBanners(
  position: 'header' | 'sidebar' | 'in_article_top' | 'in_article_bottom' | 'footer',
): Promise<BannerView[]> {
  const now = new Date().toISOString();
  return db.execute(sql`
    SELECT id, image_url AS "imageUrl", link_url AS "linkUrl", alt_text AS "altText", html_snippet AS "htmlSnippet"
      FROM banners
     WHERE active = true
       AND position = ${position}
       AND (starts_at IS NULL OR starts_at <= ${now}::timestamptz)
       AND (ends_at IS NULL OR ends_at >= ${now}::timestamptz)
     ORDER BY sort_order ASC, id ASC
     LIMIT 5
  `) as unknown as Promise<BannerView[]>;
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
