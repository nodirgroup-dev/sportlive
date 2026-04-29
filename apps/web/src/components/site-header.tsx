import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';

export function SiteHeader() {
  const t = useTranslations('nav');
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Sportlive
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/football" className="hover:text-brand-700">
            {t('football')}
          </Link>
          <Link href="/schedule" className="hover:text-brand-700">
            {t('schedule')}
          </Link>
          <Link href="/results" className="hover:text-brand-700">
            {t('results')}
          </Link>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
