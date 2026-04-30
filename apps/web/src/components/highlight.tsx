function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Server-rendered highlight: wraps occurrences of `q` in <mark>.
 * Case-insensitive, whole-string match. Empty/short queries pass text through.
 */
export function Highlight({ text, q }: { text: string; q: string }) {
  const needle = q.trim();
  if (!needle || needle.length < 2 || !text) return <>{text}</>;
  const re = new RegExp(`(${escapeRegex(needle)})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-700/50">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
