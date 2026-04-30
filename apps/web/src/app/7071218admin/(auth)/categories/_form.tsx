import Link from 'next/link';
import { db, categories } from '@sportlive/db';
import { eq, asc, ne, and } from 'drizzle-orm';

type FormCat = {
  id: number | null;
  locale: 'uz' | 'ru' | 'en';
  slug: string;
  name: string;
  description: string | null;
  parentId: number | null;
  sortOrder: number;
};

export async function CategoryForm({
  cat,
  action,
}: {
  cat: FormCat;
  action: (formData: FormData) => Promise<void>;
}) {
  const candidatesQuery = db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(cat.id ? and(eq(categories.locale, cat.locale), ne(categories.id, cat.id)) : eq(categories.locale, cat.locale))
    .orderBy(asc(categories.sortOrder));
  const parents = await candidatesQuery;

  return (
    <form action={action}>
      <div className="page-h">
        <div>
          <h1>{cat.id ? 'Редактирование категории' : 'Новая категория'}</h1>
          <div className="sub">{cat.id ? `ID #${cat.id}` : 'Создание новой рубрики'}</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/categories" className="btn">Отмена</Link>
          <button type="submit" className="btn primary">{cat.id ? 'Сохранить' : 'Создать'}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 720 }}>
        <div className="field">
          <label>Название</label>
          <input name="name" type="text" required defaultValue={cat.name} className="input" maxLength={200} />
        </div>
        <div className="field">
          <label>URL-slug (опционально, генерируется из названия)</label>
          <input name="slug" type="text" defaultValue={cat.slug} className="input" maxLength={200} placeholder="football, italiya" />
        </div>
        <div className="field">
          <label>Описание (для SEO и страницы рубрики)</label>
          <textarea name="description" defaultValue={cat.description ?? ''} className="textarea" style={{ minHeight: 80 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap)' }}>
          <div className="field">
            <label>Язык</label>
            <select name="locale" defaultValue={cat.locale} className="select" disabled={cat.id != null}>
              <option value="uz">Узбекский</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="field">
            <label>Родительская категория</label>
            <select name="parentId" defaultValue={cat.parentId ?? ''} className="select">
              <option value="">— нет —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Порядок сортировки</label>
            <input name="sortOrder" type="number" defaultValue={cat.sortOrder} className="input" />
          </div>
        </div>
      </div>
    </form>
  );
}
