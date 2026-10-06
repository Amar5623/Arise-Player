/**
 * Provider adapter: one function, three backends. Anthropic is the default (official SDK);
 * OpenAI and Gemini are selectable with AI_PROVIDER and call their REST APIs directly.
 */
import Anthropic from '@anthropic-ai/sdk';

export interface Completion {
  text: string;
  refused: boolean;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const env = (k: string) => process.env[k]?.trim() || undefined;

async function anthropic(system: string, user: string, maxTokens: number): Promise<Completion> {
  const apiKey = env('ANTHROPIC_API_KEY');
  if (!apiKey) throw new ProviderError('ANTHROPIC_API_KEY is not set on the server.', 500);
  const client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 });
  try {
    const res = await client.messages.create({
      model: env('AI_MODEL') ?? 'claude-haiku-4-5',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n');
    return { text, refused: res.stop_reason === 'refusal' };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError)
      throw new ProviderError('The server’s Anthropic API key was rejected.', 500);
    if (e instanceof Anthropic.RateLimitError)
      throw new ProviderError('The AI provider is rate limiting. Try again shortly.', 503);
    if (e instanceof Anthropic.BadRequestError)
      throw new ProviderError(`The AI provider rejected the request (check AI_MODEL).`, 502);
    if (e instanceof Anthropic.APIError)
      throw new ProviderError(`The AI provider failed (${e.status ?? 'network'}).`, 502);
    throw e;
  }
}

async function openai(system: string, user: string, maxTokens: number): Promise<Completion> {
  const key = env('OPENAI_API_KEY');
  if (!key) throw new ProviderError('OPENAI_API_KEY is not set on the server.', 500);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: env('AI_MODEL') ?? 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new ProviderError(`The AI provider failed (${res.status}).`, 502);
  const body = (await res.json()) as {
    choices?: { message?: { content?: string; refusal?: string | null } }[];
  };
  const msg = body.choices?.[0]?.message;
  return { text: msg?.content ?? '', refused: !!msg?.refusal };
}

async function gemini(system: string, user: string, maxTokens: number): Promise<Completion> {
  const key = env('GEMINI_API_KEY');
  if (!key) throw new ProviderError('GEMINI_API_KEY is not set on the server.', 500);
  const model = env('AI_MODEL') ?? 'gemini-2.0-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    },
  );
  if (!res.ok) throw new ProviderError(`The AI provider failed (${res.status}).`, 502);
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const c = body.candidates?.[0];
  return {
    text: c?.content?.parts?.map((p) => p.text ?? '').join('') ?? '',
    refused: c?.finishReason === 'SAFETY',
  };
}

export function complete(system: string, user: string, maxTokens: number): Promise<Completion> {
  switch ((env('AI_PROVIDER') ?? 'anthropic').toLowerCase()) {
    case 'openai':
      return openai(system, user, maxTokens);
    case 'gemini':
      return gemini(system, user, maxTokens);
    default:
      return anthropic(system, user, maxTokens);
  }
}
