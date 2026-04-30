'use client';

import { useState } from 'react';

const TARGETS = [
  {
    name: 'Telegram',
    color: '#229ED9',
    href: (u: string, t: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M9.04 15.34l-.4 5.62c.57 0 .82-.25 1.12-.55l2.69-2.57 5.57 4.07c1.02.56 1.74.27 2.02-.94L23.59 4.5c.32-1.43-.52-1.99-1.51-1.62L1.42 10.86c-1.4.55-1.38 1.34-.24 1.7l5.13 1.6 11.91-7.5c.56-.36 1.07-.16.65.2L9.04 15.34z" />
      </svg>
    ),
  },
  {
    name: 'X',
    color: '#000',
    href: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.789l-5.32-6.96L4.8 22H1.54l8.04-9.18L1 2h6.91l4.81 6.36L18.244 2zm-1.19 18.07h1.81L7.05 3.83H5.13l11.924 16.24z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    color: '#1877F2',
    href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    color: '#25D366',
    href: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.172-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004A9.87 9.87 0 0 1 7 20.385l-.36-.214-3.741.982.998-3.648-.235-.374A9.87 9.87 0 0 1 2.13 12.05c0-5.46 4.453-9.91 9.92-9.91 2.65 0 5.144 1.033 7.02 2.91A9.87 9.87 0 0 1 22 12.054c0 5.46-4.453 9.91-9.95 9.91zM20.52 3.449C18.24 1.245 15.24 0 12.05 0 5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.86 11.86 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.81 11.81 0 0 0 20.52 3.449z" />
      </svg>
    ),
  },
];

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="my-6 flex flex-wrap items-center gap-2 border-y border-neutral-200 py-4 dark:border-neutral-800">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">Share</span>
      {TARGETS.map((t) => (
        <a
          key={t.name}
          href={t.href(url, title)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Share on ${t.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
          style={{ background: t.color }}
        >
          {t.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link"
        className="flex h-9 items-center gap-1.5 rounded-full bg-neutral-200 px-3 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        {copied ? '✓ Copied' : '🔗 Link'}
      </button>
    </div>
  );
}
