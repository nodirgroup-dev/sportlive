#!/usr/bin/env node
/**
 * Migrate static pages from legacy DLE (dle_static) to Postgres.
 * Idempotent — re-runs upsert by (locale, slug).
 */
import mysql from 'mysql2/promise';
import postgres from 'postgres';

const my = await mysql.createConnection(process.env.DLE_DATABASE_URL);
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const [rows] = await my.query(`
  SELECT id, name AS slug, descr AS title, template AS body,
         metatitle AS meta_title, metadescr AS meta_description, metakeys AS meta_keywords,
         descr_ru, template_ru, metatitle_ru, metadescr_ru, metakeys_ru,
         descr_en, template_en, metatitle_en, metadescr_en, metakeys_en
    FROM dle_static
   ORDER BY id
`);

let count = 0;
for (const r of rows) {
  // uz (default)
  if (r.body && r.title) {
    await sql`
      INSERT INTO static_pages (legacy_id, locale, slug, title, body,
                                meta_title, meta_description, meta_keywords, sort_order)
      VALUES (${r.id}, 'uz', ${r.slug}, ${r.title}, ${r.body},
              ${r.meta_title || r.title}, ${r.meta_description || null},
              ${r.meta_keywords || null}, ${r.id})
      ON CONFLICT (locale, slug) DO UPDATE SET
        title = EXCLUDED.title, body = EXCLUDED.body,
        meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description,
        meta_keywords = EXCLUDED.meta_keywords, updated_at = now()
    `;
    count++;
  }

  // ru if present
  if (r.template_ru && r.descr_ru) {
    await sql`
      INSERT INTO static_pages (legacy_id, locale, slug, title, body,
                                meta_title, meta_description, meta_keywords, sort_order)
      VALUES (${r.id}, 'ru', ${r.slug}, ${r.descr_ru}, ${r.template_ru},
              ${r.metatitle_ru || r.descr_ru}, ${r.metadescr_ru || null},
              ${r.metakeys_ru || null}, ${r.id})
      ON CONFLICT (locale, slug) DO UPDATE SET
        title = EXCLUDED.title, body = EXCLUDED.body,
        meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description,
        meta_keywords = EXCLUDED.meta_keywords, updated_at = now()
    `;
    count++;
  }

  // en if present
  if (r.template_en && r.descr_en) {
    await sql`
      INSERT INTO static_pages (legacy_id, locale, slug, title, body,
                                meta_title, meta_description, meta_keywords, sort_order)
      VALUES (${r.id}, 'en', ${r.slug}, ${r.descr_en}, ${r.template_en},
              ${r.metatitle_en || r.descr_en}, ${r.metadescr_en || null},
              ${r.metakeys_en || null}, ${r.id})
      ON CONFLICT (locale, slug) DO UPDATE SET
        title = EXCLUDED.title, body = EXCLUDED.body,
        meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description,
        meta_keywords = EXCLUDED.meta_keywords, updated_at = now()
    `;
    count++;
  }
}

console.log(`Migrated ${count} static page rows from ${rows.length} DLE entries`);
await my.end();
await sql.end();
