'use client';

import { useState } from 'react';
import type { Locale } from '@/i18n/routing';

type Tx = { name: string; email: string; body: string; submit: string; sending: string; success: string; error: string; short: string };
const T: Record<Locale, Tx> = {
  uz: {
    name: 'Ismingiz',
    email: 'Email (ixtiyoriy)',
    body: "O'z fikringizni yozing…",
    submit: 'Izoh qoldirish',
    sending: 'Yuborilmoqda…',
    success: 'Izohingiz tahririyatga yuborildi va tasdiqdan keyin paydo bo‘ladi',
    error: 'Yuborishda xatolik',
    short: 'Iltimos, kamida 5 ta belgi yozing',
  },
  ru: {
    name: 'Ваше имя',
    email: 'Email (необязательно)',
    body: 'Напишите своё мнение…',
    submit: 'Оставить комментарий',
    sending: 'Отправка…',
    success: 'Комментарий отправлен на модерацию',
    error: 'Ошибка отправки',
    short: 'Пожалуйста, напишите хотя бы 5 символов',
  },
  en: {
    name: 'Your name',
    email: 'Email (optional)',
    body: 'Share your thoughts…',
    submit: 'Post comment',
    sending: 'Sending…',
    success: 'Submitted for moderation',
    error: 'Failed to submit',
    short: 'Please write at least 5 characters',
  },
};

export function CommentForm({ postId, locale }: { postId: number; locale: Locale }) {
  const tx = T[locale]!;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (body.trim().length < 5) {
      setErr(tx.short);
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId, name: name.trim() || null, email: email.trim() || null, body: body.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setState('sent');
      setName('');
      setEmail('');
      setBody('');
    } catch (e) {
      setState('error');
      setErr(e instanceof Error ? e.message : tx.error);
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-lg border border-brand-500/40 bg-brand-50/40 p-4 text-sm text-brand-700 dark:bg-neutral-900/40">
        ✓ {tx.success}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tx.name}
          maxLength={100}
          className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={tx.email}
          maxLength={255}
          className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
        />
      </div>
      <textarea
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={tx.body}
        rows={4}
        minLength={5}
        maxLength={4000}
        className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900"
      />
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="rounded-md bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
      >
        {state === 'sending' ? tx.sending : tx.submit}
      </button>
    </form>
  );
}
