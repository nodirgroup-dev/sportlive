import { NextRequest, NextResponse } from 'next/server';
import { db, posts } from '@sportlive/db';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 90;

type Body = {
  action: 'translate' | 'summary' | 'headline';
  postId: number;
  target?: 'ru' | 'en';
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''ʻ`]/g, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

async function callClaude(systemPrompt: string, userText: string, model = 'claude-opus-4-7'): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set on the server');
  }
  const { default: Anthropic } = await import('@anthropic-ai/sdk').catch(() => {
    throw new Error('@anthropic-ai/sdk is not installed');
  });
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userText }],
  });
  const textBlock = msg.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('no text block in response');
  return textBlock.text.trim();
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'editor' && user.role !== 'author')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const post = await db.select().from(posts).where(eq(posts.id, body.postId)).limit(1);
  if (post.length === 0) return NextResponse.json({ error: 'post not found' }, { status: 404 });
  const p = post[0]!;

  try {
    if (body.action === 'translate') {
      if (p.locale !== 'uz') {
        return NextResponse.json({ error: 'translate only available from uz origin' }, { status: 400 });
      }
      const target = body.target;
      if (target !== 'ru' && target !== 'en') {
        return NextResponse.json({ error: 'invalid target' }, { status: 400 });
      }

      // Skip if a sibling for this group already exists.
      const existing = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.locale, target), eq(posts.groupId, p.groupId)))
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ error: `${target.toUpperCase()} version already exists (id ${existing[0]!.id})` }, { status: 409 });
      }

      const langName = target === 'ru' ? 'Russian (русский)' : 'English';
      const sys = `You are a professional sports journalism translator for sportlive.uz, an Uzbek sports site.

Translate the article from Uzbek into ${langName} for native readers.

Rules:
- Keep all HTML tags, attributes, comments (including DLE markers like <!--dle_image_begin:...--><!--dle_image_end-->), <img>, <br>, <a> intact.
- Translate text content + alt= and title= attributes only.
- Preserve player/team/club names using the conventional spelling in the target language.
- Return STRICT JSON: {"title":..., "summary":..., "body":..., "metaTitle":..., "metaDescription":..., "metaKeywords":..., "slug":...}
- "slug" must be lowercase ASCII URL slug (a-z0-9-) derived from the translated title.
- No commentary outside the JSON.`;
      const userPayload = JSON.stringify(
        {
          title: p.title,
          summary: p.summary ?? '',
          body: p.body,
          metaTitle: p.metaTitle ?? p.title,
          metaDescription: p.metaDescription ?? '',
          metaKeywords: p.metaKeywords ?? '',
        },
        null,
        2,
      );
      const text = await callClaude(sys, `Original (uz):\n${userPayload}\n\nReturn JSON only.`);
      const json = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
      const slug = slugify(json.slug || json.title || `post-${p.id}`);

      // Avoid slug collision in target locale
      const collide = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.locale, target), eq(posts.slug, slug)))
        .limit(1);
      const finalSlug = collide.length > 0 ? `${slug}-${p.id}` : slug;

      await db.insert(posts).values({
        legacyId: null,
        locale: target,
        slug: finalSlug,
        title: json.title,
        summary: json.summary || null,
        body: json.body,
        authorId: p.authorId,
        categoryId: p.categoryId,
        status: 'published',
        publishedAt: p.publishedAt,
        metaTitle: json.metaTitle || json.title,
        metaDescription: json.metaDescription || null,
        metaKeywords: json.metaKeywords || null,
        viewCount: 0,
        groupId: p.groupId,
        coverImage: p.coverImage,
        coverImageWidth: p.coverImageWidth,
        coverImageHeight: p.coverImageHeight,
      });

      revalidatePath('/');
      revalidatePath('/7071218admin/news');
      return NextResponse.json({ ok: true, message: `${target.toUpperCase()} версия создана` });
    }

    if (body.action === 'summary') {
      const sys =
        'You are an editorial copywriter. Write a concise lead/summary in the same language as the input. Maximum 160 characters. Plain text. Just one sentence. No quotes, no preamble.';
      const text = await callClaude(sys, `Headline: ${p.title}\n\nBody:\n${p.body.replace(/<[^>]*>/g, '').slice(0, 4000)}`);
      const summary = text.replace(/^["'«»]+|["'«»]+$/g, '').slice(0, 500);
      await db.update(posts).set({ summary, updatedAt: new Date() }).where(eq(posts.id, p.id));
      revalidatePath('/7071218admin/news');
      return NextResponse.json({ ok: true, message: 'Лид обновлён', value: summary });
    }

    if (body.action === 'headline') {
      const sys =
        "You are an editorial copywriter for a sports news site. Suggest one strong headline in the article's language. Plain text only — no quotes, no commentary, just the headline.";
      const text = await callClaude(sys, `Current title: ${p.title}\n\nBody:\n${p.body.replace(/<[^>]*>/g, '').slice(0, 4000)}`);
      const headline = text.replace(/^["'«»]+|["'«»]+$/g, '').slice(0, 300);
      return NextResponse.json({ ok: true, message: `Предложение: ${headline}`, value: headline });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    if (msg.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json({ error: 'AI выключен: ANTHROPIC_API_KEY не настроен на сервере' }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
