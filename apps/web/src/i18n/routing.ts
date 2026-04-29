import { defineRouting } from 'next-intl/routing';

export const locales = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'uz',
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      uz: '/',
      ru: '/ru',
      en: '/en',
    },
  },
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
  },
});

export const localeNames: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

export function hasLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
