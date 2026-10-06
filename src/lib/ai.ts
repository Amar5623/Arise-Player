/** Client for the serverless System route. The API key never reaches the browser. */
import type { Stat } from '@/engine/types';

export interface AiQuest {
  title: string;
  detail: string;
  stat: Stat;
  xp: number;
}

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string; fix?: string };

async function call<T>(
  type: 'quests' | 'report',
  context: unknown,
  passcode: string,
): Promise<AiResult<T>> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      error: 'You are offline.',
      fix: 'The System needs a connection for this. Everything else works offline.',
    };
  }
  let res: Response;
  try {
    res = await fetch('/api/system', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-passcode': passcode },
      body: JSON.stringify({ type, context }),
    });
  } catch {
    return {
      ok: false,
      error: 'The System could not be reached.',
      fix: 'Check your connection and try again.',
    };
  }
  if (res.status === 401)
    return {
      ok: false,
      error: 'Passcode rejected.',
      fix: 'Set the passcode in Settings, AI. It must match APP_PASSCODE on Vercel.',
    };
  if (res.status === 429)
    return { ok: false, error: 'Too many requests.', fix: 'Wait a few minutes and ask again.' };
  if (res.status === 404)
    return {
      ok: false,
      error: 'The System route is not deployed.',
      fix: 'AI works on the Vercel deploy, or with `vercel dev` locally.',
    };
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return {
      ok: false,
      error: body?.error ?? 'The System failed to answer.',
      fix: 'Try again in a moment.',
    };
  }
  return { ok: true, data: (await res.json()) as T };
}

export const askQuests = (context: unknown, passcode: string) =>
  call<{ message: string; quests: AiQuest[] }>('quests', context, passcode);
export const askReport = (context: unknown, passcode: string) =>
  call<{ report: string }>('report', context, passcode);
