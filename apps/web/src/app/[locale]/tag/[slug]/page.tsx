import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl, localePath } from '@/lib/site';
import { getTagBySlug, getPostsByTag } from '@/lib/db';
import { PostCard } from '@/components/post-card';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const HEADER: Record<Locale, (n: string) => string> = {
  uz: (n) => `“${n}” bo'yicha maqolalar`,
  ru: (n) => `Материалы по тегу «${n}»`,
  en: (n) => `Articles tagged "${n}"`,
};

const EMPTY: Record<Locale, string> = {
  uz: "Hech qanday maqola topilmadi",
  ru: 'Материалов не найдено',
  en: 'No articles yet',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) return {};
  const tag = await getTagBySlug(slug, locale);
  if (!tag) return {};
  return {
    title: HEADER[locale](tag.name),
    alternates: { canonical: absoluteUrl(localePath(locale, `/tag/${tag.slug}`)) },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();
  setRequestLocale(locale);
  const tag = await getTagBySlug(slug, locale);
  if (!tag) notFound();

  const items = await getPostsByTag(tag.id, locale, 50);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        # <span>{tag.name}</span>
      </h1>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">{EMPTY[locale]}</p>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-950">
          {items.map((p) => (
            <PostCard key={p.id} post={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
