/** Per-IP fixed window, in memory. Enough for one user behind a public URL; resets per instance. */
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 12;
const hits = new Map<string, { start: number; count: number }>();

export function allow(ip: string, now = Date.now()): { ok: boolean; retryAfter: number } {
  const cur = hits.get(ip);
  if (!cur || now - cur.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return { ok: true, retryAfter: 0 };
  }
  cur.count += 1;
  if (hits.size > 5000) hits.clear();
  return cur.count <= LIMIT
    ? { ok: true, retryAfter: 0 }
    : { ok: false, retryAfter: Math.ceil((cur.start + WINDOW_MS - now) / 1000) };
}
