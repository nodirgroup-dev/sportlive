'use client';

import { useRef, useState } from 'react';

export function CoverUpload({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      setUrl(j.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            style={{ width: 120, height: 80, borderRadius: 6, objectFit: 'cover', background: 'var(--surface-3)' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', wordBreak: 'break-all' }}>
              {url}
            </div>
            <button
              type="button"
              className="btn"
              style={{ height: 26, fontSize: 11, marginTop: 6 }}
              onClick={() => setUrl('')}
            >
              Удалить
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/uploads/posts/...webp или вставьте URL"
          className="input"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '…' : 'Загрузить'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
      </div>
      {err ? <div className="login-err" style={{ marginTop: 8 }}>{err}</div> : null}
    </div>
  );
}
