import { notFound } from 'next/navigation';
import { db, banners } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { BannerForm } from '../../_form';
import { updateBanner } from '../../../_actions/banners';

export const dynamic = 'force-dynamic';

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id)) notFound();
  const rows = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (rows.length === 0) notFound();
  const b = rows[0]!;

  return (
    <BannerForm
      banner={{
        id: b.id,
        name: b.name,
        position: b.position,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
        altText: b.altText,
        htmlSnippet: b.htmlSnippet,
        sortOrder: b.sortOrder,
        active: b.active,
      }}
      action={updateBanner.bind(null, id)}
    />
  );
}
