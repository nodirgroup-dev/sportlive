'use client';

import Link from 'next/link';
import { useAdminLang, ADMIN_T } from '../../_lang';

type FormBanner = {
  id: number | null;
  name: string;
  position: string;
  imageUrl: string;
  linkUrl: string | null;
  altText: string | null;
  htmlSnippet: string | null;
  sortOrder: number;
  active: boolean;
};

export function BannerForm({
  banner,
  action,
}: {
  banner: FormBanner;
  action: (formData: FormData) => Promise<void>;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];

  const positions: Array<{ value: string; label: string }> = [
    { value: 'header', label: t.pos_header },
    { value: 'sidebar', label: t.pos_sidebar },
    { value: 'in_article_top', label: t.pos_in_article_top },
    { value: 'in_article_bottom', label: t.pos_in_article_bottom },
    { value: 'footer', label: t.pos_footer },
  ];

  return (
    <form action={action}>
      <div className="page-h">
        <div>
          <h1>{banner.id ? t.crumb_banners_edit : t.crumb_banners_new}</h1>
          <div className="sub">{banner.id ? `ID #${banner.id}` : t.banner_new_sub}</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/banners" className="btn">
            {t.cancel}
          </Link>
          <button type="submit" className="btn primary">
            {banner.id ? t.save : t.create}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap)' }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="field">
            <label>{t.form_internal_name}</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={banner.name}
              className="input"
              maxLength={200}
            />
          </div>
          <div className="field">
            <label>{t.form_image_url}</label>
            <input
              name="imageUrl"
              type="text"
              required
              defaultValue={banner.imageUrl}
              className="input"
              maxLength={500}
              placeholder="/uploads/banners/...png"
            />
          </div>
          <div className="field">
            <label>{t.form_link_url}</label>
            <input
              name="linkUrl"
              type="text"
              defaultValue={banner.linkUrl ?? ''}
              className="input"
              maxLength={500}
              placeholder="https://example.com"
            />
          </div>
          <div className="field">
            <label>{t.form_alt_text}</label>
            <input
              name="altText"
              type="text"
              defaultValue={banner.altText ?? ''}
              className="input"
              maxLength={300}
            />
          </div>
          <div className="field">
            <label>{t.form_html_snippet}</label>
            <textarea
              name="htmlSnippet"
              defaultValue={banner.htmlSnippet ?? ''}
              className="textarea"
              style={{ minHeight: 100, fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="field">
              <label>{t.form_position}</label>
              <select name="position" defaultValue={banner.position} className="select">
                {positions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.form_sort_order}</label>
              <input name="sortOrder" type="number" defaultValue={banner.sortOrder} className="input" />
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
              <input type="checkbox" name="active" defaultChecked={banner.active} />
              {t.form_active}
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
