import { db, categories } from '@sportlive/db';
import { asc, eq } from 'drizzle-orm';
import { CategoryForm } from '../_form';
import { createCategory } from '../../_actions/categories';

export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  // New category defaults to UZ — preload UZ parents. (When the user changes
  // locale on save, server validation re-checks parent membership anyway.)
  const parents = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.locale, 'uz'))
    .orderBy(asc(categories.sortOrder));

  return (
    <CategoryForm
      cat={{ id: null, locale: 'uz', slug: '', name: '', description: '', parentId: null, sortOrder: 0 }}
      parents={parents}
      action={createCategory}
    />
  );
}
