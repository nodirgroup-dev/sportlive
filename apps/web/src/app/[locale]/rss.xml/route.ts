import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import { getRssPosts } from '@/lib/db';
import { hasLocale, type Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

const TAGLINE: Record<Locale, string> = {
  uz: 'Sport va futbol yangiliklari',
  ru: 'Спорт и футбольные новости',
  en: 'Sports and football news',
};

async function buildFeed(locale: Locale): Promise<string> {
  const posts = await getRssPosts(locale, 50);
  const channelLink = absoluteUrl(localePath(locale, '/'));
  const feedUrl = locale === 'uz'
    ? absoluteUrl('/rss.xml')
    : absoluteUrl(localePath(locale, '/rss.xml'));
  const lang = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';

  const items = posts
    .filter((p) => p.categoryPath && p.legacyId)
    .map((p) => {
      const url = absoluteUrl(localePath(locale, `/${p.categoryPath}/${p.legacyId}-${p.slug}`));
      const description = stripHtml(p.summary || p.body).slice(0, 500);
      const pubDate = p.publishedAt?.toUTCString() ?? new Date().toUTCString();
      const enclosure = p.coverImage
        ? `      <enclosure url="${escapeXml(absoluteUrl(p.coverImage))}" type="image/webp" />\n`
        : '';
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(p.categoryName ?? '')}</category>
      <description>${escapeXml(description)}</description>
${enclosure}    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(`${siteConfig.name} — ${TAGLINE[locale]}`)}</description>
    <language>${lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ locale: string }> }) {
  const { locale } = await ctx.params;
  if (!hasLocale(locale)) {
    return new Response('Not found', { status: 404 });
  }
  const xml = await buildFeed(locale);
  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}
