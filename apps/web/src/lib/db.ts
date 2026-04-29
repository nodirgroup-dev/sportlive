import { db, posts, categories, users, redirects } from '@sportlive/db';
import { and, desc, eq, sql } from 'drizzle-orm';
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

export async function getRecentPostsCount(locale: Locale): Promise<number> {
  const r = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.locale, locale), eq(posts.status, 'published')));
  return r[0]?.c ?? 0;
}
