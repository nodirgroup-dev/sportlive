'use client';

import { useAdminLang, ADMIN_T } from '../../_lang';

const PILL_LABEL: Record<'published' | 'scheduled' | 'draft' | 'archived', keyof typeof ADMIN_T['ru']> = {
  published: 'status_published',
  scheduled: 'status_scheduled',
  draft: 'status_draft',
  archived: 'status_archived',
};

export function NewsFilters({
  defaultQ,
  defaultLocale,
  defaultStatus,
}: {
  defaultQ: string;
  defaultLocale: string;
  defaultStatus: string;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  return (
    <form className="card" style={{ padding: 12, display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
      <input
        name="q"
        defaultValue={defaultQ}
        placeholder={t.news_search_placeholder}
        className="input"
        style={{ flex: 1, height: 32 }}
      />
      <select name="locale" defaultValue={defaultLocale} className="select" style={{ height: 32, width: 120 }}>
        <option value="">{t.all_locales}</option>
        <option value="uz">UZ</option>
        <option value="ru">RU</option>
        <option value="en">EN</option>
      </select>
      <select name="status" defaultValue={defaultStatus} className="select" style={{ height: 32, width: 150 }}>
        <option value="">{t.all_statuses}</option>
        <option value="published">{t.status_published}</option>
        <option value="scheduled">{t.status_scheduled}</option>
        <option value="draft">{t.status_draft}</option>
        <option value="archived">{t.status_archived}</option>
      </select>
      <button type="submit" className="btn">
        {t.apply}
      </button>
    </form>
  );
}

export function StatusPill({ status }: { status: 'published' | 'scheduled' | 'draft' | 'archived' }) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];
  const cls =
    status === 'published'
      ? 'green'
      : status === 'scheduled'
        ? 'yellow'
        : status === 'draft'
          ? 'gray'
          : 'yellow';
  return <span className={`pill ${cls}`}>{t[PILL_LABEL[status]]}</span>;
}
