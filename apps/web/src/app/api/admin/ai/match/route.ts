import { NextRequest, NextResponse } from 'next/server';
import { db, posts } from '@sportlive/db';
import { sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { getFixtureById, getHeadToHead } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 90;

type Body = {
  fixtureId: number;
  kind: 'preview' | 'summary';
  locale: 'uz' | 'ru' | 'en';
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''ʻ`]/g, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

async function callClaude(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8000,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const block = msg.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('no text in AI response');
  return block.text.trim();
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!Number.isFinite(body.fixtureId) || (body.kind !== 'preview' && body.kind !== 'summary')) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  }

  const fixture = await getFixtureById(body.fixtureId);
  if (!fixture) return NextResponse.json({ error: 'fixture not found' }, { status: 404 });

  const h2h = await getHeadToHead(fixture.homeTeam.id, fixture.awayTeam.id, 5);

  const langName =
    body.locale === 'uz' ? "O'zbek tili" : body.locale === 'ru' ? 'русский' : 'English';

  const sys =
    body.kind === 'preview'
      ? `You write match previews for sportlive.uz in ${langName}. 350-500 words, HTML <p>...</p>, optional <ul>. Cover form, key players, venue, what's at stake. Output STRICT JSON: {"title":..., "body":..., "summary":...}. Don't make up scores.`
      : `You write post-match summaries for sportlive.uz in ${langName}. 300-450 words, HTML <p>...</p>. Cover key moments, who scored, turning points, fan implications. Output STRICT JSON: {"title":..., "body":..., "summary":...}.`;

  const ctx = {
    league: fixture.league.name,
    round: fixture.round,
    home: fixture.homeTeam.name,
    away: fixture.awayTeam.name,
    kickoff: fixture.kickoffAt.toISOString(),
    venue: fixture.venue ? `${fixture.venue.name}${fixture.venue.city ? ', ' + fixture.venue.city : ''}` : null,
    score: body.kind === 'summary' ? `${fixture.homeGoals ?? 0}-${fixture.awayGoals ?? 0}` : null,
    h2h: h2h.map(
      (m) =>
        `${m.kickoffAt.toISOString().slice(0, 10)} ${m.homeTeam.name} ${m.homeGoals ?? 0}-${m.awayGoals ?? 0} ${m.awayTeam.name}`,
    ),
  };
  const userPrompt = `Match data:\n${JSON.stringify(ctx, null, 2)}\n\nReturn JSON only.`;

  let json: { title?: string; body?: string; summary?: string };
  try {
    const txt = await callClaude(sys, userPrompt);
    json = JSON.parse(txt.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'AI error' }, { status: 502 });
  }

  if (!json.title || !json.body) {
    return NextResponse.json({ error: 'AI returned incomplete output' }, { status: 502 });
  }

  const baseSlug = slugify(json.title);
  const groupId = (await db.execute(sql`SELECT COALESCE(MAX(group_id), 0) + 1 AS g FROM posts`)) as unknown as Array<{
    g: number;
  }>;

  const inserted = await db
    .insert(posts)
    .values({
      locale: body.locale,
      slug: `${baseSlug}-${body.fixtureId}`.slice(0, 200),
      title: json.title.slice(0, 300),
      summary: (json.summary ?? '').slice(0, 500),
      body: json.body,
      authorId: user.id,
      categoryId: null,
      status: 'draft',
      publishedAt: null,
      metaTitle: json.title.slice(0, 300),
      metaDescription: (json.summary ?? '').slice(0, 500),
      groupId: groupId[0]?.g ?? Date.now(),
      coverImage: null,
    })
    .returning({ id: posts.id });

  const newId = inserted[0]!.id;
  return NextResponse.json({
    ok: true,
    newPostId: newId,
    editUrl: `/7071218admin/news/${newId}/edit?ai=match-${body.kind}`,
    message: `${body.kind === 'preview' ? 'Превью' : 'Отчёт'} матча создан (#${newId})`,
  });
}
