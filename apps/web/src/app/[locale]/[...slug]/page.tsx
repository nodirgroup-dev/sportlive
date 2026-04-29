import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale, routing, type Locale } from '@/i18n/routing';
import { siteConfig, absoluteUrl, localePath } from '@/lib/site';
import {
  getCategoryBySlugPath,
  getPostByLegacyId,
  getPostsByCategory,
} from '@/lib/db';
import { PostCard } from '@/components/post-card';

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
      redirect(canonical as Parameters<typeof redirect>[0]);
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
        <header className="mb-6">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            {post.author ? <span>{post.author.name}</span> : null}
            {dateFmt ? (
              <time dateTime={post.publishedAt!.toISOString()}>{dateFmt}</time>
            ) : null}
          </div>
        </header>
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            width={post.coverImageWidth ?? 1200}
            height={post.coverImageHeight ?? 675}
            className="mb-6 w-full rounded-lg object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        ) : null}
        {post.summary ? (
          <p
            className="mb-4 text-lg font-medium text-neutral-700 dark:text-neutral-300"
            dangerouslySetInnerHTML={{ __html: post.summary }}
          />
        ) : null}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </article>
    );
  }

  // ---- Category ----
  const path = slug.join('/');
  const cat = await getCategoryBySlugPath(path, locale);
  if (!cat) notFound();

  const posts = await getPostsByCategory(cat.id, locale, 30);
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">{cat.name}</h1>
      {cat.description ? (
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{cat.description}</p>
      ) : null}
      <div className="mt-4">
        {posts.length === 0 ? (
          <p className="text-neutral-500">{t('home.loading')}</p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} locale={locale as Locale} />)
        )}
      </div>
    </div>
  );
}
