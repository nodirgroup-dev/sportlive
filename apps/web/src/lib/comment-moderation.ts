import 'server-only';

export type ModerationResult = { score: number; reason: string };

const SPAM_KEYWORDS = [
  'casino',
  'viagra',
  'cialis',
  'porn',
  'click here',
  'buy now',
  'free money',
  'crypto signal',
  'bet on',
  'http://',
  'https://',
];

/**
 * Cheap heuristic spam scoring (0..100). When ANTHROPIC_API_KEY is set, we
 * also ask Claude to grade the message; otherwise we fall back to local rules.
 * Score >= 80 → mark as spam; < 30 → auto-approve; otherwise → pending.
 */
export async function moderateComment(body: string, author: string | null): Promise<ModerationResult | null> {
  // Local rules first — fast and free.
  const text = body.toLowerCase();
  let score = 0;
  const flags: string[] = [];
  const linkCount = (text.match(/https?:\/\//g) ?? []).length;
  if (linkCount >= 3) {
    score += 50;
    flags.push('links');
  } else if (linkCount === 1 || linkCount === 2) {
    score += 15;
    flags.push('link');
  }
  for (const kw of SPAM_KEYWORDS) {
    if (text.includes(kw)) {
      score += 18;
      flags.push(kw);
    }
  }
  if (text.length < 10) {
    score += 10;
    flags.push('tiny');
  }
  if (/(.)\1{6,}/.test(text)) {
    score += 25;
    flags.push('flood');
  }
  if (author && /\b(viagra|casino|porn)\b/i.test(author)) score += 30;

  // Cap local score; AI can push it higher or pull it lower.
  score = Math.min(95, score);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { score, reason: flags.join(',') || 'local' };

  // Defer to Claude only when the local score is ambiguous, to save tokens.
  if (score < 30 || score > 70) return { score, reason: flags.join(',') || 'local' };

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const sys =
      'You are a comment moderator for a sports news site. Reply with STRICT JSON {"score":N,"reason":"..."}. Score 0..100; higher = more spammy/abusive/off-topic. No commentary.';
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      system: sys,
      messages: [{ role: 'user', content: `Author: ${author ?? 'anon'}\nComment:\n${body.slice(0, 1500)}` }],
    });
    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return { score, reason: flags.join(',') || 'local' };
    const cleaned = block.text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(cleaned) as { score?: number; reason?: string };
    if (typeof parsed.score === 'number') {
      return {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        reason: parsed.reason ?? '',
      };
    }
    return { score, reason: flags.join(',') || 'local' };
  } catch (e) {
    console.error('[moderation] AI failed', e);
    return { score, reason: flags.join(',') || 'local' };
  }
}
