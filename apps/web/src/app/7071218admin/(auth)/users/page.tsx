import { db, users, posts } from '@sportlive/db';
import { eq, sql, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const ROLE_PILL: Record<string, string> = {
  admin: 'green',
  editor: 'red',
  author: 'yellow',
  reader: 'gray',
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Админ',
  editor: 'Редактор',
  author: 'Автор',
  reader: 'Читатель',
};

async function getUsers() {
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      legacyId: users.legacyId,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.id));

  const counts = await db
    .select({ id: posts.authorId, c: sql<number>`count(*)::int` })
    .from(posts)
    .groupBy(posts.authorId);
  const countMap = new Map<number, number>();
  for (const r of counts) if (r.id) countMap.set(r.id, r.c);

  return list.map((u) => ({ ...u, posts: countMap.get(u.id) ?? 0 }));
}

export default async function UsersPage() {
  const list = await getUsers();

  return (
    <>
      <div className="page-h">
        <div>
          <h1>Пользователи</h1>
          <div className="sub">{list.length} аккаунтов</div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Подтверждён</th>
              <th className="num">Статей</th>
              <th>Создан</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td className="num" style={{ color: 'var(--text-3)' }}>{u.legacyId ?? u.id}</td>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{u.email}</code></td>
                <td>
                  <span className={`pill ${ROLE_PILL[u.role] ?? 'gray'}`}>{ROLE_LABEL[u.role] ?? u.role}</span>
                </td>
                <td>
                  <span className={`pill ${u.emailVerified ? 'green' : 'gray'}`}>{u.emailVerified ? 'да' : 'нет'}</span>
                </td>
                <td className="num">{u.posts}</td>
                <td style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
                  {new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(u.createdAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
