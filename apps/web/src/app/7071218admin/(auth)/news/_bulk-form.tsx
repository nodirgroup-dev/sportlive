'use client';

import type { ReactNode } from 'react';
import { useAdminLang, ADMIN_T } from '../../_lang';

/**
 * Wraps the news-list bulk-action toolbar so the dropdown labels and the
 * "Apply" / hint text can re-render when the editor changes language. The
 * <form>'s `action` is a server action; everything else is presentational.
 */
export function NewsBulkForm({
  action,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  return (
    <form action={action}>
      <div
        className="card"
        style={{
          padding: 10,
          display: 'flex',
          gap: 10,
          marginBottom: 14,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.bulk_action_label}</span>
        <select
          name="action"
          defaultValue=""
          className="select"
          style={{ height: 30, fontSize: 12.5 }}
        >
          <option value="">{t.bulk_action_choose}</option>
          <option value="publish">{t.bulk_publish}</option>
          <option value="unpublish">{t.bulk_unpublish}</option>
          <option value="archive">{t.bulk_archive}</option>
          <option value="delete">{t.delete}</option>
        </select>
        <button type="submit" className="btn" style={{ height: 30, fontSize: 12.5 }}>
          {t.bulk_apply_to_selected}
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
          {t.bulk_hint_checkboxes}
        </span>
      </div>
      {children}
    </form>
  );
}

/** Translated banner shown above the news list after a bulk action runs. */
export function BulkDoneBanner({
  kind,
  count,
}: {
  kind: 'publish' | 'unpublish' | 'archive' | 'delete';
  count: string;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  const label =
    kind === 'publish'
      ? t.bulk_done_publish
      : kind === 'unpublish'
        ? t.bulk_done_unpublish
        : kind === 'archive'
          ? t.bulk_done_archive
          : t.bulk_done_delete;
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(34,197,94,0.1)',
        border: '1px solid rgba(34,197,94,0.3)',
        color: '#86efac',
        marginBottom: 14,
        fontSize: 12.5,
      }}
    >
      {label} <b>{count}</b> {t.news_count_articles}
    </div>
  );
}
