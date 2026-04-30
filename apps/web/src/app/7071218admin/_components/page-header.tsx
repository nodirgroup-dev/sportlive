'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { PAGE_INFO, type PageId, useAdminLang } from '../_lang';

const STORAGE_KEY = 'sl_admin_dismissed_info';

/**
 * Admin page header with translated H1, subtitle, and a collapsible info
 * banner explaining what the page does. The info banner is dismissible per
 * page (state stored in localStorage as a comma-separated set of pageIds),
 * so power-users see it once and never again.
 *
 * Usage:
 *   <AdminPageHeader pageId="news" actions={<Link.../>}>
 *     <span>{list.length} articles</span>
 *   </AdminPageHeader>
 */
export function AdminPageHeader({
  pageId,
  actions,
  children,
}: {
  pageId: PageId;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const lang = useAdminLang();
  const entry = PAGE_INFO[lang][pageId];
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDismissed(new Set(raw.split(',').filter(Boolean)));
    } catch {
      // ignore
    }
  }, []);

  const isHidden = dismissed.has(pageId);

  const dismiss = () => {
    const next = new Set(dismissed);
    next.add(pageId);
    setDismissed(next);
    try {
      localStorage.setItem(STORAGE_KEY, [...next].join(','));
    } catch {
      // ignore
    }
  };

  const restore = () => {
    const next = new Set(dismissed);
    next.delete(pageId);
    setDismissed(next);
    try {
      localStorage.setItem(STORAGE_KEY, [...next].join(','));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div className="page-h">
        <div>
          <h1>{entry.title}</h1>
          {children !== undefined ? (
            <div className="sub">{children}</div>
          ) : entry.sub ? (
            <div className="sub">{entry.sub}</div>
          ) : null}
        </div>
        {actions ? <div className="actions">{actions}</div> : null}
      </div>

      {!isHidden ? (
        <div
          role="note"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 12px',
            marginBottom: 14,
            borderRadius: 8,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: 'var(--text-2)',
            fontSize: 12.5,
            lineHeight: 1.5,
          }}
        >
          <Info size={14} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2, color: '#a5b4fc' }} />
          <div style={{ flex: 1 }}>{entry.info}</div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss info"
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 0,
              color: 'var(--text-3)',
              cursor: 'pointer',
              padding: 2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={restore}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--text-3)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '0 0 8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            opacity: 0.6,
          }}
        >
          <Info size={11} strokeWidth={1.8} />
          {lang === 'uz' ? 'Yordam' : lang === 'en' ? 'Help' : 'Подсказка'}
        </button>
      )}
    </>
  );
}
