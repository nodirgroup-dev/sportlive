import type { Locale } from '@/i18n/routing';

export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sportlive.uz',
  name: 'Sportlive',
  defaultLocale: 'uz' as Locale,
  publisher: {
    name: 'Sportlive',
    logo: '/static/publisher-logo.png',
    sameAs: [
      'https://t.me/sportliveuz',
    ],
  },
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}

export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'uz') return clean;
  return `/${locale}${clean === '/' ? '' : clean}`;
}
