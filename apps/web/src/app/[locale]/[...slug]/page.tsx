import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale, routing, type Locale } from '@/i18n/routing';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import {
  getCategoryBySlugPath,
  getPostByLegacyId,
  getPostsByCategory,
  getRelatedPosts,
  getAdjacentPosts,
  getStaticPage,
} from '@/lib/db';
import { CommentsSection } from '@/components/comments-section';
import { ShareButtons } from '@/components/share-buttons';
import { ArticleTracker } from '@/components/article-tracker';
import { PostCard } from '@/components/post-card';

const READING_LABEL: Record<Locale, (n: number) => string> = {
  uz: (n) => `${n} daqiqa o'qish`,
  ru: (n) => `${n} мин чтения`,
  en: (n) => `${n} min read`,
};

const VIEWS_LABEL: Record<Locale, (n: number) => string> = {
  uz: (n) => `${n.toLocaleString('uz-UZ')} ko'rishlar`,
  ru: (n) => `${n.toLocaleString('ru-RU')} просмотров`,
  en: (n) => `${n.toLocaleString('en-US')} views`,
};

function readingMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  return Math.max(1, Math.round(words / 220));
}
import { PostHero, PostGridCard } from '@/components/post-hero';
import { BannerSlot } from '@/components/banner-slot';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const ARTICLE_RE = /^(\d+)-(.+?)(?:\.html)?$/;

type RouteParams = { locale: string; slug: string[] };

function isArticle(lastSeg: string): { id: number; slug: string; isHtml: boolean } | null {
  const m = lastSeg.match(ARTICLE_RE);
  if (!m) return null;
  return { id: parseInt(m[1]!, 10), slug: m[2]!, isHtml: lastSeg.endsWith('.html') };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const last = slug[slug.length - 1] ?? '';
  const art = isArticle(last);
  if (art) {
    const post = await getPostByLegacyId(art.id, locale);
    if (!post) return {};
    const url = absoluteUrl(localePath(locale, `/${post.category?.path ?? ''}/${post.legacyId}-${post.slug}`));
    const languages = Object.fromEntries(
      routing.locales.map((l) => [l, absoluteUrl(localePath(l, `/${post.category?.path ?? ''}/${post.legacyId}-${post.slug}`))]),
    );
    return {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary?.replace(/<[^>]*>/g, '').slice(0, 160) || undefined,
      keywords: post.metaKeywords || undefined,
      alternates: { canonical: url, languages },
      openGraph: {
        type: 'article',
        url,
        title: post.title,
        description: post.metaDescription || undefined,
        publishedTime: post.publishedAt?.toISOString(),
        authors: post.author ? [post.author.name] : undefined,
        images: post.coverImage
          ? [
              {
                url: absoluteUrl(post.coverImage),
                width: post.coverImageWidth ?? undefined,
                height: post.coverImageHeight ?? undefined,
                alt: post.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.metaDescription || undefined,
      },
    };
  }
  // Static page
  if (slug.length === 1) {
    const onlySeg = slug[0]!.replace(/\.html$/, '');
    const sp = await getStaticPage(onlySeg, locale);
    if (sp) {
      const url = absoluteUrl(localePath(locale, `/${onlySeg}`));
      return {
        title: sp.metaTitle || sp.title,
        description: sp.metaDescription || sp.description || undefined,
        alternates: { canonical: url },
        openGraph: { url, title: sp.title },
      };
    }
  }

  // Category page
  const path = slug.join('/');
  const cat = await getCategoryBySlugPath(path, locale);
  if (!cat) return {};
  const url = absoluteUrl(localePath(locale, `/${cat.path}`));
  return {
    title: cat.name,
    description: cat.description || undefined,
    alternates: { canonical: url },
    openGraph: { url, title: cat.name, description: cat.description || undefined },
  };
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const last = slug[slug.length - 1] ?? '';
  const art = isArticle(last);

  // ---- Article ----
  if (art) {
    const post = await getPostByLegacyId(art.id, locale);
    if (!post) notFound();

    const canonical = `/${post.category?.path ?? ''}/${post.legacyId}-${post.slug}`;
    const requestedPath = `/${slug.join('/')}`;

    // If accessed via .html or different slug, 301 to canonical
    if (art.isHtml || requestedPath !== canonical) {
      // canonical is a known dynamic route inside [...slug] — bypass typed routes
      permanentRedirect(canonical as Parameters<typeof permanentRedirect>[0]);
    }

    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: post.title,
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.publishedAt?.toISOString(),
      author: post.author
        ? [{ '@type': 'Person', name: post.author.name }]
        : [{ '@type': 'Organization', name: siteConfig.publisher.name }],
      publisher: {
        '@type': 'NewsMediaOrganization',
        name: siteConfig.publisher.name,
        logo: { '@type': 'ImageObject', url: absoluteUrl(siteConfig.publisher.logo) },
      },
      image: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(canonical) },
      inLanguage: locale,
      description: post.metaDescription || undefined,
    };

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('nav.home'), item: absoluteUrl(localePath(locale, '/')) },
        ...(post.category
          ? [
              {
                '@type': 'ListItem',
                position: 2,
                name: post.category.name,
                item: absoluteUrl(localePath(locale, `/${post.category.path}`)),
              },
            ]
          : []),
        { '@type': 'ListItem', position: 3, name: post.title, item: absoluteUrl(canonical) },
      ],
    };

    const dateFmt = post.publishedAt
      ? new Intl.DateTimeFormat({ uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' }[locale], {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(post.publishedAt)
      : '';

    return (
      <article className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        {post.category ? (
          <nav className="mb-3 flex items-center gap-1 text-xs text-neutral-500">
            <Link href={'/' as Parameters<typeof permanentRedirect>[0]} className="hover:text-brand-700">
              {t('nav.home')}
            </Link>
            <span>·</span>
            <Link
              href={`/${post.category.path}` as Parameters<typeof permanentRedirect>[0]}
              className="font-medium uppercase tracking-wider text-brand-700"
            >
              {post.category.name}
            </Link>
          </nav>
        ) : null}
        <header className="mb-6">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            {post.author ? (
              <Link
                href={`/author/${post.author.id}` as Parameters<typeof permanentRedirect>[0]}
                className="font-medium hover:text-brand-700"
              >
                {post.author.name}
              </Link>
            ) : null}
            {dateFmt ? (
              <time dateTime={post.publishedAt!.toISOString()}>{dateFmt}</time>
            ) : null}
            <span>·</span>
            <span>{READING_LABEL[locale](readingMinutes(post.body))}</span>
            {post.viewCount > 0 ? (
              <>
                <span>·</span>
                <span>{VIEWS_LABEL[locale](post.viewCount)}</span>
              </>
            ) : null}
          </div>
        </header>
        <ArticleTracker postId={post.id} />
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            width={post.coverImageWidth ?? 1200}
            height={post.coverImageHeight ?? 675}
            className="mb-6 w-full rounded-xl object-cover shadow-sm"
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 768px"
          />
        ) : null}
        <div className="my-4 flex justify-center">
          <BannerSlot position="in_article_top" />
        </div>
        {(() => {
          // Body cleanup:
          // 1. Strip the leading DLE cover-image marker — the cover is already rendered above.
          // 2. If the migration left summary == body (DLE legacy: full_story empty,
          //    short_story used for both), don't render the summary block — it would be
          //    a verbatim duplicate.
          // Strip the DLE cover-image block (and any leading <br>s after it) wherever
          // it appears in the body — it may be wrapped in <p>, sit at the top, or be
          // embedded later. The cover image is rendered separately above.
          const cleanedBody = post.body
            .replace(
              /<!--\s*dle_image_begin:[\s\S]*?<!--\s*dle_image_end\s*-->(?:\s*<br\s*\/?>)*/gi,
              '',
            )
            // If that left an empty <p></p> at the top, drop it.
            .replace(/^\s*<p>\s*<\/p>\s*/i, '')
            .replace(/^\s*<p>\s*(?:<br\s*\/?>\s*)+/i, '<p>');
          const summaryDup =
            post.summary != null &&
            (post.summary.trim() === post.body.trim() ||
              post.body.trim().startsWith(post.summary.trim()));
          const showSummary = post.summary && !summaryDup;
          return (
            <>
              {showSummary ? (
                <div
                  className="mb-6 border-l-4 border-brand-500 bg-brand-50/40 p-4 text-lg font-medium leading-relaxed text-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200"
                  dangerouslySetInnerHTML={{ __html: post.summary! }}
                />
              ) : null}
              <div className="article-body" dangerouslySetInnerHTML={{ __html: cleanedBody }} />
              <ShareButtons url={absoluteUrl(canonical)} title={post.title} />
              <div className="my-6 flex justify-center">
                <BannerSlot position="in_article_bottom" />
              </div>
            </>
          );
        })()}

        {/* Prev / Next */}
        {await (async () => {
          const { prev, next } = await getAdjacentPosts(post.id, post.categoryId, locale);
          if (!prev && !next) return null;
          const labels: Record<Locale, { prev: string; next: string }> = {
            uz: { prev: '← Oldingi', next: 'Keyingi →' },
            ru: { prev: '← Предыдущая', next: 'Следующая →' },
            en: { prev: '← Previous', next: 'Next →' },
          };
          const href = (p: NonNullable<typeof prev>) =>
            `/${p.category?.path ?? ''}/${p.legacyId}-${p.slug}` as never;
          return (
            <nav className="mt-10 grid gap-3 border-t border-neutral-200 pt-6 sm:grid-cols-2 dark:border-neutral-800">
              {prev ? (
                <Link
                  href={href(prev)}
                  className="block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-brand-500 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-brand-400 dark:hover:bg-neutral-900"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {labels[locale].prev}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium">{prev.title}</div>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={href(next)}
                  className="block rounded-lg border border-neutral-200 p-4 text-right transition-colors hover:border-brand-500 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-brand-400 dark:hover:bg-neutral-900"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {labels[locale].next}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium">{next.title}</div>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          );
        })()}

        {/* Related */}
        {await (async () => {
          const related = await getRelatedPosts(post.id, post.categoryId, locale, 4);
          if (related.length === 0) return null;
          const titles: Record<Locale, string> = {
            uz: "Bog'liq maqolalar",
            ru: 'Похожие материалы',
            en: 'Related articles',
          };
          return (
            <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800">
              <h2 className="mb-4 text-xl font-bold tracking-tight">{titles[locale]}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <PostGridCard key={p.id} post={p} locale={locale} />
                ))}
              </div>
            </section>
          );
        })()}

        <CommentsSection postId={post.id} locale={locale} />
      </article>
    );
  }

  // ---- Static page (single segment, e.g. /maxfiylik-siyosati) ----
  if (slug.length === 1) {
    const onlySeg = slug[0]!.replace(/\.html$/, '');
    const staticPage = await getStaticPage(onlySeg, locale);
    if (staticPage) {
      // 308 .html legacy → no-html canonical
      if (slug[0]!.endsWith('.html')) {
        permanentRedirect(`/${onlySeg}` as Parameters<typeof permanentRedirect>[0]);
      }
      return (
        <article className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
          <h1 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl">{staticPage.title}</h1>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: staticPage.body }} />
        </article>
      );
    }
  }

  // ---- Category ----
  const path = slug.join('/');
  const cat = await getCategoryBySlugPath(path, locale);
  if (!cat) notFound();

  const posts = await getPostsByCategory(cat.id, locale, 31);
  const hero = posts[0];
  const grid = posts.slice(1, 7);
  const rest = posts.slice(7);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{cat.name}</h1>
        {cat.description ? (
          <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">{cat.description}</p>
        ) : null}
      </header>

      {posts.length === 0 ? (
        <p className="text-neutral-500">{t('home.loading')}</p>
      ) : (
        <>
          {hero ? (
            <section className="mb-8">
              <PostHero post={hero} locale={locale} />
            </section>
          ) : null}

          {grid.length > 0 ? (
            <section className="mb-10">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {grid.map((p) => (
                  <PostGridCard key={p.id} post={p} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section>
              <div className="rounded-lg border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
                {rest.map((p) => (
                  <PostCard key={p.id} post={p} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
