import { useTranslations } from 'next-intl';

export function SiteFooter() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-200 mt-12 dark:border-neutral-800">
      <div className="container mx-auto max-w-5xl px-4 py-6 text-sm text-neutral-500">
        © {year} Sportlive. {t('rights')}.
      </div>
    </footer>
  );
}
