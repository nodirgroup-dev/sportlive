import {
  db,
  posts,
  categories,
  users,
  redirects,
  staticPages,
  banners,
  comments,
  tags,
  postTags,
  players,
  playerStats,
  matchLineups,
  teams,
  transfers,
} from '@sportlive/db';
import { and, asc, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm';
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
  viewCount: number;
};

// Categories rarely change and there are <100 of them. Load the whole table
// once per request lifecycle and resolve paths in-memory. This eliminates a
// massive N+1: previously every post listing fired ~2-3 sequential queries
// per row to walk the category tree (60+ queries per home page render).
type CatRow = {
  id: number;
  slug: string;
  name: string;
  parentId: number | null;
  locale: 'uz' | 'ru' | 'en';
  description: string | null;
};
type CatCache = { byId: Map<number, CatRow>; loadedAt: number };
let _catCache: CatCache | null = null;
const CAT_CACHE_MS = 60_000;

async function getCategoryCache(): Promise<CatCache> {
  const now = Date.now();
  if (_catCache && now - _catCache.loadedAt < CAT_CACHE_MS) return _catCache;
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      parentId: categories.parentId,
      locale: categories.locale,
      description: categories.description,
    })
    .from(categories);
  const byId = new Map<number, CatRow>();
  for (const r of rows)
    byId.set(r.id, {
      id: r.id,
      slug: r.slug,
      name: r.name,
      parentId: r.parentId,
      locale: r.locale as 'uz' | 'ru' | 'en',
      description: r.description,
    });
  _catCache = { byId, loadedAt: now };
  return _catCache;
}

function resolveCategoryPath(
  cache: CatCache,
  catId: number | null,
): { slug: string; name: string; path: string } | null {
  if (!catId) return null;
  const segs: CatRow[] = [];
  let cur = cache.byId.get(catId);
  while (cur) {
    segs.unshift(cur);
    cur = cur.parentId ? cache.byId.get(cur.parentId) : undefined;
  }
  if (segs.length === 0) return null;
  return {
    slug: segs[segs.length - 1]!.slug,
    name: segs[segs.length - 1]!.name,
    path: segs.map((s) => s.slug).join('/'),
  };
}

async function categoryPath(catId: number | null): Promise<{ slug: string; name: string; path: string } | null> {
  if (!catId) return null;
  const cache = await getCategoryCache();
  return resolveCategoryPath(cache, catId);
}

export async function getLatestPosts(locale: Locale, limit = 20): Promise<ListedPost[]> {
  const [rows, cache] = await Promise.all([
    db
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
      .limit(limit),
    getCategoryCache(),
  ]);

  return rows.map((r) => ({ ...r, category: resolveCategoryPath(cache, r.categoryId) }));
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
      viewCount: posts.viewCount,
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
  const cache = await getCategoryCache();
  for (const c of cache.byId.values()) {
    if (c.slug !== lastSlug || c.locale !== locale) continue;
    const p = resolveCategoryPath(cache, c.id);
    if (!p || p.path !== slugPath) continue;
    return { id: c.id, name: c.name, description: c.description, slug: c.slug, path: p.path };
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
  const _cache = await getCategoryCache();
  return rows.map((r) => ({ ...r, category: resolveCategoryPath(_cache, r.categoryId) }));
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
  const cache = await getCategoryCache();
  return rows.map((r) => ({
    legacyId: r.legacyId!,
    slug: r.slug,
    locale: r.locale as Locale,
    updatedAt: r.updatedAt,
    categoryPath: resolveCategoryPath(cache, r.categoryId)?.path ?? null,
  }));
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
  likeCount: number;
};

export async function getApprovedComments(postId: number): Promise<CommentView[]> {
  return db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      body: comments.body,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      likeCount: comments.likeCount,
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
  const _cache = await getCategoryCache();
  return rows.map((r) => ({ ...r, category: resolveCategoryPath(_cache, r.categoryId) }));
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

export type TeamDetail = {
  id: number;
  name: string;
  code: string | null;
  country: string | null;
  logo: string | null;
  founded: number | null;
  venue: { id: number; name: string; city: string | null; capacity: number | null } | null;
};

export async function getTeamById(id: number): Promise<TeamDetail | null> {
  const rows = (await db.execute(sql`
    SELECT
      t.id, t.name, t.code, t.country, t.logo, t.founded,
      v.id AS "venueId", v.name AS "venueName", v.city AS "venueCity", v.capacity AS "venueCapacity"
    FROM teams t
    LEFT JOIN venues v ON v.id = t.venue_id
    WHERE t.id = ${id}
    LIMIT 1
  `)) as unknown as Array<Record<string, unknown>>;
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return {
    id: Number(r.id),
    name: String(r.name),
    code: (r.code as string) ?? null,
    country: (r.country as string) ?? null,
    logo: (r.logo as string) ?? null,
    founded: r.founded === null ? null : Number(r.founded),
    venue: r.venueId
      ? {
          id: Number(r.venueId),
          name: String(r.venueName),
          city: (r.venueCity as string) ?? null,
          capacity: r.venueCapacity === null ? null : Number(r.venueCapacity),
        }
      : null,
  };
}

async function teamFixturesQuery(opts: {
  teamId: number;
  from?: Date;
  to?: Date;
  statusIn?: string[];
  limit: number;
  order: 'asc' | 'desc';
}): Promise<FixtureRow[]> {
  const { teamId, from, to, statusIn, limit, order } = opts;
  const conds: ReturnType<typeof sql>[] = [
    sql`(f.home_team_id = ${teamId} OR f.away_team_id = ${teamId})`,
  ];
  if (from) conds.push(sql`f.kickoff_at >= ${from.toISOString()}::timestamptz`);
  if (to) conds.push(sql`f.kickoff_at < ${to.toISOString()}::timestamptz`);
  if (statusIn && statusIn.length > 0) {
    conds.push(sql`f.status_short IN (${sql.join(statusIn.map((s) => sql`${s}`), sql`, `)})`);
  }
  const rows = (await db.execute(sql`
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
    WHERE ${sql.join(conds, sql` AND `)}
    ORDER BY f.kickoff_at ${sql.raw(order === 'asc' ? 'ASC' : 'DESC')}
    LIMIT ${limit}
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
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

export async function getTeamUpcoming(teamId: number, limit = 10): Promise<FixtureRow[]> {
  return teamFixturesQuery({
    teamId,
    from: new Date(),
    statusIn: ['NS', 'TBD'],
    limit,
    order: 'asc',
  });
}

export async function getTeamRecent(teamId: number, limit = 10): Promise<FixtureRow[]> {
  return teamFixturesQuery({
    teamId,
    statusIn: ['FT', 'AET', 'PEN', 'AWD', 'WO'],
    limit,
    order: 'desc',
  });
}

export type TagRow = { id: number; slug: string; name: string };

export async function getTagsForPost(postId: number): Promise<TagRow[]> {
  const rows = await db
    .select({ id: tags.id, slug: tags.slug, name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, postId))
    .orderBy(asc(tags.name));
  return rows;
}

export async function getTagBySlug(slug: string, locale: Locale): Promise<TagRow | null> {
  const rows = await db
    .select({ id: tags.id, slug: tags.slug, name: tags.name })
    .from(tags)
    .where(and(eq(tags.locale, locale), eq(tags.slug, slug)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPostsByTag(tagId: number, locale: Locale, limit = 30): Promise<ListedPost[]> {
  const rows = (await db.execute(sql`
    SELECT p.id, p.legacy_id AS "legacyId", p.slug, p.title, p.summary,
           p.cover_image AS "coverImage", p.cover_image_width AS "coverImageWidth",
           p.cover_image_height AS "coverImageHeight", p.published_at AS "publishedAt",
           p.category_id AS "categoryId"
      FROM posts p
      JOIN post_tags pt ON pt.post_id = p.id
     WHERE pt.tag_id = ${tagId}
       AND p.locale = ${locale}
       AND p.status = 'published'
     ORDER BY p.published_at DESC NULLS LAST
     LIMIT ${limit}
  `)) as unknown as Array<Record<string, unknown>>;
  const cache = await getCategoryCache();
  return rows.map((r) => ({
    id: Number(r.id),
    legacyId: r.legacyId === null ? null : Number(r.legacyId),
    slug: String(r.slug),
    title: String(r.title),
    summary: (r.summary as string) ?? null,
    coverImage: (r.coverImage as string) ?? null,
    coverImageWidth: r.coverImageWidth === null ? null : Number(r.coverImageWidth),
    coverImageHeight: r.coverImageHeight === null ? null : Number(r.coverImageHeight),
    publishedAt: r.publishedAt ? new Date(r.publishedAt as string) : null,
    category: resolveCategoryPath(cache, r.categoryId === null ? null : Number(r.categoryId)),
  }));
}

function tagSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['ʻ`]/g, '')
    .replace(/[^a-z0-9а-яёЀ-ӿ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

/**
 * Replace a post's tags with the given names. Names are split externally
 * (comma-separated), so this just upserts each tag and rewrites the join table.
 */
export async function getAllTagNames(locale: Locale, limit = 200): Promise<string[]> {
  const rows = await db
    .select({ name: tags.name })
    .from(tags)
    .where(eq(tags.locale, locale))
    .orderBy(asc(tags.name))
    .limit(limit);
  return rows.map((r) => r.name);
}

export async function setPostTags(postId: number, locale: Locale, names: string[]): Promise<void> {
  const cleaned = Array.from(
    new Set(names.map((n) => n.trim()).filter((n) => n.length > 0 && n.length <= 100)),
  );

  // Delete existing links for this post.
  await db.delete(postTags).where(eq(postTags.postId, postId));

  if (cleaned.length === 0) return;

  const tagIds: number[] = [];
  for (const name of cleaned) {
    const slug = tagSlug(name);
    if (!slug) continue;
    const found = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.locale, locale), eq(tags.slug, slug)))
      .limit(1);
    if (found.length > 0) {
      tagIds.push(found[0]!.id);
    } else {
      const inserted = await db
        .insert(tags)
        .values({ locale, slug, name })
        .returning({ id: tags.id });
      if (inserted[0]) tagIds.push(inserted[0].id);
    }
  }

  if (tagIds.length === 0) return;
  await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
}

export type TeamStandingPosition = {
  league: { id: number; name: string; logo: string | null; country: string | null; season: number };
  groupName: string | null;
  rank: number;
  points: number;
  played: number;
  won: number;
  drew: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
};

export async function getTeamStandings(teamId: number): Promise<TeamStandingPosition[]> {
  const rows = (await db.execute(sql`
    SELECT
      s.rank, s.group_name AS "groupName", s.points, s.played,
      s.won, s.drew, s.lost,
      s.goals_for AS "goalsFor", s.goals_against AS "goalsAgainst", s.goals_diff AS "goalsDiff",
      s.season,
      l.id AS "leagueId", l.name AS "leagueName", l.logo AS "leagueLogo", l.country AS "leagueCountry"
    FROM standings s
    JOIN leagues l ON l.id = s.league_id
    WHERE s.team_id = ${teamId}
    ORDER BY s.season DESC
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    league: {
      id: Number(r.leagueId),
      name: String(r.leagueName),
      logo: (r.leagueLogo as string) ?? null,
      country: (r.leagueCountry as string) ?? null,
      season: Number(r.season),
    },
    groupName: (r.groupName as string) ?? null,
    rank: Number(r.rank),
    points: Number(r.points),
    played: Number(r.played),
    won: Number(r.won),
    drew: Number(r.drew),
    lost: Number(r.lost),
    goalsFor: Number(r.goalsFor),
    goalsAgainst: Number(r.goalsAgainst),
    goalsDiff: Number(r.goalsDiff),
  }));
}

export type TeamFormResult = 'W' | 'D' | 'L';

export function teamFormFromFixtures(teamId: number, recent: FixtureRow[]): TeamFormResult[] {
  return recent
    .slice(0, 5)
    .reverse()
    .map((f) => {
      const isHome = f.homeTeam.id === teamId;
      const my = isHome ? f.homeGoals : f.awayGoals;
      const their = isHome ? f.awayGoals : f.homeGoals;
      if (my === null || their === null) return 'D';
      if (my > their) return 'W';
      if (my < their) return 'L';
      return 'D';
    });
}

// =================== Players & lineups ===================

export type PlayerDetail = {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  nationality: string | null;
  photo: string | null;
  height: string | null;
  weight: string | null;
  birthYear: number | null;
  position: string | null;
  team: { id: number; name: string; logo: string | null } | null;
};

export async function getPlayerById(id: number): Promise<PlayerDetail | null> {
  const rows = (await db.execute(sql`
    SELECT p.id, p.name, p.firstname, p.lastname, p.nationality, p.photo, p.height, p.weight,
           p.birth_year AS "birthYear", p.position,
           t.id AS "teamId", t.name AS "teamName", t.logo AS "teamLogo"
    FROM players p
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.id = ${id}
    LIMIT 1
  `)) as unknown as Array<Record<string, unknown>>;
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return {
    id: Number(r.id),
    name: String(r.name),
    firstname: (r.firstname as string) ?? null,
    lastname: (r.lastname as string) ?? null,
    nationality: (r.nationality as string) ?? null,
    photo: (r.photo as string) ?? null,
    height: (r.height as string) ?? null,
    weight: (r.weight as string) ?? null,
    birthYear: r.birthYear === null ? null : Number(r.birthYear),
    position: (r.position as string) ?? null,
    team: r.teamId
      ? { id: Number(r.teamId), name: String(r.teamName), logo: (r.teamLogo as string) ?? null }
      : null,
  };
}

export type PlayerStatsRow = {
  league: { id: number; name: string; logo: string | null; country: string | null };
  season: number;
  team: { id: number; name: string; logo: string | null } | null;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  rating: string | null;
};

export async function getPlayerStats(playerId: number): Promise<PlayerStatsRow[]> {
  const rows = (await db.execute(sql`
    SELECT s.season,
           s.appearances, s.minutes, s.goals, s.assists,
           s.yellow_cards AS "yellowCards", s.red_cards AS "redCards", s.rating,
           l.id AS "leagueId", l.name AS "leagueName", l.logo AS "leagueLogo", l.country AS "leagueCountry",
           t.id AS "teamId", t.name AS "teamName", t.logo AS "teamLogo"
    FROM player_stats s
    JOIN leagues l ON l.id = s.league_id
    LEFT JOIN teams t ON t.id = s.team_id
    WHERE s.player_id = ${playerId}
    ORDER BY s.season DESC, s.goals DESC
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    league: {
      id: Number(r.leagueId),
      name: String(r.leagueName),
      logo: (r.leagueLogo as string) ?? null,
      country: (r.leagueCountry as string) ?? null,
    },
    season: Number(r.season),
    team: r.teamId
      ? { id: Number(r.teamId), name: String(r.teamName), logo: (r.teamLogo as string) ?? null }
      : null,
    appearances: Number(r.appearances),
    minutes: Number(r.minutes),
    goals: Number(r.goals),
    assists: Number(r.assists),
    yellowCards: Number(r.yellowCards),
    redCards: Number(r.redCards),
    rating: (r.rating as string) ?? null,
  }));
}

export type TopScorerRow = {
  rank: number;
  player: { id: number; name: string; photo: string | null; nationality: string | null };
  team: { id: number; name: string; logo: string | null } | null;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
};

export async function getTopScorers(leagueId: number, season: number, limit = 25): Promise<TopScorerRow[]> {
  const rows = (await db.execute(sql`
    SELECT s.appearances, s.minutes, s.goals, s.assists,
           p.id AS "playerId", p.name AS "playerName", p.photo, p.nationality,
           t.id AS "teamId", t.name AS "teamName", t.logo AS "teamLogo"
    FROM player_stats s
    JOIN players p ON p.id = s.player_id
    LEFT JOIN teams t ON t.id = s.team_id
    WHERE s.league_id = ${leagueId} AND s.season = ${season}
    ORDER BY s.goals DESC, s.assists DESC, p.name ASC
    LIMIT ${limit}
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r, i) => ({
    rank: i + 1,
    player: {
      id: Number(r.playerId),
      name: String(r.playerName),
      photo: (r.photo as string) ?? null,
      nationality: (r.nationality as string) ?? null,
    },
    team: r.teamId
      ? { id: Number(r.teamId), name: String(r.teamName), logo: (r.teamLogo as string) ?? null }
      : null,
    appearances: Number(r.appearances),
    minutes: Number(r.minutes),
    goals: Number(r.goals),
    assists: Number(r.assists),
  }));
}

export type LineupPlayer = {
  id: number;
  name: string;
  number: number | null;
  pos: string | null;
  grid: string | null;
};

export type FixtureLineup = {
  team: { id: number; name: string; logo: string | null };
  formation: string | null;
  coachName: string | null;
  startXi: LineupPlayer[];
  substitutes: LineupPlayer[];
};

type ApiFootballLineupPlayer = {
  player?: { id?: number; name?: string; number?: number; pos?: string; grid?: string };
};

function mapLineupArray(raw: unknown): LineupPlayer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it: ApiFootballLineupPlayer) => {
      const p = it?.player ?? {};
      if (typeof p.id !== 'number' || typeof p.name !== 'string') return null;
      return {
        id: p.id,
        name: p.name,
        number: typeof p.number === 'number' ? p.number : null,
        pos: typeof p.pos === 'string' ? p.pos : null,
        grid: typeof p.grid === 'string' ? p.grid : null,
      };
    })
    .filter((x): x is LineupPlayer => x !== null);
}

export async function getMatchLineups(fixtureId: number): Promise<FixtureLineup[]> {
  const rows = await db
    .select({
      teamId: matchLineups.teamId,
      formation: matchLineups.formation,
      coachName: matchLineups.coachName,
      startXi: matchLineups.startXi,
      substitutes: matchLineups.substitutes,
      teamName: teams.name,
      teamLogo: teams.logo,
    })
    .from(matchLineups)
    .innerJoin(teams, eq(teams.id, matchLineups.teamId))
    .where(eq(matchLineups.fixtureId, fixtureId));
  return rows.map((r) => ({
    team: { id: r.teamId, name: r.teamName, logo: r.teamLogo },
    formation: r.formation,
    coachName: r.coachName,
    startXi: mapLineupArray(r.startXi),
    substitutes: mapLineupArray(r.substitutes),
  }));
}

export type LeagueRow = { id: number; name: string; country: string | null; logo: string | null; season: number };

export async function getLeaguesWithScorers(): Promise<LeagueRow[]> {
  const rows = (await db.execute(sql`
    SELECT DISTINCT l.id, l.name, l.country, l.logo, l.season
    FROM leagues l
    JOIN player_stats s ON s.league_id = l.id AND s.season = l.season
    ORDER BY l.country NULLS LAST, l.name
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    country: (r.country as string) ?? null,
    logo: (r.logo as string) ?? null,
    season: Number(r.season),
  }));
}

// =================== H2H + Squad + Transfers ===================

export type H2hRow = {
  id: number;
  kickoffAt: Date;
  statusShort: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homeTeam: { id: number; name: string; logo: string | null };
  awayTeam: { id: number; name: string; logo: string | null };
  league: { name: string };
};

/** Last N completed meetings between two teams (any side). */
export async function getHeadToHead(homeId: number, awayId: number, limit = 5): Promise<H2hRow[]> {
  const rows = (await db.execute(sql`
    SELECT f.id, f.kickoff_at AS "kickoffAt", f.status_short AS "statusShort",
           f.home_goals AS "homeGoals", f.away_goals AS "awayGoals",
           ht.id AS "homeId", ht.name AS "homeName", ht.logo AS "homeLogo",
           at.id AS "awayId", at.name AS "awayName", at.logo AS "awayLogo",
           l.name AS "leagueName"
    FROM fixtures f
    JOIN teams ht ON ht.id = f.home_team_id
    JOIN teams at ON at.id = f.away_team_id
    JOIN leagues l ON l.id = f.league_id
    WHERE ((f.home_team_id = ${homeId} AND f.away_team_id = ${awayId})
        OR (f.home_team_id = ${awayId} AND f.away_team_id = ${homeId}))
      AND f.status_short IN ('FT','AET','PEN','AWD','WO')
    ORDER BY f.kickoff_at DESC
    LIMIT ${limit}
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: Number(r.id),
    kickoffAt: new Date(r.kickoffAt as string),
    statusShort: String(r.statusShort),
    homeGoals: r.homeGoals === null ? null : Number(r.homeGoals),
    awayGoals: r.awayGoals === null ? null : Number(r.awayGoals),
    homeTeam: { id: Number(r.homeId), name: String(r.homeName), logo: (r.homeLogo as string) ?? null },
    awayTeam: { id: Number(r.awayId), name: String(r.awayName), logo: (r.awayLogo as string) ?? null },
    league: { name: String(r.leagueName) },
  }));
}

export type SquadPlayer = {
  id: number;
  name: string;
  position: string | null;
  photo: string | null;
  goals: number;
  assists: number;
};

/** Players whose latest team is teamId. Sorted by recent league season's goals. */
export async function getTeamSquad(teamId: number, limit = 50): Promise<SquadPlayer[]> {
  const rows = (await db.execute(sql`
    SELECT
      p.id, p.name, p.position, p.photo,
      COALESCE((
        SELECT goals FROM player_stats s
        WHERE s.player_id = p.id AND s.team_id = ${teamId}
        ORDER BY season DESC LIMIT 1
      ), 0)::int AS goals,
      COALESCE((
        SELECT assists FROM player_stats s
        WHERE s.player_id = p.id AND s.team_id = ${teamId}
        ORDER BY season DESC LIMIT 1
      ), 0)::int AS assists
    FROM players p
    WHERE p.team_id = ${teamId}
    ORDER BY goals DESC, p.name ASC
    LIMIT ${limit}
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    position: (r.position as string) ?? null,
    photo: (r.photo as string) ?? null,
    goals: Number(r.goals),
    assists: Number(r.assists),
  }));
}

export type TransferRow = {
  id: number;
  date: Date | null;
  type: string | null;
  player: { id: number; name: string; photo: string | null };
  teamIn: { id: number; name: string; logo: string | null } | null;
  teamOut: { id: number; name: string; logo: string | null } | null;
};

export async function getTeamTransfers(teamId: number, limit = 20): Promise<TransferRow[]> {
  const rows = (await db.execute(sql`
    SELECT t.id, t.transfer_date AS "date", t.type,
           p.id AS "playerId", p.name AS "playerName", p.photo,
           ti.id AS "tiId", ti.name AS "tiName", ti.logo AS "tiLogo",
           toq.id AS "toId", toq.name AS "toName", toq.logo AS "toLogo"
    FROM transfers t
    JOIN players p ON p.id = t.player_id
    LEFT JOIN teams ti ON ti.id = t.team_in_id
    LEFT JOIN teams toq ON toq.id = t.team_out_id
    WHERE t.team_in_id = ${teamId} OR t.team_out_id = ${teamId}
    ORDER BY t.transfer_date DESC NULLS LAST, t.id DESC
    LIMIT ${limit}
  `)) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: Number(r.id),
    date: r.date ? new Date(r.date as string) : null,
    type: (r.type as string) ?? null,
    player: { id: Number(r.playerId), name: String(r.playerName), photo: (r.photo as string) ?? null },
    teamIn: r.tiId ? { id: Number(r.tiId), name: String(r.tiName), logo: (r.tiLogo as string) ?? null } : null,
    teamOut: r.toId ? { id: Number(r.toId), name: String(r.toName), logo: (r.toLogo as string) ?? null } : null,
  }));
}

// =================== Search ===================

export async function searchPosts(
  q: string,
  locale: Locale,
  opts: { page?: number; pageSize?: number } = {},
): Promise<{ items: ListedPost[]; total: number; page: number; pageSize: number }> {
  const trimmed = q.trim();
  const term = `%${trimmed.replace(/[%_]/g, '\\$&')}%`;
  const pageSize = Math.max(1, Math.min(opts.pageSize ?? 20, 50));
  const page = Math.max(1, opts.page ?? 1);
  if (trimmed.length < 4) return { items: [], total: 0, page, pageSize };

  const offset = (page - 1) * pageSize;

  const [items, totalRows] = await Promise.all([
    db.execute(sql`
      SELECT p.id, p.legacy_id AS "legacyId", p.slug, p.title, p.summary,
             p.cover_image AS "coverImage", p.cover_image_width AS "coverImageWidth",
             p.cover_image_height AS "coverImageHeight", p.published_at AS "publishedAt",
             p.category_id AS "categoryId"
        FROM posts p
       WHERE p.locale = ${locale}
         AND p.status = 'published'
         AND (p.title ILIKE ${term} OR p.body ILIKE ${term})
       ORDER BY p.published_at DESC
       LIMIT ${pageSize} OFFSET ${offset}
    `),
    db.execute(sql`
      SELECT count(*)::int AS c
        FROM posts p
       WHERE p.locale = ${locale}
         AND p.status = 'published'
         AND (p.title ILIKE ${term} OR p.body ILIKE ${term})
    `),
  ]);
  const arr = (items as unknown as Array<Record<string, unknown>>) ?? [];
  const totalArr = (totalRows as unknown as Array<{ c: number }>) ?? [];
  const total = Number(totalArr[0]?.c ?? 0);

  const cache = await getCategoryCache();
  const mapped = arr.map((r) => ({
    id: Number(r.id),
    legacyId: r.legacyId === null ? null : Number(r.legacyId),
    slug: String(r.slug),
    title: String(r.title),
    summary: (r.summary as string) ?? null,
    coverImage: (r.coverImage as string) ?? null,
    coverImageWidth: r.coverImageWidth === null ? null : Number(r.coverImageWidth),
    coverImageHeight: r.coverImageHeight === null ? null : Number(r.coverImageHeight),
    publishedAt: r.publishedAt ? new Date(r.publishedAt as string) : null,
    category: resolveCategoryPath(cache, r.categoryId === null ? null : Number(r.categoryId)),
  }));
  return { items: mapped, total, page, pageSize };
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
  const _cache = await getCategoryCache();
  return rows.map((r) => ({ ...r, category: resolveCategoryPath(_cache, r.categoryId) }));
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

export type AdjacentPost = {
  legacyId: number | null;
  slug: string;
  title: string;
  category: { path: string } | null;
};

/** Previous and next published posts, scoped to the same category if provided, else locale-wide. */
export async function getAdjacentPosts(
  postId: number,
  categoryId: number | null,
  locale: Locale,
): Promise<{ prev: AdjacentPost | null; next: AdjacentPost | null }> {
  const cur = await db
    .select({ publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  const at = cur[0]?.publishedAt;
  if (!at) return { prev: null, next: null };

  const baseConds = [
    eq(posts.locale, locale),
    eq(posts.status, 'published'),
    sql`${posts.publishedAt} IS NOT NULL`,
  ];
  if (categoryId) baseConds.push(eq(posts.categoryId, categoryId));

  const [prevRows, nextRows] = await Promise.all([
    db
      .select({
        id: posts.id,
        legacyId: posts.legacyId,
        slug: posts.slug,
        title: posts.title,
        categoryId: posts.categoryId,
      })
      .from(posts)
      .where(and(...baseConds, sql`${posts.publishedAt} < ${at.toISOString()}::timestamptz`))
      .orderBy(desc(posts.publishedAt))
      .limit(1),
    db
      .select({
        id: posts.id,
        legacyId: posts.legacyId,
        slug: posts.slug,
        title: posts.title,
        categoryId: posts.categoryId,
      })
      .from(posts)
      .where(and(...baseConds, sql`${posts.publishedAt} > ${at.toISOString()}::timestamptz`))
      .orderBy(asc(posts.publishedAt))
      .limit(1),
  ]);

  const enrich = async (r: typeof prevRows[number] | undefined): Promise<AdjacentPost | null> => {
    if (!r) return null;
    const cat = await categoryPath(r.categoryId);
    return {
      legacyId: r.legacyId,
      slug: r.slug,
      title: r.title,
      category: cat ? { path: cat.path } : null,
    };
  };

  return {
    prev: await enrich(prevRows[0]),
    next: await enrich(nextRows[0]),
  };
}

/** Top-viewed published posts in the last N hours, scored by viewCount/recency. */
export async function getTrending(locale: Locale, hours = 24, limit = 5): Promise<ListedPost[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
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
        gte(posts.publishedAt, cutoff),
      ),
    )
    .orderBy(desc(posts.viewCount), desc(posts.publishedAt))
    .limit(limit);
  if (rows.length > 0) {
    const _cache = await getCategoryCache();
  return rows.map((r) => ({ ...r, category: resolveCategoryPath(_cache, r.categoryId) }));
  }
  // Fall back to most-popular semantics when there's no recent traffic yet.
  return getMostPopular(locale, limit);
}

/** Most recently featured published post for the locale; null if none. */
export async function getFeaturedHero(locale: Locale): Promise<ListedPost | null> {
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
        sql`${posts.featuredAt} IS NOT NULL`,
      ),
    )
    .orderBy(desc(posts.featuredAt))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0]!;
  return { ...r, category: await categoryPath(r.categoryId) };
}

export async function getMostPopular(locale: Locale, limit = 5): Promise<ListedPost[]> {
  // 1-year window so the panel surfaces content immediately after migration;
  // once view counts accumulate the ordering will reflect actual popularity.
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
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
    .where(and(eq(posts.locale, locale), eq(posts.status, 'published'), gte(posts.publishedAt, cutoff)))
    .orderBy(desc(posts.viewCount), desc(posts.publishedAt))
    .limit(limit);
  const _cache = await getCategoryCache();
  return rows.map((r) => ({ ...r, category: resolveCategoryPath(_cache, r.categoryId) }));
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
  const cache = await getCategoryCache();
  return rows.map((r) => {
    const cp = resolveCategoryPath(cache, r.categoryId);
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
  });
}
