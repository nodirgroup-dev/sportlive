#!/usr/bin/env node
/**
 * Translate posts uz → ru and uz → en using Claude Opus 4.7.
 * - Skips posts that already have a translated sibling (matched by group_id + locale).
 * - Uses structured outputs (json_schema) for reliable parsing.
 * - Caches the system prompt for ~90% input-token discount across batches.
 *
 * Run on VPS with ANTHROPIC_API_KEY + DATABASE_URL set.
 *   node scripts/translate-posts.mjs --target ru --limit 50
 *   node scripts/translate-posts.mjs --target en --limit 50
 *   node scripts/translate-posts.mjs --target both --limit 1000
 */
import Anthropic from '@anthropic-ai/sdk';
import postgres from 'postgres';
import { z } from 'zod';

const DATABASE_URL = process.env.DATABASE_URL;
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!DATABASE_URL || !API_KEY) {
  console.error('Need DATABASE_URL and ANTHROPIC_API_KEY');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const TARGETS = args.target === 'both' || !args.target ? ['ru', 'en'] : [args.target];
const LIMIT = parseInt(args.limit ?? '50', 10);
const DRY_RUN = !!args.dry;

const client = new Anthropic({ apiKey: API_KEY });
const sql = postgres(DATABASE_URL, { prepare: false, max: 5, onnotice: () => {} });

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const TRANSLATION_SCHEMA = z.object({
  title: z.string().min(1).max(300),
  summary: z.string(),
  body: z.string().min(1),
  metaTitle: z.string().max(300),
  metaDescription: z.string().max(500),
  metaKeywords: z.string(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
});

const LANG_NAME = { ru: 'Russian (русский)', en: 'English' };

const SYSTEM_PROMPT_BASE = (target) => `You are a professional sports journalism translator working for sportlive.uz, an Uzbek sports news site.

Translate every field from Uzbek to ${LANG_NAME[target]} for native readers.

Rules:
- Preserve tone, factual accuracy, sports terminology, and player/team/club names. Use the conventional spelling in the target language (e.g. "Барселона" / "Barcelona", "Реал Мадрид" / "Real Madrid").
- The "body" field is HTML. Translate text content only — keep ALL HTML tags, attributes, comments (including DLE markers like <!--dle_image_begin:...--> and <!--dle_image_end-->), <img>, <br>, <a> intact and in the same place. Translate alt= and title= attributes.
- "summary" is plain or light HTML — same rule.
- "metaTitle" should be SEO-friendly, ≤ 70 chars when possible, ending naturally.
- "metaDescription" should be SEO-friendly, ≤ 160 chars when possible, factually faithful.
- "metaKeywords" is a comma-separated list — translate each keyword.
- "slug" must be a lowercase ASCII URL slug derived from the translated title. Use only [a-z0-9-]. No accents, no punctuation, no leading/trailing hyphens. Examples for ${target}: ${
  target === 'ru'
    ? '"Барселона выиграла дерби" → "barselona-vyigrala-derbi"'
    : '"Barcelona won the derby" → "barcelona-won-the-derby"'
}.

Return STRICT JSON matching the provided schema. Do not add commentary.`;

async function pickPostsToTranslate(targetLocale, limit) {
  return sql`
    SELECT p.id, p.legacy_id, p.group_id, p.slug, p.title, p.summary, p.body,
           p.meta_title, p.meta_description, p.meta_keywords,
           p.cover_image, p.cover_image_width, p.cover_image_height,
           p.author_id, p.category_id, p.published_at, p.view_count
      FROM posts p
     WHERE p.locale = 'uz'
       AND p.status = 'published'
       AND NOT EXISTS (
         SELECT 1 FROM posts p2
          WHERE p2.locale = ${targetLocale} AND p2.group_id = p.group_id
       )
     ORDER BY p.published_at DESC
     LIMIT ${limit}
  `;
}

async function translateOne(post, target) {
  const userPayload = {
    title: post.title,
    summary: post.summary ?? '',
    body: post.body,
    metaTitle: post.meta_title ?? post.title,
    metaDescription: post.meta_description ?? '',
    metaKeywords: post.meta_keywords ?? '',
  };

  const message = await client.messages.parse({
    model: 'claude-opus-4-7',
    max_tokens: 16000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT_BASE(target),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `Original (uz):\n` +
              `${'```json\n'}${JSON.stringify(userPayload, null, 2)}\n${'```'}\n\n` +
              `Return the same fields translated into ${LANG_NAME[target]}, plus a derived "slug" field.`,
          },
        ],
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: zodToJsonSchema(TRANSLATION_SCHEMA),
        name: 'translated_post',
      },
    },
  });

  if (!message.parsed_output) {
    throw new Error(`No parsed_output in response (stop_reason=${message.stop_reason})`);
  }
  const usage = message.usage;
  return { translated: message.parsed_output, usage };
}

function zodToJsonSchema(schema) {
  // Minimal Zod → JSON Schema for our shape. Avoid pulling another dep.
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties = {};
    const required = [];
    for (const [k, v] of Object.entries(shape)) {
      properties[k] = zodToJsonSchema(v);
      if (!(v instanceof z.ZodOptional)) required.push(k);
    }
    return { type: 'object', properties, required, additionalProperties: false };
  }
  if (schema instanceof z.ZodString) {
    const out = { type: 'string' };
    for (const ch of schema._def.checks ?? []) {
      if (ch.kind === 'min') out.minLength = ch.value;
      if (ch.kind === 'max') out.maxLength = ch.value;
      if (ch.kind === 'regex') out.pattern = ch.regex.source;
    }
    return out;
  }
  return {};
}

async function insertTranslated(post, target, t) {
  // Ensure slug uniqueness in this locale; suffix with legacyId if collision.
  const existing = await sql`
    SELECT 1 FROM posts WHERE locale = ${target} AND slug = ${t.slug} LIMIT 1
  `;
  const slug = existing.length > 0 ? `${t.slug}-${post.legacy_id}` : t.slug;

  await sql`
    INSERT INTO posts (
      legacy_id, locale, slug, title, summary, body,
      author_id, category_id, status, published_at,
      meta_title, meta_description, meta_keywords,
      view_count, group_id, cover_image, cover_image_width, cover_image_height
    ) VALUES (
      NULL, ${target}, ${slug}, ${t.title}, ${t.summary || null}, ${t.body},
      ${post.author_id}, ${post.category_id}, 'published', ${post.published_at},
      ${t.metaTitle}, ${t.metaDescription || null}, ${t.metaKeywords || null},
      0, ${post.group_id}, ${post.cover_image}, ${post.cover_image_width}, ${post.cover_image_height}
    )
    ON CONFLICT DO NOTHING
  `;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) out[key] = 'true';
      else {
        out[key] = next;
        i++;
      }
    }
  }
  if (out.dry === 'true') out.dry = true;
  return out;
}

async function main() {
  let totalIn = 0;
  let totalOut = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;

  for (const target of TARGETS) {
    log(`==== translating uz → ${target} (limit=${LIMIT}) ====`);
    const posts = await pickPostsToTranslate(target, LIMIT);
    log(`  candidates: ${posts.length}`);

    let i = 0;
    for (const post of posts) {
      i++;
      try {
        const { translated, usage } = await translateOne(post, target);
        if (!DRY_RUN) await insertTranslated(post, target, translated);

        totalIn += usage.input_tokens;
        totalOut += usage.output_tokens;
        totalCacheRead += usage.cache_read_input_tokens ?? 0;
        totalCacheWrite += usage.cache_creation_input_tokens ?? 0;

        if (i % 5 === 0 || i === posts.length) {
          log(`  ${target}: ${i}/${posts.length}  (last: "${translated.title.slice(0, 60)}…")`);
        }
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) {
          const retryAfter = parseInt(err.headers?.['retry-after'] ?? '5', 10);
          log(`  RATE LIMITED — sleeping ${retryAfter}s`);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          i--; // retry this post
          continue;
        }
        if (err instanceof Anthropic.APIError) {
          log(`  ERROR (${err.status}) on post ${post.id}: ${err.message}`);
        } else {
          log(`  ERROR on post ${post.id}: ${err.message ?? err}`);
        }
      }
    }
  }

  log(`done. tokens: in=${totalIn} out=${totalOut} cacheRead=${totalCacheRead} cacheWrite=${totalCacheWrite}`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
