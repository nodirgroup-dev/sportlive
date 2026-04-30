'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/routing';

const LABELS: Record<Locale, { idle: string; granting: string; subscribed: string; denied: string; unsupported: string }> = {
  uz: {
    idle: '🔔 Push bildirishnomalari',
    granting: 'Ulanmoqda…',
    subscribed: '✓ Push yoqilgan',
    denied: 'Bildirishnomalar bloklangan',
    unsupported: 'Bu brauzerda push qo‘llab-quvvatlanmaydi',
  },
  ru: {
    idle: '🔔 Push-уведомления',
    granting: 'Подписка…',
    subscribed: '✓ Push подключён',
    denied: 'Уведомления заблокированы',
    unsupported: 'Браузер не поддерживает push',
  },
  en: {
    idle: '🔔 Enable push notifications',
    granting: 'Subscribing…',
    subscribed: '✓ Push enabled',
    denied: 'Notifications blocked',
    unsupported: 'Push is not supported here',
  },
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushButton({ locale, vapidPublicKey }: { locale: Locale; vapidPublicKey: string }) {
  const tx = LABELS[locale];
  const [state, setState] = useState<'idle' | 'granting' | 'subscribed' | 'denied' | 'unsupported'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker
      .getRegistration('/sw.js')
      .then(async (reg) => {
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        if (sub) setState('subscribed');
      })
      .catch(() => {});
  }, []);

  async function subscribe() {
    if (!vapidPublicKey) return;
    setState('granting');
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration('/sw.js')) ||
        (await navigator.serviceWorker.register('/sw.js'));
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState(perm === 'denied' ? 'denied' : 'idle');
        return;
      }
      const key = urlBase64ToUint8Array(vapidPublicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast: lib.dom.d.ts wants BufferSource with strict ArrayBuffer; our Uint8Array is fine at runtime.
        applicationServerKey: key as unknown as BufferSource,
      });
      const json = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...json, locale }),
      });
      setState('subscribed');
    } catch (e) {
      console.error('push subscribe failed', e);
      setState('idle');
    }
  }

  if (state === 'unsupported' || state === 'denied') {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-neutral-500">
        {tx[state]}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={state === 'subscribed' ? undefined : subscribe}
      disabled={state === 'granting' || state === 'subscribed'}
      className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-brand-500 hover:text-brand-700 disabled:opacity-70 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
    >
      {state === 'granting' ? tx.granting : state === 'subscribed' ? tx.subscribed : tx.idle}
    </button>
  );
}
