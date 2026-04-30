'use client';

import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/routing';

const ITEMS: Record<Locale, Array<{ href: string; label: string; icon: string }>> = {
  uz: [
    { href: '/', label: 'Bosh', icon: 'M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2v-9z' },
    { href: '/live', label: 'Jonli', icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
    { href: '/schedule', label: 'Jadval', icon: 'M3 4h18v18H3V4zM3 10h18M8 2v4M16 2v4' },
    { href: '/standings', label: 'Jadvallar', icon: 'M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z' },
    { href: '/search', label: 'Qidir', icon: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4-4' },
  ],
  ru: [
    { href: '/', label: 'Главная', icon: 'M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2v-9z' },
    { href: '/live', label: 'Live', icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
    { href: '/schedule', label: 'Расписание', icon: 'M3 4h18v18H3V4zM3 10h18M8 2v4M16 2v4' },
    { href: '/standings', label: 'Таблицы', icon: 'M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z' },
    { href: '/search', label: 'Поиск', icon: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4-4' },
  ],
  en: [
    { href: '/', label: 'Home', icon: 'M3 12l9-9 9 9v9a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2v-9z' },
    { href: '/live', label: 'Live', icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
    { href: '/schedule', label: 'Fixtures', icon: 'M3 4h18v18H3V4zM3 10h18M8 2v4M16 2v4' },
    { href: '/standings', label: 'Tables', icon: 'M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z' },
    { href: '/search', label: 'Search', icon: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4-4' },
  ],
};

export function MobileNav({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? '/';
  // Strip locale prefix for active matching.
  const cleaned =
    locale === 'uz'
      ? pathname
      : pathname.startsWith(`/${locale}`)
        ? pathname.slice(locale.length + 1) || '/'
        : pathname;
  const items = ITEMS[locale];

  return (
    <nav
      aria-label="Mobile"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-neutral-800 dark:bg-neutral-950 sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = cleaned === it.href || (it.href !== '/' && cleaned.startsWith(it.href));
          return (
            <li key={it.href}>
              <Link
                href={it.href as Route}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${active ? 'text-brand-700 dark:text-brand-400' : 'text-neutral-600 dark:text-neutral-400'}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d={it.icon} />
                </svg>
                <span className="font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
