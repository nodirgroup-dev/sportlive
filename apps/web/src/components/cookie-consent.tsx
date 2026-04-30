'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/routing';

const STORAGE_KEY = 'sl-consent-v1';

const COPY: Record<Locale, { body: string; accept: string; decline: string; privacy: string }> = {
  uz: {
    body:
      "Saytdan eng yaxshi tajriba uchun cookie ishlatamiz: tahlil va sayt ish faoliyatini yaxshilash uchun.",
    accept: 'Roziman',
    decline: 'Faqat zarurlari',
    privacy: 'Maxfiylik siyosati',
  },
  ru: {
    body:
      'Мы используем cookie для аналитики и улучшения работы сайта. Соглашаясь, вы помогаете нам делать его лучше.',
    accept: 'Согласен',
    decline: 'Только необходимые',
    privacy: 'Политика конфиденциальности',
  },
  en: {
    body:
      'We use cookies for analytics and to improve the site. By accepting you help us make it better.',
    accept: 'Accept',
    decline: 'Essential only',
    privacy: 'Privacy policy',
  },
};

export function CookieConsent({ locale }: { locale: Locale }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      // private mode etc — assume not consented, but don't break.
    }
  }, []);

  const set = (value: 'accept' | 'decline') => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setShow(false);
    if (value === 'accept') {
      // Hint to consumers (analytics scripts) to start. They listen for this event.
      window.dispatchEvent(new CustomEvent('sl:consent', { detail: { value: 'accept' } }));
    }
  };

  if (!show) return null;
  const t = COPY[locale];

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-lg border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
    >
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        🍪 {t.body}{' '}
        <a
          href={locale === 'uz' ? '/maxfiylik-siyosati' : `/${locale}/maxfiylik-siyosati`}
          className="text-brand-700 hover:underline"
        >
          {t.privacy}
        </a>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => set('accept')}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          {t.accept}
        </button>
        <button
          type="button"
          onClick={() => set('decline')}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
        >
          {t.decline}
        </button>
      </div>
    </div>
  );
}
