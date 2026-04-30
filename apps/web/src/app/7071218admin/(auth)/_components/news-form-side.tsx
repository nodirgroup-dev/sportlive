'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  postId: number | null;
  locale: 'uz' | 'ru' | 'en';
};

export function NewsAiPanel({ postId, locale }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function call(action: string, target?: string) {
    if (!postId) {
      setMsg({ kind: 'err', text: 'Сначала сохраните черновик' });
      return;
    }
    setBusy(action + (target ? `:${target}` : ''));
    setMsg(null);
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, postId, target }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setMsg({ kind: 'ok', text: j.message || 'Готово' });
      if (j.editUrl) {
        router.push(j.editUrl);
      } else {
        router.refresh();
      }
    } catch (e) {
      setMsg({
        kind: 'err',
        text: e instanceof Error ? e.message : 'Ошибка',
      });
    } finally {
      setBusy(null);
    }
  }

  if (!postId) {
    return (
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
        AI-помощник доступен после первого сохранения статьи.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {locale === 'uz' ? (
        <>
          <button
            type="button"
            className="btn"
            disabled={!!busy}
            onClick={() => call('translate', 'ru')}
          >
            {busy === 'translate:ru' ? '…' : '🤖 Перевести → RU'}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!!busy}
            onClick={() => call('translate', 'en')}
          >
            {busy === 'translate:en' ? '…' : '🤖 Перевести → EN'}
          </button>
        </>
      ) : null}
      <button
        type="button"
        className="btn"
        disabled={!!busy}
        onClick={() => call('headline')}
      >
        {busy === 'headline' ? '…' : '🤖 Сильный заголовок'}
      </button>
      <button
        type="button"
        className="btn"
        disabled={!!busy}
        onClick={() => call('summary')}
      >
        {busy === 'summary' ? '…' : '🤖 Краткий лид (160 симв.)'}
      </button>
      {msg ? (
        <div
          style={{
            fontSize: 11.5,
            padding: '8px 10px',
            borderRadius: 6,
            background: msg.kind === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${msg.kind === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: msg.kind === 'ok' ? '#86efac' : '#fca5a5',
          }}
        >
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}

export function NewsBodyTabs({ children }: { children: { editor: React.ReactNode; preview: React.ReactNode } }) {
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setTab('editor')}
          style={{
            border: 0,
            background: 'transparent',
            padding: '8px 14px',
            fontSize: 12.5,
            color: tab === 'editor' ? 'var(--text)' : 'var(--text-3)',
            borderBottom: `2px solid ${tab === 'editor' ? 'var(--accent)' : 'transparent'}`,
            marginBottom: -1,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Редактор
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          style={{
            border: 0,
            background: 'transparent',
            padding: '8px 14px',
            fontSize: 12.5,
            color: tab === 'preview' ? 'var(--text)' : 'var(--text-3)',
            borderBottom: `2px solid ${tab === 'preview' ? 'var(--accent)' : 'transparent'}`,
            marginBottom: -1,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Предпросмотр
        </button>
      </div>
      <div style={{ display: tab === 'editor' ? 'block' : 'none' }}>{children.editor}</div>
      <div style={{ display: tab === 'preview' ? 'block' : 'none' }}>{children.preview}</div>
    </div>
  );
}
