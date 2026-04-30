import Link from 'next/link';

const POSITIONS: Array<{ value: string; label: string }> = [
  { value: 'header', label: 'Шапка' },
  { value: 'sidebar', label: 'Сайдбар' },
  { value: 'in_article_top', label: 'В статье — сверху' },
  { value: 'in_article_bottom', label: 'В статье — снизу' },
  { value: 'footer', label: 'Подвал' },
];

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
  return (
    <form action={action}>
      <div className="page-h">
        <div>
          <h1>{banner.id ? 'Редактирование баннера' : 'Новый баннер'}</h1>
          <div className="sub">{banner.id ? `ID #${banner.id}` : 'Создание нового баннера'}</div>
        </div>
        <div className="actions">
          <Link href="/7071218admin/banners" className="btn">Отмена</Link>
          <button type="submit" className="btn primary">{banner.id ? 'Сохранить' : 'Создать'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap)' }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="field">
            <label>Название (внутреннее)</label>
            <input name="name" type="text" required defaultValue={banner.name} className="input" maxLength={200} />
          </div>
          <div className="field">
            <label>URL изображения</label>
            <input name="imageUrl" type="text" required defaultValue={banner.imageUrl} className="input" maxLength={500} placeholder="/uploads/banners/...png" />
          </div>
          <div className="field">
            <label>Ссылка при клике</label>
            <input name="linkUrl" type="text" defaultValue={banner.linkUrl ?? ''} className="input" maxLength={500} placeholder="https://example.com" />
          </div>
          <div className="field">
            <label>Alt-текст</label>
            <input name="altText" type="text" defaultValue={banner.altText ?? ''} className="input" maxLength={300} />
          </div>
          <div className="field">
            <label>HTML/JS-сниппет (опционально, например AdSense)</label>
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
              <label>Позиция</label>
              <select name="position" defaultValue={banner.position} className="select">
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Порядок</label>
              <input name="sortOrder" type="number" defaultValue={banner.sortOrder} className="input" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>
              <input type="checkbox" name="active" defaultChecked={banner.active} />
              Активен
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
