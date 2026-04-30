import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { ListedPost } from '@/lib/db';
import type { Locale } from '@/i18n/routing';

const localeFmt: Record<Locale, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

function articleHref(p: ListedPost): string {
  const cat = p.category?.path ?? '';
  return `/${cat}/${p.legacyId}-${p.slug}`;
}

export function PostCard({ post, locale }: { post: ListedPost; locale: Locale }) {
  const href = articleHref(post);
  const date = post.publishedAt
    ? new Intl.DateTimeFormat(localeFmt[locale], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(post.publishedAt)
    : '';

  return (
    <article className="group flex gap-4 border-b border-neutral-200 py-4 dark:border-neutral-800">
      {post.coverImage ? (
        <Link href={href as never} className="block flex-shrink-0">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={post.coverImageWidth ?? 200}
            height={post.coverImageHeight ?? 150}
            className="h-24 w-32 rounded object-cover sm:h-28 sm:w-40"
            unoptimized
            sizes="(max-width: 640px) 128px, 160px"
          />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <Link href={href as never} className="block">
          <h2 className="text-lg font-semibold leading-tight group-hover:text-brand-700 sm:text-xl">
            {post.title}
          </h2>
          {post.summary ? (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {stripHtml(post.summary)}
            </p>
          ) : null}
        </Link>
        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
          {post.category ? (
            <Link
              href={`/${post.category.path}` as never}
              className="rounded bg-neutral-100 px-2 py-0.5 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {post.category.name}
            </Link>
          ) : null}
          {date ? <time dateTime={post.publishedAt!.toISOString()}>{date}</time> : null}
        </div>
      </div>
    </article>
  );
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}
