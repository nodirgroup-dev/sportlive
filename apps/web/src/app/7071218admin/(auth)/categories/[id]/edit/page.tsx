import { notFound } from 'next/navigation';
import { db, categories } from '@sportlive/db';
import { and, asc, eq, ne } from 'drizzle-orm';
import { CategoryForm } from '../../_form';
import { updateCategory } from '../../../_actions/categories';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (rows.length === 0) notFound();
  const c = rows[0]!;

  // Same-locale parent candidates excluding self.
  const parents = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.locale, c.locale), ne(categories.id, c.id)))
    .orderBy(asc(categories.sortOrder));

  const action = updateCategory.bind(null, id);

  return (
    <CategoryForm
      cat={{
        id: c.id,
        locale: c.locale as 'uz' | 'ru' | 'en',
        slug: c.slug,
        name: c.name,
        description: c.description,
        parentId: c.parentId,
        sortOrder: c.sortOrder,
      }}
      parents={parents}
      action={action}
    />
  );
}
