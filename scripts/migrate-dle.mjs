#!/usr/bin/env node
/**
 * One-shot migration: legacy DLE (MariaDB) → new Postgres schema.
 * Run: DLE_DATABASE_URL=... DATABASE_URL=... node scripts/migrate-dle.mjs
 *
 * Idempotent: re-running updates existing rows by legacy_id where possible.
 */
import mysql from 'mysql2/promise';
import postgres from 'postgres';

const DLE_URL = process.env.DLE_DATABASE_URL;
const PG_URL = process.env.DATABASE_URL;
if (!DLE_URL || !PG_URL) {
  console.error('Need DLE_DATABASE_URL (mysql://...) and DATABASE_URL (postgres://...)');
  process.exit(1);
}

const my = await mysql.createConnection(DLE_URL);
const sql = postgres(PG_URL, { prepare: false, max: 5, onnotice: () => {} });

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---- 1. Users ----
log('migrating users…');
const [users] = await my.query(
  "SELECT user_id, name, email, fullname, user_group FROM dle_users",
);
const userByLegacyId = new Map();
const userByName = new Map();
for (const u of users) {
  const role = u.user_group === 1 ? 'admin' : 'editor';
  const name = (u.fullname || u.name || u.email).toString();
  const [row] = await sql`
    INSERT INTO users (legacy_id, email, name, role, email_verified)
    VALUES (${u.user_id}, ${u.email}, ${name}, ${role}, true)
    ON CONFLICT (email) DO UPDATE
      SET legacy_id = EXCLUDED.legacy_id, name = EXCLUDED.name, role = EXCLUDED.role
    RETURNING id
  `;
  userByLegacyId.set(u.user_id, row.id);
  userByName.set(u.name, row.id);
}
log(`  users: ${users.length}`);

// ---- 2. Categories ----
log('migrating categories…');
const [cats] = await my.query(
  "SELECT id, name, alt_name, parentid, descr, posi FROM dle_category ORDER BY parentid, posi",
);
const catByLegacyId = new Map();
// Pass 1: insert all without parent_id (we'll wire parents in pass 2).
for (const c of cats) {
  const [row] = await sql`
    INSERT INTO categories (legacy_id, slug, locale, name, description, sort_order)
    VALUES (${c.id}, ${c.alt_name}, 'uz', ${c.name}, ${c.descr || null}, ${c.posi || 0})
    ON CONFLICT (slug, locale) DO UPDATE
      SET legacy_id = EXCLUDED.legacy_id, name = EXCLUDED.name, description = EXCLUDED.description
    RETURNING id
  `;
  catByLegacyId.set(c.id, row.id);
}
// Pass 2: link parents.
for (const c of cats) {
  if (c.parentid && c.parentid !== 0) {
    const newId = catByLegacyId.get(c.id);
    const newParentId = catByLegacyId.get(c.parentid);
    if (newId && newParentId) {
      await sql`UPDATE categories SET parent_id = ${newParentId} WHERE id = ${newId}`;
    }
  }
}
log(`  categories: ${cats.length}`);

// ---- Build category-path lookup (legacyId → "football/italiya") ----
const catPath = new Map();
const catByLegacy = new Map(cats.map((c) => [c.id, c]));
function pathFor(legacyId) {
  if (catPath.has(legacyId)) return catPath.get(legacyId);
  const segs = [];
  let cur = catByLegacy.get(legacyId);
  while (cur) {
    segs.unshift(cur.alt_name);
    if (!cur.parentid || cur.parentid === 0) break;
    cur = catByLegacy.get(cur.parentid);
  }
  const p = segs.join('/');
  catPath.set(legacyId, p);
  return p;
}

// ---- 3. Images (read into memory for join with posts) ----
log('reading images…');
const [images] = await my.query("SELECT news_id, images FROM dle_images");
const imgByPostId = new Map();
for (const img of images) {
  if (!img.images) continue;
  const parts = img.images.split('|');
  const filename = (parts[0] || '').trim();
  if (!filename) continue;
  const dim = (parts[3] || '').trim(); // e.g. "1200x900"
  const [w, h] = dim.split('x').map((s) => parseInt(s, 10));
  imgByPostId.set(img.news_id, {
    path: `/uploads/posts/${filename}`,
    width: Number.isFinite(w) ? w : null,
    height: Number.isFinite(h) ? h : null,
  });
}
log(`  images: ${imgByPostId.size}`);

// ---- 4. Posts ----
log('migrating posts…');
const [posts] = await my.query(`
  SELECT id, autor, date, short_story, full_story, title, descr, keywords,
         category, alt_name, metatitle, comm_num, views_top_3
    FROM dle_post
   WHERE approve = 1
   ORDER BY id ASC
`);

let inserted = 0;
let redirCount = 0;
for (const p of posts) {
  const catIds = String(p.category)
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter(Number.isFinite);
  const primaryCatLegacy = catIds[0];
  const newCatId = primaryCatLegacy ? catByLegacyId.get(primaryCatLegacy) ?? null : null;
  const authorId = userByName.get(p.autor) ?? null;
  const fullStory = (p.full_story || '').toString().trim();
  const shortStory = (p.short_story || '').toString().trim();
  const body = fullStory || shortStory || '';
  // Only set summary when it's genuinely a separate, shorter version of the body.
  // DLE legacy posts often have full_story empty, leaving short_story as both —
  // in that case summary is just a duplicate of body.
  const summary =
    shortStory && fullStory && shortStory !== fullStory ? shortStory.slice(0, 1000) : null;
  const cover = imgByPostId.get(p.id);

  const titleStr = (p.title || '').toString();
  const slug = (p.alt_name || `post-${p.id}`).toString().slice(0, 200);

  const [postRow] = await sql`
    INSERT INTO posts (
      legacy_id, locale, slug, title, summary, body,
      author_id, category_id, status, published_at,
      meta_title, meta_description, meta_keywords,
      view_count, group_id, cover_image, cover_image_width, cover_image_height
    ) VALUES (
      ${p.id}, 'uz', ${slug}, ${titleStr}, ${summary}, ${body},
      ${authorId}, ${newCatId}, 'published', ${p.date},
      ${(p.metatitle || titleStr).slice(0, 300)},
      ${p.descr ? p.descr.toString().slice(0, 500) : null},
      ${p.keywords || null},
      ${p.views_top_3 || 0}, ${p.id},
      ${cover?.path ?? null}, ${cover?.width ?? null}, ${cover?.height ?? null}
    )
    ON CONFLICT (legacy_id) DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      body = EXCLUDED.body,
      author_id = EXCLUDED.author_id,
      category_id = EXCLUDED.category_id,
      published_at = EXCLUDED.published_at,
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      meta_keywords = EXCLUDED.meta_keywords,
      view_count = EXCLUDED.view_count,
      cover_image = EXCLUDED.cover_image,
      cover_image_width = EXCLUDED.cover_image_width,
      cover_image_height = EXCLUDED.cover_image_height,
      updated_at = now()
    RETURNING id
  `;
  inserted++;

  // Insert legacy redirect: /<cat-path>/<id>-<alt_name>.html → same canonical
  if (primaryCatLegacy) {
    const cpath = pathFor(primaryCatLegacy);
    if (cpath) {
      const fromPath = `/${cpath}/${p.id}-${slug}.html`;
      const toPath = `/${cpath}/${p.id}-${slug}`;
      if (fromPath !== toPath) {
        await sql`
          INSERT INTO redirects (from_path, to_path, status_code)
          VALUES (${fromPath}, ${toPath}, 301)
          ON CONFLICT (from_path) DO UPDATE SET to_path = EXCLUDED.to_path
        `;
        redirCount++;
      }
    }
  }

  if (inserted % 100 === 0) log(`  posts: ${inserted}/${posts.length}`);
}
log(`  posts: ${inserted}/${posts.length}`);
log(`  redirects: ${redirCount}`);

// ---- 5. Tags (small, just 3) ----
log('migrating tags…');
const [tags] = await my.query("SELECT id, news_id, tag FROM dle_tags WHERE tag IS NOT NULL AND tag <> ''");
let tagCount = 0;
for (const t of tags) {
  const tagText = (t.tag || '').trim();
  if (!tagText) continue;
  // dle_tags.tag may be comma-separated
  const tagList = tagText.split(',').map((x) => x.trim()).filter(Boolean);
  for (const name of tagList) {
    const slug = name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').slice(0, 200);
    if (!slug) continue;
    const [tagRow] = await sql`
      INSERT INTO tags (locale, slug, name) VALUES ('uz', ${slug}, ${name})
      ON CONFLICT (locale, slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    const post = await sql`SELECT id FROM posts WHERE legacy_id = ${t.news_id}`;
    if (post[0]) {
      await sql`
        INSERT INTO post_tags (post_id, tag_id)
        VALUES (${post[0].id}, ${tagRow.id})
        ON CONFLICT DO NOTHING
      `;
      tagCount++;
    }
  }
}
log(`  tag links: ${tagCount}`);

await my.end();
await sql.end();
log('done.');
