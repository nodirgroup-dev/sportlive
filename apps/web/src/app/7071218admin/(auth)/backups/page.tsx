import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const BACKUP_DIR = process.env.BACKUP_DIR || '/var/backups';

type BackupFile = {
  name: string;
  size: number;
  mtimeMs: number;
};

async function listBackups(): Promise<BackupFile[]> {
  let entries: import('fs').Dirent[];
  try {
    entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const files: BackupFile[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith('.sql.gz')) continue;
    const stat = await fs.stat(path.join(BACKUP_DIR, e.name));
    files.push({ name: e.name, size: stat.size, mtimeMs: stat.mtimeMs });
  }
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default async function BackupsPage() {
  const files = await listBackups();
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Бэкапы</h1>
          <div className="sub">
            {files.length} файлов · {fmtBytes(totalSize)} ·{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>{BACKUP_DIR}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 14, fontSize: 12.5, color: 'var(--text-2)' }}>
        Бэкапы создаются ежедневно в 03:30 UTC через{' '}
        <code style={{ fontFamily: 'var(--font-mono)' }}>/opt/sportlive/cron-backup.sh</code>.
        Хранятся 14 дней. Чтобы запустить вручную — выполните на хосте:
        <pre style={{ marginTop: 8, padding: 10, background: 'var(--bg-2)', borderRadius: 6, fontSize: 11, overflowX: 'auto' }}>
{`/opt/sportlive/cron-backup.sh`}
        </pre>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Файл</th>
              <th style={{ width: 160 }}>Создан</th>
              <th className="num" style={{ width: 110 }}>Размер</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.name}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{f.name}</td>
                <td className="t-mono" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)' }}>
                  {new Intl.DateTimeFormat('ru-RU', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(f.mtimeMs))}
                </td>
                <td className="num" style={{ fontFamily: 'var(--font-mono)' }}>
                  {fmtBytes(f.size)}
                </td>
              </tr>
            ))}
            {files.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  Бэкапов пока нет — запустите cron-backup.sh
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
