import { db, staticPages } from '@sportlive/db';
import { eq } from 'drizzle-orm';
import { StaticPageForm } from '../_form';
import { createStaticPage } from '../../_actions/static';

export const dynamic = 'force-dynamic';

const ALLOWED_LOCALES = new Set(['uz', 'ru', 'en']);

export default async function NewStaticPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; locale?: string }>;
}) {
  const sp = await searchParams;
  // Prefilled from a "Create translation" pill on an existing page's edit
  // form: ?slug=<existing-slug>&locale=<missing-locale>.
  const seedSlug = (sp.slug ?? '').toString().slice(0, 200);
  const seedLocaleRaw = (sp.locale ?? '').toString();
  const seedLocale = ALLOWED_LOCALES.has(seedLocaleRaw)
    ? (seedLocaleRaw as 'uz' | 'ru' | 'en')
    : 'uz';

  // If a slug is being seeded, prefetch the sibling translations so the
  // "Translations" bar shows the existing pages even before this draft is
  // saved.
  let translations: Array<{ locale: 'uz' | 'ru' | 'en'; id: number; title: string }> = [];
  if (seedSlug) {
    const siblings = await db
      .select({ id: staticPages.id, locale: staticPages.locale, title: staticPages.title })
      .from(staticPages)
      .where(eq(staticPages.slug, seedSlug));
    translations = siblings.map((s) => ({
      locale: s.locale as 'uz' | 'ru' | 'en',
      id: s.id,
      title: s.title,
    }));
  }

  return (
    <StaticPageForm
      page={{
        id: null,
        locale: seedLocale,
        slug: seedSlug,
        title: '',
        description: '',
        body: '',
        metaTitle: '',
        metaDescription: '',
        sortOrder: 0,
        showInFooter: 1,
      }}
      translations={translations}
      action={createStaticPage}
    />
  );
}
