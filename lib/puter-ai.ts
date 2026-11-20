/**
 * Puter.js and Multi-AI Provider Orchestrator
 * Provides free fallback AI capabilities using Puter.js / OpenRouter / Groq / OpenAI-compatible drivers
 * when primary Gemini/OpenAI rate limits (429) or quotas are reached.
 */

import type { SanitizedJobMatchResult } from '@/lib/job-analysis';

export interface PuterAiOptions {
  model?: 'gpt-4o-mini' | 'gpt-4o' | 'claude-3-5-sonnet' | 'deepseek/deepseek-chat' | 'meta-llama/llama-3.1-70b-instruct' | string;
  temperature?: number;
  json?: boolean;
}

type PuterMessage =
  | { role: 'system' | 'assistant'; content: string }
  | {
      role: 'user';
      content:
        | string
        | Array<
            | { type: 'text'; text: string }
            | { type: 'image_url'; image_url: { url: string } }
          >;
    };

type PuterResponse =
  | string
  | {
      message?: { content?: string };
      text?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (prompt: string | PuterMessage[], options?: Record<string, unknown>) => Promise<PuterResponse>;
      };
      auth?: {
        isSignedIn?: () => Promise<boolean> | boolean;
      };
    };
  }
}

import { TemplateAnalysis } from '@/types';
import {
  buildAnalyzePrompt,
  parseAndSanitizeAnalysis,
  buildWritePrompt,
  sanitizeWriteResult,
} from '@/lib/template-analysis';
import { buildLetterPrompt, sanitizeLetterResult } from '@/lib/letter-prompts';
import type { LetterForm, LetterRewrite } from '@/types/letters';
import type { LanguageCode } from '@/types';

let puterScriptPromise: Promise<Window['puter'] | null> | undefined;

async function loadPuter(): Promise<Window['puter'] | null> {
  if (typeof window === 'undefined') return null;
  if (window.puter?.ai?.chat) return window.puter;

  if (!puterScriptPromise) {
    puterScriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => resolve(window.puter ?? null);
      script.onerror = () => {
        puterScriptPromise = undefined;
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  return puterScriptPromise;
}

/**
 * Executes an AI chat prompt via Puter.js in Browser or Node.js environment
 */
export async function callPuterAi(prompt: string, options: PuterAiOptions = {}): Promise<string> {
  const model = options.model || 'gpt-4o-mini';
  const temperature = options.temperature ?? 0.2;

  if (typeof window !== 'undefined') {
    const puter = await loadPuter();
    try {
      const res = await puter?.ai?.chat(prompt, {
        model,
        temperature,
      });
      if (!res) throw new Error('Puter AI runtime is unavailable.');
      if (typeof res === 'string') return res;
      if (res?.message?.content) return res.message.content;
      if (res?.text) return res.text;
      return String(res);
    } catch (err) {
      console.warn('[Puter.js Browser]', err);
    }
  }

  // 2. Server runtime (Node.js): Use Puter REST API or @heyputer/puter.js if token available
  const puterToken = typeof process !== 'undefined' ? (process.env.PUTER_AUTH_TOKEN || process.env.PUTER_API_KEY) : undefined;
  if (puterToken) {
    try {
      const res = await fetch('https://api.puter.com/drivers/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${puterToken}`,
        },
        body: JSON.stringify({
          interface: 'puter-chat-completion',
          driver: 'openai-completion',
          test_mode: false,
          method: 'complete',
          args: {
            messages: [{ role: 'user', content: prompt }],
            model,
            temperature,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.result?.message?.content || data?.choices?.[0]?.message?.content || data?.text;
        if (content) return content;
      }
    } catch (err) {
      console.warn('[Puter.js Node API]', err);
    }
  }

  throw new Error('Puter AI runtime is currently unavailable.');
}

/**
 * Client-Side Vision Analysis via Puter.js when Gemini backend hits free tier rate limits
 */
export async function analyzeWithPuterClient(
  imageDataUrl: string,
  palette?: string[],
): Promise<TemplateAnalysis | null> {
  const puter = await loadPuter();
  if (!puter?.ai?.chat) return null;

  const prompt = buildAnalyzePrompt(palette);
  try {
    const messages: PuterMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ];

    const res = await puter.ai.chat(messages, {
      model: 'gpt-4o',
      temperature: 0.2,
    });

    const rawText =
      typeof res === 'string'
        ? res
        : res?.message?.content || res?.text || JSON.stringify(res);

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return parseAndSanitizeAnalysis(parsed);
  } catch (err) {
    console.warn('[analyzeWithPuterClient]', err);
    return null;
  }
}

/**
 * Client-Side CV Content Generation via Puter.js when backend AI hits quota
 */
export async function writeCvWithPuterClient(
  analysis: TemplateAnalysis,
  singleton: Record<string, string>,
  entries: Record<string, Array<Record<string, string>>>,
  language = 'en',
): Promise<{ cv: string; refinedSingleton?: Record<string, string>; refinedEntries?: Record<string, Array<Record<string, string>>> } | null> {
  const puter = await loadPuter();
  if (!puter?.ai?.chat) return null;

  const prompt = buildWritePrompt(analysis, singleton, entries, language);
  try {
    const res = await puter.ai.chat(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
    });

    const rawText =
      typeof res === 'string'
        ? res
        : res?.message?.content || res?.text || String(res);

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const result = sanitizeWriteResult(parsed, singleton, entries);
        return {
          cv: result.cv,
          refinedSingleton: result.refined?.singleton,
          refinedEntries: result.refined?.entries,
        };
      } catch {
        // use rawText as CV text
      }
    }

    return { cv: rawText };
  } catch (err) {
    console.warn('[writeCvWithPuterClient]', err);
    return null;
  }
}

/**
 * Client-Side Job Analysis via Puter.js
 */
export async function analyzeJobWithPuterClient(
  job: { position: string; company: string; requirements: string[] },
  profileText: string,
  language = 'en'
): Promise<SanitizedJobMatchResult | null> {
  const puter = await loadPuter();
  if (!puter?.ai?.chat) return null;

  const { buildJobMatchPrompt, sanitizeJobMatchResult } = await import('@/lib/job-analysis');
  const prompt = buildJobMatchPrompt(job, profileText, language);

  try {
    const res = await puter.ai.chat(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.2,
    });

    const rawText =
      typeof res === 'string'
        ? res
        : res?.message?.content || res?.text || String(res);

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return sanitizeJobMatchResult(parsed);
  } catch (err) {
    console.warn('[analyzeJobWithPuterClient]', err);
    return null;
  }
}

/**
 * Client-side letter generation/rewriting through the Puter.js bridge.
 * Used when the server has no AI key or its provider is rate limited.
 */
export async function writeLetterWithPuterClient(params: {
  form: LetterForm;
  language: LanguageCode;
  mode: 'generate' | 'rewrite';
  content?: string;
  instruction?: LetterRewrite;
}): Promise<string | null> {
  const puter = await loadPuter();
  if (!puter) return null;
  const puterAi = puter?.ai;
  const chat = puterAi?.chat;
  if (!puter || !puterAi || !chat) return null;

  // Never trigger Puter's interactive sign-in popup during letter generation.
  if (puter.auth?.isSignedIn) {
    let authTimer: ReturnType<typeof setTimeout> | undefined;
    const signedIn = await Promise.race([
      Promise.resolve(puter.auth.isSignedIn()),
      new Promise<boolean>((resolve) => {
        authTimer = setTimeout(() => resolve(false), 1200);
      }),
    ]).catch(() => false);
    if (authTimer) clearTimeout(authTimer);
    if (!signedIn) return null;
  }

  const prompt = buildLetterPrompt(params);
  const request = (async () => {
    const res = await chat.call(puterAi, prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.6,
    });
    const rawText =
      typeof res === 'string'
        ? res
        : res?.message?.content || res?.text || JSON.stringify(res);
    return sanitizeLetterResult(rawText) || null;
  })();
  request.catch(() => null);

  // Puter can wait indefinitely for an interactive sign-in. Keep the studio usable.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), 9000);
  });

  try {
    return await Promise.race([request, timeout]);
  } catch (err) {
    console.warn('[writeLetterWithPuterClient]', err);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

