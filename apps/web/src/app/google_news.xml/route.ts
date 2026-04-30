import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import { getNewsPosts } from '@/lib/db';

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

export async function GET() {
  const posts = await getNewsPosts();
  const items = posts
    .filter((p) => p.categoryPath && p.legacyId)
    .map((p) => {
      const url = absoluteUrl(localePath(p.locale, `/${p.categoryPath}/${p.legacyId}-${p.slug}`));
      return `  <url>
    <loc>${escapeXml(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.publisher.name)}</news:name>
        <news:language>${p.locale}</news:language>
      </news:publication>
      <news:publication_date>${p.publishedAt.toISOString()}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}
