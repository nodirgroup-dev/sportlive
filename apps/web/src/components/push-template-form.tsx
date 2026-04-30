'use client';

import { useState } from 'react';
import { Zap, Goal, Flag, Sparkles, Send, type LucideIcon } from 'lucide-react';

const TEMPLATES: Array<{
  id: string;
  label: string;
  Icon: LucideIcon;
  title: string;
  body: string;
}> = [
  { id: 'breaking', label: 'Срочно', Icon: Zap, title: '⚡ СРОЧНО', body: 'Только что: ' },
  { id: 'goal', label: 'Live: гол', Icon: Goal, title: '⚽ ГОЛ!', body: 'В матче только что забит гол: ' },
  { id: 'final', label: 'Финал', Icon: Flag, title: '🏁 Финальный свисток', body: 'Матч завершён: ' },
  { id: 'fresh', label: 'Только что', Icon: Sparkles, title: 'Только что', body: 'Свежая публикация: ' },
];

export function PushTemplateForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function applyTemplate(tplId: string) {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setTitle(tpl.title);
    setBody(tpl.body);
  }

  return (
    <form action={action} className="card" style={{ padding: 16, marginBottom: 14 }}>
      <h2 style={{ margin: 0, marginBottom: 10, fontSize: 13, fontWeight: 600 }}>
        Произвольное уведомление
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {TEMPLATES.map((t) => {
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              className="btn"
              style={{
                height: 28,
                fontSize: 11.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon size={12} strokeWidth={1.8} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="field">
        <label htmlFor="ptitle">Заголовок</label>
        <input
          id="ptitle"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          className="input"
        />
      </div>
      <div className="field">
        <label htmlFor="pbody">Текст</label>
        <textarea
          id="pbody"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={500}
          required
          className="textarea"
          style={{ minHeight: 60 }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 8 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="purl">URL (куда ведёт клик)</label>
          <input
            id="purl"
            name="url"
            type="url"
            placeholder="https://sportlive.uz/..."
            className="input"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="plocale">Язык</label>
          <select id="plocale" name="locale" defaultValue="" className="select">
            <option value="">Все</option>
            <option value="uz">UZ</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="submit"
            className="btn primary"
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Send size={13} strokeWidth={1.8} />
            Отправить
          </button>
        </div>
      </div>
    </form>
  );
}
