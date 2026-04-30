import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { getAuthorById, getPostsByAuthor } from '@/lib/db';
import { PostCard } from '@/components/post-card';

export const dynamic = 'force-dynamic';
export const revalidate = 120;

const ARTICLES_BY: Record<Locale, string> = {
  uz: 'maqolalari',
  ru: 'статьи',
  en: 'articles',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id: idStr } = await params;
  if (!hasLocale(locale)) return {};
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) return {};
  const author = await getAuthorById(id);
  if (!author) return {};
  const url = absoluteUrl(localePath(locale, `/author/${id}`));
  return {
    title: `${author.name} — ${ARTICLES_BY[locale]}`,
    description: author.bio || `${author.name}'s articles on Sportlive`,
    alternates: { canonical: url },
    openGraph: { url, title: author.name, type: 'profile' },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: idStr } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();
  const author = await getAuthorById(id);
  if (!author) notFound();
  const list = await getPostsByAuthor(id, locale, 50);

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: absoluteUrl(localePath(locale, `/author/${id}`)),
    description: author.bio ?? undefined,
    image: author.avatar ? absoluteUrl(author.avatar) : undefined,
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <header className="mb-8 flex items-center gap-4">
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-2xl font-bold text-white"
        >
          {author.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{author.name}</h1>
          {author.bio ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{author.bio}</p>
          ) : null}
          <div className="mt-1 text-xs text-neutral-500">
            {list.length} {ARTICLES_BY[locale]}
          </div>
        </div>
      </header>

      <div className="rounded-lg border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
        {list.map((p) => (
          <PostCard key={p.id} post={p} locale={locale} />
        ))}
      </div>
    </div>
  );
}
