import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Route } from 'next';
import { hasLocale } from '@/i18n/routing';
import { getFooterPages } from '@/lib/db';
import { NewsletterForm } from './newsletter-form';
import { PushButton } from './push-button';

const FOOTER_HEADINGS = {
  uz: { sections: 'Bo\'limlar', info: "Ma'lumot", lang: 'Til' },
  ru: { sections: 'Разделы', info: 'Информация', lang: 'Язык' },
  en: { sections: 'Sections', info: 'Info', lang: 'Language' },
} as const;

const SECTIONS = [
  { href: '/football', tk: 'football' },
  { href: '/football/angliya', tk: null, label: { uz: 'Angliya', ru: 'Англия', en: 'England' } },
  { href: '/football/ispaniya', tk: null, label: { uz: 'Ispaniya', ru: 'Испания', en: 'Spain' } },
  { href: '/football/italiya', tk: null, label: { uz: 'Italiya', ru: 'Италия', en: 'Italy' } },
  { href: '/schedule', tk: 'schedule' },
  { href: '/results', tk: 'results' },
] as const;

export async function SiteFooter() {
  const localeRaw = await getLocale();
  const locale = hasLocale(localeRaw) ? localeRaw : 'uz';
  const t = await getTranslations('nav');
  const tFooter = await getTranslations('footer');
  const pages = await getFooterPages(locale).catch(() => []);
  const year = new Date().getFullYear();
  const headings = FOOTER_HEADINGS[locale];

  return (
    <footer className="mt-12 border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-700 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
              Sport<span className="text-brand-700">live</span>
            </Link>
            <p className="mt-3 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
              {locale === 'uz'
                ? "Sport va futbol yangiliklari, jonli natijalar, o'yin jadvallari."
                : locale === 'ru'
                  ? 'Спорт и футбольные новости, онлайн-результаты, расписание матчей.'
                  : 'Sports and football news, live scores, match schedules.'}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://t.me/sportliveuz"
                aria-label="Telegram"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:border-brand-500 hover:text-brand-700 dark:border-neutral-800 dark:text-neutral-400"
                rel="noreferrer"
                target="_blank"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 8l-1.8 8.5c-.1.6-.5.7-1 .4l-2.8-2-1.4 1.3c-.2.2-.3.3-.6.3l.2-2.7 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.7-.8c-.6-.2-.6-.6.1-.9l10.5-4c.5-.2.9.1.7.6z" />
                </svg>
              </a>
            </div>
            <div className="mt-6 max-w-md">
              <NewsletterForm locale={locale} />
            </div>
            {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? (
              <div className="mt-4">
                <PushButton locale={locale} vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {headings.sections}
            </h3>
            <ul className="space-y-2 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href as Route}
                    className="text-neutral-700 hover:text-brand-700 dark:text-neutral-300"
                  >
                    {s.tk ? t(s.tk) : s.label![locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {headings.info}
            </h3>
            <ul className="space-y-2 text-sm">
              {pages.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}` as Route}
                    className="text-neutral-700 hover:text-brand-700 dark:text-neutral-300"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-neutral-800">
          © {year} Sportlive. {tFooter('rights')}.
        </div>
      </div>
    </footer>
  );
}
