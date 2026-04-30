import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import { LanguageSwitcher } from './language-switcher';
import { MobileMenu } from './mobile-menu';

const NAV = [
  { href: '/football', tk: 'football' },
  { href: '/schedule', tk: 'schedule' },
  { href: '/results', tk: 'results' },
  { href: '/standings', tk: 'standings' },
  { href: '/live', tk: 'live' },
] as const;

export function SiteHeader() {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/95 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-950/90">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-700 text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 2 L14 7 L19 7 L15.5 11 L17 16 L12 13 L7 16 L8.5 11 L5 7 L10 7 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            Sport<span className="text-brand-700">live</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-neutral-700 transition-colors hover:text-brand-700 dark:text-neutral-300"
            >
              {t(n.tk)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={'/search' as Route}
            aria-label={t('search')}
            className="hidden h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-brand-700 dark:text-neutral-400 dark:hover:bg-neutral-800 md:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </Link>
          <LanguageSwitcher />
          <MobileMenu items={[...NAV.map((n) => ({ href: n.href, label: t(n.tk) })), { href: '/search', label: t('search') }]} />
        </div>
      </div>
    </header>
  );
}
