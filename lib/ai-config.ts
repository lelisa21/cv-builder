export type AiProvider = 'openrouter' | 'openai' | 'gemini' | 'puter';

/** Sentinel model id: the adapter discovers a working free OpenRouter model at request time. */
export const OPENROUTER_AUTO_MODEL = 'auto:free';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface AiConfig {
  provider: AiProvider;
  key: string;
  model: string;
  baseUrl: string;
  configured: boolean;
  secondaryProviders?: Array<{
    provider: AiProvider;
    key: string;
    model: string;
    baseUrl: string;
  }>;
}

export function getAiConfig(): AiConfig {
  const requested = (process.env.AI_PROVIDER || '').toLowerCase();

  // The project's .env exposes the OpenRouter key as VITE_OPEN_ROUTER_KEY.
  // Next reads it server-side from process.env; it is never sent to the browser.
  const openrouterKey =
    process.env.VITE_OPEN_ROUTER_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.AI_API_KEY ||
    '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const puterKey = process.env.PUTER_AUTH_TOKEN || process.env.PUTER_API_KEY || '';

  const explicitProvider = (
    ['openrouter', 'gemini', 'puter', 'openai'] as const
  ).find((name) => requested.startsWith(name));

  // OpenRouter is the default whenever its key exists. Explicit AI_PROVIDER
  // settings or dedicated keys still take precedence for existing deployments.
  const provider: AiProvider =
    explicitProvider ||
    (openrouterKey ? 'openrouter' : geminiKey && !openaiKey ? 'gemini' : openaiKey ? 'openai' : 'puter');

  const key =
    provider === 'openrouter'
      ? openrouterKey
      : provider === 'gemini'
        ? geminiKey
        : provider === 'puter'
          ? puterKey
          : openaiKey;

  const baseUrl =
    provider === 'openrouter'
      ? OPENROUTER_BASE_URL
      : process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1';

  const model =
    provider === 'openrouter'
      ? process.env.OPENROUTER_MODEL || OPENROUTER_AUTO_MODEL
      : provider === 'gemini'
        ? process.env.AI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        : provider === 'puter'
          ? process.env.AI_MODEL || 'gpt-4o-mini'
          : process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const secondaryProviders: AiConfig['secondaryProviders'] = [];

  if (provider === 'openrouter') {
    if (geminiKey) {
      secondaryProviders.push({
        provider: 'gemini',
        key: geminiKey,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      });
    }
    if (openaiKey) {
      secondaryProviders.push({
        provider: 'openai',
        key: openaiKey,
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
      });
    }
  } else {
    if (openrouterKey) {
      secondaryProviders.push({
        provider: 'openrouter',
        key: openrouterKey,
        model: OPENROUTER_AUTO_MODEL,
        baseUrl: OPENROUTER_BASE_URL,
      });
    }
    if (provider === 'gemini' && openaiKey) {
      secondaryProviders.push({
        provider: 'openai',
        key: openaiKey,
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
      });
    }
    if (provider !== 'puter' && puterKey) {
      secondaryProviders.push({
        provider: 'puter',
        key: puterKey,
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.puter.com/drivers/ai/chat',
      });
    }
  }

  return {
    provider,
    key: key || '',
    model,
    baseUrl: baseUrl.replace(/\/$/, ''),
    configured: Boolean(key),
    secondaryProviders,
  };
}
