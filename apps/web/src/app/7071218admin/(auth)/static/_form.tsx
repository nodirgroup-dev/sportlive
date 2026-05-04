'use client';

import Link from 'next/link';
import { useAdminLang, ADMIN_T } from '../../_lang';

type FormPage = {
  id: number | null;
  locale: 'uz' | 'ru' | 'en';
  slug: string;
  title: string;
  description: string | null;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  showInFooter: number;
};

export function StaticPageForm({
  page,
  action,
}: {
  page: FormPage;
  action: (formData: FormData) => Promise<void>;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];

  return (
    <form action={action}>
      <div className="page-h">
        <div>
          <h1>{page.id ? t.crumb_static_edit : t.crumb_static_new}</h1>
          <div className="sub">
            {page.id ? `ID #${page.id}` : t.static_new_sub} · /{page.slug || 'slug'}
          </div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/static" className="btn">
            {t.cancel}
          </Link>
          <button type="submit" className="btn primary">
            {page.id ? t.save : t.create}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap)' }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="field">
            <label>{t.title}</label>
            <input
              name="title"
              type="text"
              required
              defaultValue={page.title}
              className="input"
              maxLength={300}
            />
          </div>
          <div className="field">
            <label>{t.form_url_slug}</label>
            <input
              name="slug"
              type="text"
              defaultValue={page.slug}
              className="input"
              maxLength={200}
              placeholder="maxfiylik-siyosati"
            />
          </div>
          <div className="field">
            <label>{t.form_short_description}</label>
            <input
              name="description"
              type="text"
              defaultValue={page.description ?? ''}
              className="input"
              maxLength={500}
            />
          </div>
          <div className="field">
            <label>{t.form_body_html}</label>
            <textarea
              name="body"
              required
              defaultValue={page.body}
              className="textarea"
              style={{ minHeight: 400 }}
            />
          </div>

          <h3
            style={{
              marginTop: 14,
              marginBottom: 10,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-2)',
            }}
          >
            SEO
          </h3>
          <div className="field">
            <label>{t.form_meta_title}</label>
            <input
              name="metaTitle"
              type="text"
              defaultValue={page.metaTitle ?? ''}
              className="input"
              maxLength={300}
            />
          </div>
          <div className="field">
            <label>{t.form_meta_description}</label>
            <textarea
              name="metaDescription"
              defaultValue={page.metaDescription ?? ''}
              className="textarea"
              style={{ minHeight: 60 }}
              maxLength={500}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="field">
              <label>{t.language}</label>
              <select
                name="locale"
                defaultValue={page.locale}
                className="select"
                disabled={page.id != null}
              >
                <option value="uz">{t.form_uzbek}</option>
                <option value="ru">{t.form_russian}</option>
                <option value="en">{t.form_english}</option>
              </select>
            </div>
            <div className="field">
              <label>{t.form_footer_sort_order}</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={page.sortOrder}
                className="input"
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'var(--text-2)',
                marginTop: 8,
              }}
            >
              <input type="checkbox" name="showInFooter" defaultChecked={page.showInFooter === 1} />
              {t.form_show_in_footer}
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
