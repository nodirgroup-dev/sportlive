import Link from 'next/link';
import { db, categories } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { RichEditor } from '../_components/rich-editor';
import { CoverUpload } from '../_components/cover-upload';
import { NewsAiPanel } from '../_components/news-form-side';

type FormPost = {
  id: number | null;
  locale: 'uz' | 'ru' | 'en';
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  categoryId: number | null;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  coverImage: string | null;
  featured: boolean;
  tags: string;
  /** Names already in tags table for this locale; used as autocomplete datalist. */
  allTagNames: string[];
  /** ISO datetime-local string for status=scheduled. */
  publishedAt: string | null;
};

export async function NewsForm({
  post,
  action,
}: {
  post: FormPost;
  action: (formData: FormData) => Promise<void>;
}) {
  const cats = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.locale, post.locale));

  return (
    <form action={action}>
      <div className="page-h">
        <div>
          <h1>{post.id ? 'Редактирование статьи' : 'Новая статья'}</h1>
          <div className="sub">
            {post.id ? `ID #${post.id}` : 'Создание новой публикации'} · язык:{' '}
            <span className={`pill ${post.locale === 'uz' ? 'green' : post.locale === 'ru' ? 'red' : 'yellow'}`}>
              {post.locale}
            </span>
          </div>
        </div>
        <div className="actions">
          {post.id ? (
            <Link href={`/7071218admin/news/${post.id}/revisions`} className="btn">
              ⏱ История
            </Link>
          ) : null}
          <Link href="/7071218admin/news" className="btn">
            Отмена
          </Link>
          <button type="submit" className="btn primary">
            {post.id ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap)' }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="field">
            <label htmlFor="title">Заголовок</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={post.title}
              className="input"
              maxLength={300}
            />
          </div>
          <div className="field">
            <label htmlFor="slug">URL-slug (опционально, генерируется из заголовка)</label>
            <input id="slug" name="slug" type="text" defaultValue={post.slug} className="input" maxLength={200} />
          </div>
          <div className="field">
            <label htmlFor="summary">Лид / краткое описание (HTML, опционально)</label>
            <textarea
              id="summary"
              name="summary"
              defaultValue={post.summary ?? ''}
              className="textarea"
              style={{ minHeight: 80 }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Если оставить пустым — автоматически возьмётся первый абзац статьи
            </div>
          </div>
          <div className="field">
            <label htmlFor="tags">Теги (через запятую)</label>
            <input
              id="tags"
              name="tags"
              type="text"
              defaultValue={post.tags}
              placeholder="Реал Мадрид, Лига чемпионов, трансферы"
              className="input"
              maxLength={500}
              list="tag-suggestions"
            />
            {post.allTagNames.length > 0 ? (
              <datalist id="tag-suggestions">
                {post.allTagNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            ) : null}
          </div>
          <div className="field">
            <label>Тело статьи</label>
            <RichEditor name="body" defaultValue={post.body} placeholder="Начните писать…" />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              💡 Шорткоды: <code>[fixture id=N]</code> · <code>[team id=N]</code> · <code>[youtube id=ABC]</code> · <code>[tweet id=NNNN]</code>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="field">
              <label>Статус</label>
              <select name="status" defaultValue={post.status} className="select">
                <option value="draft">Черновик</option>
                <option value="scheduled">⏱ Запланировать</option>
                <option value="published">Опубликовать</option>
                <option value="archived">В архив</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="publishedAt">Дата публикации (для «Запланировать»)</label>
              <input
                id="publishedAt"
                name="publishedAt"
                type="datetime-local"
                defaultValue={post.publishedAt ?? ''}
                className="input"
              />
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Если статус = «Запланировать», укажите будущую дату — cron автоматически опубликует
              </div>
            </div>
            <div className="field">
              <label>Язык</label>
              <select name="locale" defaultValue={post.locale} className="select" disabled={post.id != null}>
                <option value="uz">Узбекский</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="field">
              <label>Категория</label>
              <select name="categoryId" defaultValue={post.categoryId ?? ''} className="select">
                <option value="">— не выбрана —</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Обложка</label>
              <CoverUpload name="coverImage" defaultValue={post.coverImage} />
            </div>
            <div className="field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                <input type="checkbox" name="featured" value="1" defaultChecked={post.featured} />
                <span>📌 Закрепить на главной</span>
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, paddingLeft: 22 }}>
                Самая свежая закрепленная статья показывается как герой главной
              </div>
            </div>
            <div className="field">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                <input type="checkbox" name="sendPush" value="1" />
                <span>🔔 Отправить push после сохранения</span>
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, paddingLeft: 22 }}>
                Только если статья будет опубликована (status = published)
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
              🤖 AI-помощник
            </h3>
            <NewsAiPanel postId={post.id} locale={post.locale} />
          </div>
        </div>
      </div>
    </form>
  );
}
