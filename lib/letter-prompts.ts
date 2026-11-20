import type { LanguageCode } from '@/types';
import type { LetterForm, LetterRewrite } from '@/types/letters';
import { splitList } from '@/lib/letter-engine';

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  om: 'Afaan Oromo (Latin script)',
  am: 'Amharic (Ethiopic script)',
};

const KIND_NAMES: Record<LetterForm['kind'], string> = {
  application: 'formal job application letter',
  cover: 'persuasive cover letter',
  followup: 'polite follow-up letter about a submitted application',
  inquiry: 'professional letter inquiring about a job opening',
};

const TONE_NAMES: Record<LetterForm['tone'], string> = {
  professional: 'professional, polished and respectful',
  'fresh-graduate': 'enthusiastic fresh-graduate, modest and eager to learn',
  modern: 'modern, direct and concise',
  confident: 'confident and results-oriented without exaggeration',
};

export interface LetterPromptParams {
  form: LetterForm;
  language: LanguageCode;
  mode: 'generate' | 'rewrite';
  content?: string;
  instruction?: LetterRewrite;
}

const REWRITE_INSTRUCTIONS: Record<LetterRewrite, string> = {
  shorten: 'Make the letter noticeably shorter while keeping every concrete fact and the full letter structure.',
  strengthen: 'Make the wording more confident and specific. Remove hedging and vague claims, but never invent facts.',
  formal: 'Make the tone more formal and traditional without changing the facts.',
  grammar: 'Correct grammar, punctuation, spacing and sentence flow. Keep the meaning and the facts unchanged.',
  tailor: 'Better connect the letter to the target role and the listed job requirements using only the supplied facts.',
};

function readableDate(date: string, language: LanguageCode): string {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  try {
    return parsed.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

function profileBlock(form: LetterForm): string {
  return [
    `Applicant: ${form.applicantName.trim() || 'not provided'}`,
    `Contact: ${[form.email, form.phone, form.location, form.linkedin].map((item) => item.trim()).filter(Boolean).join(' | ') || 'not provided'}`,
    `Education: ${[form.degree, form.university].filter(Boolean).join(' at ') || 'not provided'}`,
    `Skills: ${splitList(form.skills).join(', ') || 'not provided'}`,
    `Experience: ${form.experience.trim() || 'not provided'}`,
    `Projects: ${form.projects.trim() || 'not provided'}`,
    `Job requirements to address: ${form.requirements.filter(Boolean).join(' | ') || 'none supplied'}`,
  ].join('\n');
}

export function buildLetterPrompt(params: LetterPromptParams): string {
  const { form, language, mode, content, instruction } = params;

  const sharedRules = [
    `Write entirely in ${LANGUAGE_NAMES[language]}.`,
    'Do not invent names, employers, dates, metrics, certificates or achievements that are not in the supplied facts.',
    'Do not use placeholders such as [Company], TBD or Your Name.',
    'Plain text only — no markdown, no bullet symbols, no headings other than Subject:, no JSON escaped newlines inside the letter.',
    'Use this exact structure: sender name on line 1; contact line on line 2; blank line; date; blank line; recipient; company; blank line; Subject: line; blank line; salutation; blank line; body paragraphs separated by blank lines; closing; blank line; sender name.',
  ];

  if (mode === 'rewrite') {
    return [
      'You are an expert career letter editor. Rewrite the letter supplied by the user.',
      `Edit instruction: ${instruction ? REWRITE_INSTRUCTIONS[instruction] : 'Improve clarity and impact without changing facts.'}`,
      `Target language: ${LANGUAGE_NAMES[language]}. Keep the letter in that language.`,
      ...sharedRules,
      'Preserve the existing structure, the sender/recipient details and all factual claims.',
      '',
      'LETTER TO EDIT:',
      content?.slice(0, 8000) || '',
      '',
      'Return a single JSON object with only one key "letter" holding the complete rewritten letter as a plain-text string.',
    ].join('\n');
  }

  return [
    'You are a senior career coach who writes human-sounding, specific application letters. Write one complete letter.',
    `Letter type: ${KIND_NAMES[form.kind]}.`,
    `Tone: ${TONE_NAMES[form.tone]}.`,
    `Target company: ${form.company.trim() || 'Hiring Organization'}.`,
    `Target position: ${form.position.trim() || 'Target Position'}.`,
    `Recipient: ${form.recipient.trim() || 'Hiring Manager'}.`,
    'Date: use the date supplied below exactly as written.',
    form.date ? `Letter date: ${readableDate(form.date, language)}.` : 'Letter date: today.',
    '',
    'SUPPLIED FACTS (use only these):',
    profileBlock(form),
    '',
    ...sharedRules,
    form.kind === 'application' || form.kind === 'cover'
      ? 'Aim for 210-300 words in English (or a similar length in other languages): a focused opening, one evidence paragraph and one forward-looking close.'
      : 'Aim for 110-190 words in English (or a similar length in other languages): be brief, courteous and clear.',
    'Reference at least one supplied skill and one supplied requirement when both are available.',
    '',
    'Return a single JSON object with only one key "letter" holding the complete letter as a plain-text string.',
  ].join('\n');
}

/** Prompt used to turn a raw job posting into a short list of addressable requirements. */
export function buildRequirementsPrompt(posting: string, language: LanguageCode): string {
  return [
    `You are a career coach reading a job posting written in ${LANGUAGE_NAMES[language]}.`,
    'Extract the concrete skills, qualifications, tools and responsibilities a strong applicant should address.',
    'Rules:',
    '- Keep each item short (under 120 characters) and self-contained.',
    '- Do not invent requirements that are not in the posting.',
    '- Do not include benefits, salary, location, company boilerplate or application instructions.',
    '- Return at most 12 items.',
    '- Write each item in the same language as the posting.',
    '',
    'Return ONLY a JSON object with this exact shape: {"requirements": ["item one", "item two"]}',
    '',
    'JOB POSTING:',
    posting.slice(0, 12000),
  ].join('\n');
}

/** Normalizes a provider response into a clean requirement list, with a plain-text fallback. */
export function sanitizeRequirementsResult(raw: string): string[] {
  let text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) return [];

  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenced) text = fenced[1].trim();

  let values: unknown[] = [];

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      values = parsed;
    } else if (parsed && typeof parsed === 'object') {
      const candidate = (parsed as { requirements?: unknown; items?: unknown }).requirements
        ?? (parsed as { items?: unknown }).items;
      if (Array.isArray(candidate)) values = candidate;
    }
  } catch {
    // Fall back to one requirement per non-empty line below.
  }

  if (!values.length) {
    values = text
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*(?:[-*•–—]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);
  }

  return Array.from(
    new Set(
      values
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.replace(/^\s*[-*•–—]\s*/, '').replace(/\s+/g, ' ').trim())
        .filter((item) => item.length >= 5 && item.length <= 160)
        .map((item) => item.replace(/[.;,]+$/, '')),
    ),
  ).slice(0, 12);
}

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    // Some free models emit raw newlines inside JSON strings, which is invalid JSON.
    return value.replace(/\\(["\\nrt])/g, (_match, char: string) => {
      if (char === 'n') return '\n';
      if (char === 'r') return '';
      if (char === 't') return '\t';
      return char;
    });
  }
}

function letterFromParsed(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const object = value as Record<string, unknown>;
  for (const key of ['letter', 'content', 'text']) {
    const candidate = object[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return null;
}

function parseLetterEnvelope(text: string): string | null {
  const candidates = [text];
  const firstObject = text.indexOf('{');
  const lastObject = text.lastIndexOf('}');
  if (firstObject !== -1 && lastObject > firstObject) {
    candidates.push(text.slice(firstObject, lastObject + 1));
  }
  for (const candidate of candidates) {
    try {
      const letter = letterFromParsed(JSON.parse(candidate) as unknown);
      if (letter) return letter;
    } catch {
      // Try the next candidate (or the regex fallback below).
    }
  }

  // Recover a "letter" field even when the model produced malformed JSON.
  const field = text.match(/"letter"\s*:\s*"((?:\\.|[^"\\])*)"/i);
  return field ? decodeJsonString(field[1]).trim() || null : null;
}

/** Normalizes any provider response (JSON envelope, fenced text or raw letter) to plain letter text. */
export function sanitizeLetterResult(raw: string): string {
  let text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) return '';

  // Code fences can have any language tag, including `json`.
  const fenced = text.match(/^```[a-zA-Z0-9_-]*\s*([\s\S]*?)```\s*$/);
  if (fenced) text = fenced[1].trim();

  // Some models print the language name instead of a fenced block.
  text = text.replace(/^\s*json\s*(?=[{\[])/i, '').trim();

  const envelope = parseLetterEnvelope(text);
  if (envelope) text = envelope;

  if (/^["']{1}[\s\S]*["']{1}$/.test(text)) {
    text = decodeJsonString(text.slice(1, -1)).trim();
  }

  text = text
    .replace(/^(Here is|Sure[,!]?|Of course[,!]?|Below is|Certainly[,!]?)[^\n]*\n+/i, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text.slice(0, 8000);
}
