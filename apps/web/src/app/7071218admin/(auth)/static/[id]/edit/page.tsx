import { notFound } from 'next/navigation';
import { db, staticPages } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { StaticPageForm } from '../../_form';
import { updateStaticPage } from '../../../_actions/static';

export const dynamic = 'force-dynamic';

export default async function EditStaticPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();
  const rows = await db.select().from(staticPages).where(eq(staticPages.id, id)).limit(1);
  if (rows.length === 0) notFound();
  const p = rows[0]!;

  const action = updateStaticPage.bind(null, id);

  return (
    <StaticPageForm
      page={{
        id: p.id,
        locale: p.locale as 'uz' | 'ru' | 'en',
        slug: p.slug,
        title: p.title,
        description: p.description,
        body: p.body,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        sortOrder: p.sortOrder,
        showInFooter: p.showInFooter,
      }}
      action={action}
    />
  );
}
