import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import type { ListedPost } from '@/lib/db';
import type { Locale } from '@/i18n/routing';

const localeFmt: Record<Locale, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

function articleHref(p: ListedPost): string {
  return `/${p.category?.path ?? ''}/${p.legacyId}-${p.slug}`;
}

export function PostHero({ post, locale }: { post: ListedPost; locale: Locale }) {
  const date = post.publishedAt
    ? new Intl.DateTimeFormat(localeFmt[locale], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(post.publishedAt)
    : '';

  return (
    <Link
      href={articleHref(post) as Route}
      className="group relative block overflow-hidden rounded-xl bg-neutral-900 shadow-sm"
    >
      {post.coverImage ? (
        <Image
          src={post.coverImage}
          alt={post.title}
          width={post.coverImageWidth ?? 1200}
          height={post.coverImageHeight ?? 675}
          className="aspect-[16/9] w-full object-cover opacity-80 transition-opacity group-hover:opacity-90"
          priority
          sizes="(max-width: 768px) 100vw, 1024px"
        />
      ) : (
        <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-700 to-brand-500" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
        {post.category ? (
          <span className="mb-2 inline-block rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            {post.category.name}
          </span>
        ) : null}
        <h2 className="mb-2 text-xl font-bold leading-tight text-white drop-shadow sm:text-3xl md:text-4xl">
          {post.title}
        </h2>
        {date ? (
          <time className="text-xs text-white/80" dateTime={post.publishedAt!.toISOString()}>
            {date}
          </time>
        ) : null}
      </div>
    </Link>
  );
}

export function PostGridCard({ post, locale }: { post: ListedPost; locale: Locale }) {
  const date = post.publishedAt
    ? new Intl.DateTimeFormat(localeFmt[locale], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(post.publishedAt)
    : '';

  return (
    <Link
      href={articleHref(post) as Route}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      {post.coverImage ? (
        <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={post.coverImageWidth ?? 600}
            height={post.coverImageHeight ?? 375}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-4">
        {post.category ? (
          <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            {post.category.name}
          </span>
        ) : null}
        <h3 className="mb-2 line-clamp-3 text-base font-semibold leading-snug group-hover:text-brand-700">
          {post.title}
        </h3>
        {date ? (
          <time
            className="mt-auto text-xs text-neutral-500"
            dateTime={post.publishedAt!.toISOString()}
          >
            {date}
          </time>
        ) : null}
      </div>
    </Link>
  );
}
