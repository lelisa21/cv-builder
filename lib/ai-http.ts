import { AiConfig, OPENROUTER_AUTO_MODEL } from '@/lib/ai-config';
import { callPuterAi } from '@/lib/puter-ai';

interface ImageInput {
  dataUrl: string;
}

const GEMINI_FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-pro-preview',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

/** Last-resort free model ids. Live discovery from /models is always preferred. */
const OPENROUTER_STATIC_FREE_MODELS = [
  'particle-ai/particle-1:free',
  'nvidia/nemotron-3.5-lightning:free',
  'baidu/ernie-5.5-flash-preview:free',
  'recursive/flint-v1.0:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'dots-studio/dots-3-note-preview:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
];

const PREFERRED_FREE_MODEL_PARTS = [
  // Measured on the real letter/requirements prompts: fastest reliable free chat models first.
  'particle-1',
  'ernie-5.5-flash',
  'nemotron-3.5-lightning',
  'nemotron-3-ultra',
  'flint-v1',
  'dots-3-note',
  // Long-standing free chat families that may reappear in the catalog.
  'llama-3.3',
  'gemini-2',
  'qwen3',
  'gpt-oss',
  'deepseek-r1',
  'glm-4.5',
  'phi-4',
  // Known 429-heavy models are intentionally last.
  'ling-3.2-flash',
  'lfm-3',
];

const OPENROUTER_REQUEST_BUDGET_MS = 45_000;
const OPENROUTER_PER_MODEL_TIMEOUT_MS = 18_000;
const OPENROUTER_MAX_CANDIDATES = 6;

let freeModelCache: { expires: number; models: string[] } | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class AiHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AiHttpError';
  }
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return { mimeType: 'image/png', base64: dataUrl };
  return { mimeType: match[1], base64: dataUrl };
}

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function openaiJsonOnce(cfg: { baseUrl: string; key: string; model: string }, prompt: string, images: ImageInput[], temperature: number): Promise<string> {
  const content: Array<Record<string, unknown>> = [{ type: 'text', text: prompt }];
  images.forEach((img) => {
    content.push({ type: 'image_url', image_url: { url: img.dataUrl } });
  });

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content }],
      response_format: { type: 'json_object' },
      temperature,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new AiHttpError(`openai ${res.status}: ${txt.slice(0, 500)}`, res.status);
  }
  const data = await res.json();
  const contentText = data.choices?.[0]?.message?.content;
  return typeof contentText === 'string' ? contentText : '';
}

async function geminiJsonOnce(
  cfg: AiConfig,
  model: string,
  prompt: string,
  images: ImageInput[],
  temperature: number,
): Promise<string> {
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  images.forEach((img) => {
    const { mimeType, base64 } = parseDataUrl(img.dataUrl);
    parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', temperature },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new AiHttpError(`gemini ${res.status} (model ${model}): ${txt.slice(0, 500)}`, res.status);
  }
  const data = await res.json();
  const textParts: string[] = (data.candidates?.[0]?.content?.parts || [])
    .map((p: { text?: string }) => p.text)
    .filter(Boolean);
  return textParts.join('').trim();
}

function messageContentToString(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .join('');
  }
  return '';
}

function scoreFreeModel(id: string): number {
  const index = PREFERRED_FREE_MODEL_PARTS.findIndex((part) => id.includes(part));
  return index === -1 ? PREFERRED_FREE_MODEL_PARTS.length : index;
}

/** Discovers currently available OpenRouter :free text models. Cached for 10 minutes. */
async function discoverOpenRouterFreeModels(key: string, deadline: number): Promise<string[]> {
  if (freeModelCache && freeModelCache.expires > Date.now()) return freeModelCache.models;

  try {
    const { signal, clear } = withTimeout(Math.min(8000, Math.max(1000, deadline - Date.now() - 2000)));
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal,
    });
    clear();

    if (res.ok) {
      const data = (await res.json()) as { data?: Array<{ id?: string }> };
      const models = (data.data || [])
        .map((model) => model.id || '')
        .filter(
          (id) =>
            id.endsWith(':free') &&
            !/(image|tts|whisper|embedding|moderation|transcribe|reasoning|-vl|omni)/i.test(id),
        );
      if (models.length) {
        const unique = Array.from(new Set(models))
          .sort((a, b) => scoreFreeModel(a) - scoreFreeModel(b) || a.localeCompare(b))
          .slice(0, 10);
        freeModelCache = { expires: Date.now() + 10 * 60 * 1000, models: unique };
        return unique;
      }
    }
  } catch (err) {
    console.warn('[OpenRouter] Free model discovery failed; using static list.', err);
  }

  return OPENROUTER_STATIC_FREE_MODELS;
}

async function openrouterJsonOnce(
  key: string,
  model: string,
  prompt: string,
  temperature: number,
  timeoutMs: number,
): Promise<string> {
  const { signal, clear } = withTimeout(timeoutMs);
  let res: Response;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'CV Studio - Letter Studio',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        // response_format is intentionally omitted: several free models reject it.
      }),
      signal,
      cache: 'no-store',
    });
  } catch (err) {
    clear();
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AiHttpError(`openrouter ${model}: request timed out`, 408);
    }
    throw new AiHttpError(`openrouter ${model}: network unavailable`, -1);
  }
  clear();

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new AiHttpError(`openrouter ${model} ${res.status}: ${txt.slice(0, 300)}`, res.status);
  }

  const data = await res.json();
  const content = messageContentToString(data?.choices?.[0]?.message?.content);
  if (!content.trim()) {
    throw new AiHttpError(`openrouter ${model}: empty response`, 502);
  }
  return content;
}

const isRetryable = (status: number) => status === 429 || status >= 500;

export async function openaiJson(
  cfg: { baseUrl: string; key: string; model: string },
  prompt: string,
  images: ImageInput[] = [],
  temperature = 0.2,
): Promise<string> {
  const attempts = 2;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await openaiJsonOnce(cfg, prompt, images, temperature);
    } catch (err) {
      lastErr = err;
      const status = err instanceof AiHttpError ? err.status : -1;
      if (!isRetryable(status) || i === attempts - 1) throw err;
      await sleep(500);
    }
  }
  throw lastErr;
}

export async function geminiJson(
  cfg: AiConfig,
  prompt: string,
  images: ImageInput[] = [],
  temperature = 0.2,
): Promise<string> {
  const candidates = Array.from(new Set([cfg.model, ...GEMINI_FALLBACK_MODELS])).filter(Boolean);
  const lastErrors: string[] = [];

  for (const model of candidates) {
    try {
      return await geminiJsonOnce(cfg, model, prompt, images, temperature);
    } catch (err) {
      const status = err instanceof AiHttpError ? err.status : -1;
      lastErrors.push(err instanceof Error ? err.message : String(err));
      if (status === 404) continue; // model unavailable — try next candidate
      // For rate limits or timeouts, try next model candidate immediately
      continue;
    }
  }
  throw new Error(`Gemini models failed: ${lastErrors.join('; ')}`);
}

/** Calls OpenRouter free models, retrying across model candidates on rate limits. */
export async function openrouterJson(
  key: string,
  configuredModel: string,
  prompt: string,
  temperature = 0.6,
): Promise<string> {
  if (!key) throw new AiHttpError('OpenRouter key is missing', 401);

  const deadline = Date.now() + OPENROUTER_REQUEST_BUDGET_MS;
  const discovered = await discoverOpenRouterFreeModels(key, deadline);
  const candidates = Array.from(
    new Set([
      ...(configuredModel && configuredModel !== OPENROUTER_AUTO_MODEL ? [configuredModel] : []),
      ...discovered,
    ]),
  ).slice(0, OPENROUTER_MAX_CANDIDATES);

  const lastErrors: string[] = [];

  for (const model of candidates) {
    const remaining = deadline - Date.now();
    // Leave enough time for at least one useful attempt.
    if (remaining < 5000) break;

    try {
      return await openrouterJsonOnce(
        key,
        model,
        prompt,
        temperature,
        Math.min(OPENROUTER_PER_MODEL_TIMEOUT_MS, remaining - 1000),
      );
    } catch (err) {
      const status = err instanceof AiHttpError ? err.status : -1;
      lastErrors.push(err instanceof Error ? err.message : String(err));

      // Invalid credentials will fail identically on every model.
      if (status === 401) throw err;
      // A 429 means this free model is rate-limited for us — go straight to the next.
    }
  }

  throw new Error(`OpenRouter free models failed: ${lastErrors.slice(-4).join('; ')}`);
}

export async function aiJson(cfg: AiConfig, prompt: string, images: ImageInput[] = [], temperature = 0.2): Promise<string> {
  const primaryFn = async () => {
    if (cfg.provider === 'openrouter') {
      return await openrouterJson(cfg.key, cfg.model, prompt, temperature);
    }
    if (cfg.provider === 'gemini') return await geminiJson(cfg, prompt, images, temperature);
    if (cfg.provider === 'puter') return await callPuterAi(prompt, { temperature });
    return await openaiJson(cfg, prompt, images, temperature);
  };

  try {
    return await primaryFn();
  } catch (primaryErr) {
    console.warn(`[AI Engine] Primary provider (${cfg.provider}) failed. Attempting secondary fallbacks...`, primaryErr);

    // Try secondary providers (OpenRouter / Gemini / OpenAI / Puter) if configured.
    if (cfg.secondaryProviders && cfg.secondaryProviders.length > 0) {
      for (const sec of cfg.secondaryProviders) {
        try {
          if (sec.provider === 'puter') {
            return await callPuterAi(prompt, { model: sec.model, temperature });
          }
          if (sec.provider === 'openrouter') {
            return await openrouterJson(sec.key, sec.model, prompt, temperature);
          }
          if (sec.provider === 'gemini') {
            return await geminiJson(
              { ...cfg, key: sec.key, model: sec.model, baseUrl: sec.baseUrl },
              prompt,
              images,
              temperature,
            );
          }
          return await openaiJson(sec, prompt, images, temperature);
        } catch (secErr) {
          console.warn(`[AI Engine] Secondary provider (${sec.provider} - ${sec.model}) failed:`, secErr);
        }
      }
    }

    // Try Puter AI as general fallback if available.
    try {
      return await callPuterAi(prompt, { temperature });
    } catch {
      // Puter not available — rethrow primary error
    }

    throw primaryErr;
  }
}
