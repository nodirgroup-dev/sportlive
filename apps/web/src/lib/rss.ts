import 'server-only';
import { db, posts, rssSources, rssImported } from '@sportlive/db';
import { eq, and, sql } from 'drizzle-orm';
import { autoSummary } from './text';
import type { Locale } from '@/i18n/routing';

export type ParsedItem = {
  guid: string;
  title: string;
  link: string;
  pubDate: Date | null;
  contentHtml: string;
  summary: string | null;
  image: string | null;
};

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

function pickTag(xml: string, tag: string): string | null {
  // Match <tag ...>content</tag> or self-closing CDATA. Non-greedy.
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return null;
  let inner = m[1] ?? '';
  inner = inner.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
  return inner || null;
}

function parseRss(xml: string): ParsedItem[] {
  // Match both RSS <item> and Atom <entry>.
  const items: ParsedItem[] = [];
  const blockRe = /<(item|entry)[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const m of xml.matchAll(blockRe)) {
    const inner = m[2] ?? '';
    const title = decodeXmlEntities(pickTag(inner, 'title') ?? '');
    let link = pickTag(inner, 'link');
    if (!link) {
      // Atom: <link href="..."/>
      const lm = inner.match(/<link[^>]*href=['"]([^'"]+)['"]/i);
      link = lm ? lm[1]! : null;
    }
    if (!title || !link) continue;
    const guid = pickTag(inner, 'guid') ?? pickTag(inner, 'id') ?? link;
    const pubRaw = pickTag(inner, 'pubDate') ?? pickTag(inner, 'updated') ?? pickTag(inner, 'published');
    const pubDate = pubRaw ? new Date(pubRaw) : null;
    const description = pickTag(inner, 'description') ?? pickTag(inner, 'summary') ?? '';
    const contentEncoded =
      pickTag(inner, 'content:encoded') ?? pickTag(inner, 'content') ?? description;
    // Try common image locations.
    let image: string | null = null;
    const enclosure = inner.match(/<enclosure[^>]*url=['"]([^'"]+)['"][^>]*>/i);
    if (enclosure) image = enclosure[1] ?? null;
    if (!image) {
      const mediaContent = inner.match(/<media:(?:content|thumbnail)[^>]*url=['"]([^'"]+)['"]/i);
      if (mediaContent) image = mediaContent[1] ?? null;
    }
    if (!image && contentEncoded) {
      const imgM = contentEncoded.match(/<img[^>]*src=['"]([^'"]+)['"]/i);
      if (imgM) image = imgM[1] ?? null;
    }
    items.push({
      guid: guid.trim().slice(0, 800),
      title: title.slice(0, 300),
      link: link.trim(),
      pubDate: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate : null,
      contentHtml: contentEncoded,
      summary: description ? decodeXmlEntities(description).replace(/<[^>]*>/g, '').slice(0, 500) : null,
      image,
    });
  }
  return items;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''ʻ`]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

async function rewriteWithAi(input: { title: string; html: string; locale: Locale }): Promise<{
  title: string;
  body: string;
  summary: string;
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const langName = input.locale === 'uz' ? "O'zbek tili" : input.locale === 'ru' ? 'русский' : 'English';
    const sys = `You rewrite news content for sportlive.uz in ${langName}. Goal: paraphrase and improve clarity, NOT translate.

Rules:
- Output STRICT JSON: {"title":..., "body":..., "summary":...}
- "body" stays in HTML. Keep paragraphs (<p>), <a>, <img> intact. Strip tracking params (utm_*).
- "summary" is plain text, max 220 chars, one sentence.
- "title" stays catchy, max 200 chars.
- Same language as input.`;
    const user = JSON.stringify({ title: input.title, html: input.html.slice(0, 18000) });
    const msg = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 16000,
      system: sys,
      messages: [{ role: 'user', content: user }],
    });
    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return null;
    const cleaned = block.text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.title || !parsed.body) return null;
    return {
      title: String(parsed.title).slice(0, 300),
      body: String(parsed.body),
      summary: String(parsed.summary ?? '').slice(0, 500),
    };
  } catch (e) {
    console.error('[rss] rewrite failed', e);
    return null;
  }
}

export type RssImportStats = { fetched: number; created: number; skipped: number; errors: number };

export async function importRssFeed(sourceId: number): Promise<RssImportStats> {
  const stats: RssImportStats = { fetched: 0, created: 0, skipped: 0, errors: 0 };
  const sourceRows = await db
    .select()
    .from(rssSources)
    .where(eq(rssSources.id, sourceId))
    .limit(1);
  if (sourceRows.length === 0) throw new Error('source not found');
  const src = sourceRows[0]!;

  let xml: string;
  try {
    const res = await fetch(src.feedUrl, { headers: { 'user-agent': 'sportlive.uz RSS importer' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    xml = await res.text();
  } catch (e) {
    await db
      .update(rssSources)
      .set({ lastFetchedAt: new Date(), lastError: e instanceof Error ? e.message : 'fetch error' })
      .where(eq(rssSources.id, src.id));
    stats.errors++;
    return stats;
  }

  const parsed = parseRss(xml);
  stats.fetched = parsed.length;

  const newGroupSeed = (await db.select({ m: posts.groupId }).from(posts).orderBy(sql`group_id DESC`).limit(1))[0]?.m ?? 0;
  let groupOffset = 1;

  for (const it of parsed) {
    // Skip if already imported.
    const seen = await db
      .select({ s: rssImported.sourceId })
      .from(rssImported)
      .where(and(eq(rssImported.sourceId, src.id), eq(rssImported.externalId, it.guid)))
      .limit(1);
    if (seen.length > 0) {
      stats.skipped++;
      continue;
    }

    let title = it.title;
    let body = it.contentHtml || `<p>${it.summary ?? ''}</p>`;
    let summary = it.summary;

    if (src.rewriteEnabled) {
      const rewritten = await rewriteWithAi({ title, html: body, locale: src.locale as Locale });
      if (rewritten) {
        title = rewritten.title;
        body = rewritten.body;
        summary = rewritten.summary || summary;
      }
    }

    if (!summary) summary = autoSummary(body, 220);

    const baseSlug = slugify(title) || `rss-${Date.now()}`;
    // Avoid collisions in this locale
    const collide = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.locale, src.locale), eq(posts.slug, baseSlug)))
      .limit(1);
    const slug = collide.length > 0 ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    try {
      const inserted = await db
        .insert(posts)
        .values({
          locale: src.locale as 'uz' | 'ru' | 'en',
          slug,
          title,
          summary,
          body,
          categoryId: src.categoryId,
          status: 'draft',
          publishedAt: it.pubDate,
          metaTitle: title.slice(0, 300),
          metaDescription: summary?.slice(0, 500) ?? null,
          groupId: newGroupSeed + groupOffset++ + 200000,
          coverImage: it.image,
        })
        .returning({ id: posts.id });

      await db.insert(rssImported).values({
        sourceId: src.id,
        externalId: it.guid,
        postId: inserted[0]!.id,
      });
      stats.created++;
    } catch (e) {
      console.error('[rss] insert failed', e);
      stats.errors++;
    }
  }

  await db
    .update(rssSources)
    .set({ lastFetchedAt: new Date(), lastError: null })
    .where(eq(rssSources.id, src.id));

  return stats;
}

