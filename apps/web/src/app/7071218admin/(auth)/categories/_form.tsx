'use client';

import Link from 'next/link';
import { useAdminLang, ADMIN_T } from '../../_lang';

type FormCat = {
  id: number | null;
  locale: 'uz' | 'ru' | 'en';
  slug: string;
  name: string;
  description: string | null;
  parentId: number | null;
  sortOrder: number;
};

type ParentOption = { id: number; name: string };

export function CategoryForm({
  cat,
  parents,
  action,
}: {
  cat: FormCat;
  parents: ParentOption[];
  action: (formData: FormData) => Promise<void>;
}) {
  const lang = useAdminLang();
  const t = ADMIN_T[lang];

  return (
    <form action={action}>
      <div className="page-h">
        <div>
          <h1>{cat.id ? t.crumb_categories_edit : t.crumb_categories_new}</h1>
          <div className="sub">{cat.id ? `ID #${cat.id}` : t.cat_new_sub}</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/categories" className="btn">
            {t.cancel}
          </Link>
          <button type="submit" className="btn primary">
            {cat.id ? t.save : t.create}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 720 }}>
        <div className="field">
          <label>{t.th_name}</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={cat.name}
            className="input"
            maxLength={200}
          />
        </div>
        <div className="field">
          <label>{t.form_slug_from_name}</label>
          <input
            name="slug"
            type="text"
            defaultValue={cat.slug}
            className="input"
            maxLength={200}
            placeholder="football, italiya"
          />
        </div>
        <div className="field">
          <label>{t.form_description_seo}</label>
          <textarea
            name="description"
            defaultValue={cat.description ?? ''}
            className="textarea"
            style={{ minHeight: 80 }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap)' }}>
          <div className="field">
            <label>{t.language}</label>
            <select
              name="locale"
              defaultValue={cat.locale}
              className="select"
              disabled={cat.id != null}
            >
              <option value="uz">{t.form_uzbek}</option>
              <option value="ru">{t.form_russian}</option>
              <option value="en">{t.form_english}</option>
            </select>
          </div>
          <div className="field">
            <label>{t.form_parent_category}</label>
            <select name="parentId" defaultValue={cat.parentId ?? ''} className="select">
              <option value="">{t.form_no_parent}</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t.form_sort_order_long}</label>
            <input name="sortOrder" type="number" defaultValue={cat.sortOrder} className="input" />
          </div>
        </div>
      </div>
    </form>
  );
}
