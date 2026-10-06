/**
 * The AI "System" route (brief §8). POST { type: 'quests' | 'report', context } with header
 * x-app-passcode = APP_PASSCODE. The provider key stays on the server.
 */
import { timingSafeEqual } from 'node:crypto';
import { QUESTS_TASK, REPORT_TASK, SYSTEM_PROMPT } from './_lib/prompt.js';
import { complete, ProviderError } from './_lib/providers.js';
import { allow } from './_lib/ratelimit.js';
import {
  cleanReport,
  extractJson,
  QuestsReply,
  RequestSchema,
  sanitizeQuests,
} from './_lib/schema.js';

const MAX_BODY = 24_000;

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

function passcodeOk(given: string | null): boolean {
  const want = process.env.APP_PASSCODE?.trim();
  if (!want || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The context the client sent, minus anything that looks like free text we did not ask for. */
function contextText(context: Record<string, unknown>): string {
  const { notes: _notes, note: _note, ...rest } = context;
  return JSON.stringify(rest).slice(0, 12_000);
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.APP_PASSCODE)
    return json(500, { error: 'APP_PASSCODE is not set on the server.' });
  if (!passcodeOk(request.headers.get('x-app-passcode')))
    return json(401, { error: 'Passcode rejected.' });

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local';
  const rate = allow(ip);
  if (!rate.ok)
    return json(429, { error: 'Too many requests.' }, { 'retry-after': String(rate.retryAfter) });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { error: 'Context too large.' });
  let parsed;
  try {
    parsed = RequestSchema.safeParse(JSON.parse(raw));
  } catch {
    return json(400, { error: 'Body is not JSON.' });
  }
  if (!parsed.success)
    return json(400, { error: 'Expected { type: "quests" | "report", context: {...} }.' });
  const { type, context } = parsed.data;
  const ctx = contextText(context);

  try {
    if (type === 'quests') {
      const out = await complete(SYSTEM_PROMPT, `${QUESTS_TASK}\n\nPlayer context:\n${ctx}`, 1200);
      if (out.refused) return json(502, { error: 'The System declined this request.' });
      const reply = QuestsReply.safeParse(extractJson(out.text));
      if (!reply.success)
        return json(502, { error: 'The System answered in the wrong shape. Try again.' });
      const today = Array.isArray(context.todayQuests)
        ? context.todayQuests.flatMap((q) =>
            q && typeof q === 'object' && 'title' in q && typeof q.title === 'string'
              ? [q.title]
              : [],
          )
        : [];
      const clean = sanitizeQuests(reply.data, today);
      if (clean.quests.length < 2)
        return json(502, { error: 'The System produced too few usable quests. Try again.' });
      return json(200, clean);
    }
    const out = await complete(SYSTEM_PROMPT, `${REPORT_TASK}\n\nPlayer context:\n${ctx}`, 1500);
    if (out.refused) return json(502, { error: 'The System declined this request.' });
    const report = cleanReport(out.text);
    if (!/STATUS/i.test(report))
      return json(502, { error: 'The System answered in the wrong shape. Try again.' });
    return json(200, { report });
  } catch (e) {
    if (e instanceof ProviderError) return json(e.status, { error: e.message });
    if (e instanceof SyntaxError || (e instanceof Error && e.message === 'no JSON object')) {
      return json(502, { error: 'The System answered in the wrong shape. Try again.' });
    }
    return json(500, { error: 'The System failed unexpectedly.' });
  }
}
