'use client';

import Link from 'next/link';
import { useAdminLang, ADMIN_T } from '../../_lang';
import { RichEditor } from '../_components/rich-editor';

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

/**
 * Sibling rows that share this page's slug. Lets editors hop straight to
 * an existing translation, or click "Create translation" to start a new
 * row with the slug + locale prefilled.
 */
type Translation = {
  locale: 'uz' | 'ru' | 'en';
  id: number | null;
  title: string | null;
};

const LOCALES: ReadonlyArray<'uz' | 'ru' | 'en'> = ['uz', 'ru', 'en'];

export function StaticPageForm({
  page,
  translations = [],
  action,
}: {
  page: FormPage;
  translations?: Translation[];
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

      <TranslationsBar
        currentLocale={page.locale}
        slug={page.slug}
        pageId={page.id}
        translations={translations}
        labelText={t.translations_label}
        currentText={t.translation_current}
        createText={t.translation_create}
        missingHint={t.translation_missing_hint}
      />

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
            <RichEditor name="body" defaultValue={page.body} />
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

const LOCALE_LABEL: Record<'uz' | 'ru' | 'en', string> = {
  uz: 'UZ',
  ru: 'RU',
  en: 'EN',
};

/**
 * Renders one chip per locale: current language is highlighted, existing
 * sibling translations are clickable links to their edit pages, and missing
 * locales become "+ create translation" buttons that prefill slug + locale
 * on the new-page form.
 */
function TranslationsBar({
  currentLocale,
  slug,
  pageId,
  translations,
  labelText,
  currentText,
  createText,
  missingHint,
}: {
  currentLocale: 'uz' | 'ru' | 'en';
  slug: string;
  pageId: number | null;
  translations: Translation[];
  labelText: string;
  currentText: string;
  createText: string;
  missingHint: string;
}) {
  // For brand-new pages with no slug we have nothing to group by yet — show
  // a hint instead. New pages with a seeded slug (from "Create translation")
  // still render the bar so editors see the sibling that links here.
  if (!pageId && !slug) {
    return (
      <div
        style={{
          padding: '8px 12px',
          marginBottom: 14,
          background: 'var(--surface)',
          border: '1px dashed var(--line)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--text-3)',
        }}
      >
        {missingHint}
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        padding: '8px 12px',
        marginBottom: 14,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 8,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          marginRight: 4,
        }}
      >
        {labelText}:
      </span>
      {LOCALES.map((loc) => {
        const isCurrent = loc === currentLocale;
        const tr = translations.find((x) => x.locale === loc);
        const exists = Boolean(tr?.id);

        if (isCurrent) {
          return (
            <span
              key={loc}
              className={`pill ${loc === 'uz' ? 'green' : loc === 'ru' ? 'red' : 'yellow'}`}
              title={currentText}
              style={{ fontWeight: 700 }}
            >
              {LOCALE_LABEL[loc]} ✓
            </span>
          );
        }
        if (exists && tr?.id) {
          return (
            <Link
              key={loc}
              href={`/7071218admin/static/${tr.id}/edit`}
              className="pill gray"
              title={tr.title ?? ''}
              style={{ textDecoration: 'none' }}
            >
              {LOCALE_LABEL[loc]} →
            </Link>
          );
        }
        return (
          <Link
            key={loc}
            href={`/7071218admin/static/new?slug=${encodeURIComponent(slug)}&locale=${loc}`}
            className="pill"
            style={{
              textDecoration: 'none',
              border: '1px dashed var(--line)',
              color: 'var(--text-3)',
              opacity: 0.85,
            }}
            title={createText}
          >
            + {LOCALE_LABEL[loc]}
          </Link>
        );
      })}
    </div>
  );
}
