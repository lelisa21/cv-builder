import { NextRequest, NextResponse } from 'next/server';
import { getAiConfig } from '@/lib/ai-config';
import { aiJson } from '@/lib/ai-http';
import {
  buildLetterPrompt,
  buildRequirementsPrompt,
  sanitizeLetterResult,
  sanitizeRequirementsResult,
} from '@/lib/letter-prompts';
import type { LetterForm, LetterRewrite } from '@/types/letters';
import type { LanguageCode } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REWRITES = new Set(['shorten', 'strengthen', 'formal', 'grammar', 'tailor']);
const LANGUAGES = new Set(['en', 'om', 'am']);
const MODES = new Set(['generate', 'rewrite', 'requirements']);

interface WriteLetterBody {
  mode?: string;
  form?: LetterForm;
  language?: string;
  content?: string;
  instruction?: string;
  jobPosting?: string;
}

export async function POST(req: NextRequest) {
  const cfg = getAiConfig();
  if (!cfg.configured) {
    return NextResponse.json({ mock: true, error: 'AI is not configured' }, { status: 501 });
  }

  let body: WriteLetterBody;
  try {
    body = (await req.json()) as WriteLetterBody;
  } catch {
    return NextResponse.json({ mock: true, error: 'Invalid request' }, { status: 400 });
  }

  const mode = MODES.has(body.mode || '') ? (body.mode as 'generate' | 'rewrite' | 'requirements') : 'generate';
  const language: LanguageCode = LANGUAGES.has(body.language || '')
    ? (body.language as LanguageCode)
    : 'en';
  const instruction = REWRITES.has(body.instruction || '')
    ? (body.instruction as LetterRewrite)
    : 'grammar';
  const source = cfg.provider === 'openrouter' ? 'openrouter' : 'ai';

  if (mode === 'requirements') {
    const posting = (body.jobPosting || body.form?.jobPosting || '').trim();
    if (posting.length < 20) {
      return NextResponse.json({ mock: true, error: 'Job posting is too short' }, { status: 400 });
    }
    try {
      const raw = await aiJson(cfg, buildRequirementsPrompt(posting, language), [], 0.2);
      const requirements = sanitizeRequirementsResult(raw);
      if (!requirements.length) throw new Error('No requirements could be extracted');
      return NextResponse.json({ requirements, source, mock: false });
    } catch (err) {
      console.error('[write-letter:requirements]', err);
      return NextResponse.json(
        {
          mock: true,
          requirements: [],
          error: err instanceof Error ? err.message : 'Requirement extraction failed',
        },
        { status: 200 },
      );
    }
  }

  if (!body.form || typeof body.form !== 'object') {
    return NextResponse.json({ mock: true, error: 'Missing letter details' }, { status: 400 });
  }

  if (mode === 'rewrite' && !body.content?.trim()) {
    return NextResponse.json({ mock: true, error: 'Missing letter text to rewrite' }, { status: 400 });
  }

  try {
    const prompt = buildLetterPrompt({
      form: body.form,
      language,
      mode,
      content: body.content,
      instruction: mode === 'rewrite' ? instruction : undefined,
    });
    const raw = await aiJson(cfg, prompt, [], 0.6);
    const letter = sanitizeLetterResult(raw);

    if (!letter || letter.length < 40) {
      throw new Error('The AI response was empty or too short');
    }

    return NextResponse.json({ letter, source, mock: false });
  } catch (err) {
    console.error('[write-letter]', err);
    return NextResponse.json(
      {
        mock: true,
        error: err instanceof Error ? err.message : 'AI request failed',
      },
      { status: 200 },
    );
  }
}
