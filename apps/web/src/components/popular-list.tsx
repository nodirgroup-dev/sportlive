import { Link } from '@/i18n/navigation';
import type { ListedPost } from '@/lib/db';
import type { Locale } from '@/i18n/routing';

function articleHref(p: ListedPost): string {
  const cat = p.category?.path ?? '';
  return `/${cat}/${p.legacyId}-${p.slug}`;
}

export function PopularList({ posts, locale: _locale }: { posts: ListedPost[]; locale: Locale }) {
  if (posts.length === 0) return null;
  return (
    <ol className="space-y-3">
      {posts.map((p, i) => (
        <li key={p.id} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {i + 1}
          </span>
          <Link
            href={articleHref(p) as never}
            className="text-sm font-medium leading-snug hover:text-brand-700 dark:hover:text-brand-400"
          >
            {p.title}
          </Link>
        </li>
      ))}
    </ol>
  );
}
