import { Link } from '@/i18n/navigation';
import type { Route } from 'next';

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-1 text-xs text-neutral-500"
    >
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 ? <span aria-hidden>›</span> : null}
          {c.href ? (
            <Link href={c.href as Route} className="hover:text-brand-700 hover:underline">
              {c.name}
            </Link>
          ) : (
            <span className="text-neutral-700 dark:text-neutral-300">{c.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
