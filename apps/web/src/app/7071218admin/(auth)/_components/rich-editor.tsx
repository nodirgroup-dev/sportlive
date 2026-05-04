'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useState, useEffect } from 'react';

type Props = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
};

export function RichEditor({ name, defaultValue = '', placeholder }: Props) {
  // Hidden input mirrors editor HTML so the form submits the latest content.
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noreferrer', target: '_blank' },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: { style: 'max-width:100%;' },
      }),
    ],
    content: defaultValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-content',
      },
    },
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return (
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="textarea"
        style={{ minHeight: 360 }}
        placeholder={placeholder}
      />
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes('link').href ?? '';
    const url = window.prompt('URL для ссылки', previous);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertImgShortcode = (url: string) => {
    // Wrap in <p> so it lives on its own block in the document — TipTap's
    // schema otherwise glues the literal text into a previous paragraph.
    editor
      .chain()
      .focus()
      .insertContent(`<p>[img]${url}[/img]</p>`)
      .run();
  };

  const setImg = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const fd = new FormData();
        fd.append('file', f);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${res.status}`);
        }
        const j = await res.json();
        insertImgShortcode(j.url);
      } catch (e) {
        const url = window.prompt(
          `Загрузка не удалась (${e instanceof Error ? e.message : 'error'}). Вставьте URL вручную:`,
          '',
        );
        if (url) insertImgShortcode(url);
      }
    };
    input.click();
  };

  return (
    <div className="rich-editor">
      <input type="hidden" name={name} value={html} />
      <div className="rich-toolbar">
        <Btn label="B" title="Жирный" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} bold />
        <Btn label="I" title="Курсив" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} italic />
        <Btn label="S" title="Зачёркнутый" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} strike />
        <Sep />
        <Btn label="H2" title="Заголовок 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <Btn label="H3" title="Заголовок 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <Btn label="P" title="Параграф" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} />
        <Sep />
        <Btn label="• Список" title="Список" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <Btn label="1. Список" title="Нумерованный" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <Btn label="❝ Цитата" title="Цитата" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <Sep />
        <Btn label="🔗" title="Ссылка" active={editor.isActive('link')} onClick={setLink} />
        <Btn label="🖼" title="Изображение" onClick={setImg} />
        <Btn label="—" title="Разделитель" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <Sep />
        <Btn label="⤺" title="Назад" onClick={() => editor.chain().focus().undo().run()} />
        <Btn label="⤻" title="Вперёд" onClick={() => editor.chain().focus().redo().run()} />
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .rich-editor {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 8px;
          overflow: hidden;
        }
        .rich-toolbar {
          display: flex; flex-wrap: wrap; gap: 2px;
          padding: 6px 8px;
          background: var(--surface-2);
          border-bottom: 1px solid var(--line);
        }
        .rich-toolbar button {
          background: transparent; border: 1px solid transparent;
          color: var(--text-2); font-size: 12.5px; font-weight: 500;
          padding: 4px 9px; border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
        }
        .rich-toolbar button:hover { background: var(--surface-3); color: var(--text); }
        .rich-toolbar button.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-line); }
        .rich-toolbar button.bold { font-weight: 700; }
        .rich-toolbar button.italic { font-style: italic; }
        .rich-toolbar button.strike { text-decoration: line-through; }
        .rich-toolbar .sep { width: 1px; background: var(--line); margin: 4px 4px; }

        .tiptap-content {
          min-height: 360px;
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text);
          outline: none;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .tiptap-content:focus { outline: none; }
        .tiptap-content p { margin: 0.5em 0; }
        .tiptap-content h2 { font-size: 1.4em; font-weight: 700; margin: 0.8em 0 0.3em; }
        .tiptap-content h3 { font-size: 1.2em; font-weight: 700; margin: 0.7em 0 0.3em; }
        .tiptap-content a { color: var(--accent); text-decoration: underline; }
        .tiptap-content ul, .tiptap-content ol { padding-left: 1.5em; margin: 0.5em 0; }
        .tiptap-content blockquote { border-left: 3px solid var(--accent); padding-left: 1em; color: var(--text-2); font-style: italic; margin: 0.7em 0; }
        .tiptap-content img { max-width: 100%; border-radius: 6px; margin: 0.7em 0; }
        .tiptap-content hr { border: 0; border-top: 1px solid var(--line); margin: 1em 0; }
        .tiptap-content code { font-family: var(--font-mono); background: var(--surface-3); padding: 2px 5px; border-radius: 4px; font-size: 0.9em; }
      `}</style>
    </div>
  );
}

function Btn({
  label,
  title,
  active,
  onClick,
  bold,
  italic,
  strike,
}: {
  label: string;
  title?: string;
  active?: boolean;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
}) {
  const cls = [active ? 'active' : '', bold ? 'bold' : '', italic ? 'italic' : '', strike ? 'strike' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" title={title} className={cls} onClick={onClick}>
      {label}
    </button>
  );
}

function Sep() {
  return <span className="sep" />;
}
