'use client';

import { useState } from 'react';
import type { Locale } from '@/i18n/routing';

const T: Record<
  Locale,
  { heading: string; sub: string; placeholder: string; cta: string; sending: string; success: string; error: string; invalid: string }
> = {
  uz: {
    heading: 'Yangiliklarni elektron pochtangizga oling',
    sub: 'Haftalik dayjest, hech qanday spam yo‘q',
    placeholder: 'email@example.com',
    cta: 'Obuna bo‘lish',
    sending: 'Yuborilmoqda…',
    success: 'Rahmat! Tasdiqlash uchun pochtani tekshiring',
    error: 'Yuborishda xatolik',
    invalid: 'Noto‘g‘ri email manzili',
  },
  ru: {
    heading: 'Подпишитесь на дайджест',
    sub: 'Еженедельная подборка лучших материалов',
    placeholder: 'email@example.com',
    cta: 'Подписаться',
    sending: 'Отправка…',
    success: 'Готово! Проверьте почту',
    error: 'Ошибка отправки',
    invalid: 'Некорректный email',
  },
  en: {
    heading: 'Subscribe to our newsletter',
    sub: 'Weekly digest, no spam',
    placeholder: 'email@example.com',
    cta: 'Subscribe',
    sending: 'Sending…',
    success: 'Thanks! Check your inbox',
    error: 'Failed to subscribe',
    invalid: 'Invalid email',
  },
};

const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm({ locale }: { locale: Locale }) {
  const tx = T[locale];
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!RE.test(email)) {
      setErr(tx.invalid);
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setState('sent');
      setEmail('');
    } catch (e) {
      setState('error');
      setErr(e instanceof Error ? e.message : tx.error);
    }
  }

  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">{tx.heading}</h3>
      <p className="mb-3 text-xs text-neutral-500">{tx.sub}</p>
      {state === 'sent' ? (
        <div className="rounded-md border border-brand-500/40 bg-brand-50/40 p-3 text-xs text-brand-700 dark:bg-neutral-900/40">
          ✓ {tx.success}
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tx.placeholder}
            maxLength={320}
            className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {state === 'sending' ? tx.sending : tx.cta}
          </button>
        </form>
      )}
      {err ? <div className="mt-2 text-xs text-red-600">{err}</div> : null}
    </div>
  );
}
