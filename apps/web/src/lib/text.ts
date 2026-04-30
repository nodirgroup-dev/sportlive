/** Strip HTML tags and collapse whitespace. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a short summary from an HTML body. Cuts to the last sentence/word
 * boundary inside `max` characters so we don't truncate mid-word.
 */
export function autoSummary(html: string, max = 220): string {
  const text = stripHtml(html ?? '');
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  // Prefer a sentence break, fall back to last whitespace.
  const punct = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  if (punct > max * 0.6) return slice.slice(0, punct + 1);
  const ws = slice.lastIndexOf(' ');
  return (ws > 0 ? slice.slice(0, ws) : slice) + '…';
}
