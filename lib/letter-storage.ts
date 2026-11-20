import type { LetterDraft } from '@/types/letters';

const DRAFTS_KEY = 'BikatTechcv_letter_drafts_v1';
const ACTIVE_KEY = 'BikatTechcv_letter_active_v1';

const KINDS = new Set(['application', 'cover', 'followup', 'inquiry']);
const TONES = new Set(['professional', 'fresh-graduate', 'modern', 'confident']);
const PAPERS = new Set(['classic', 'modern', 'minimal', 'executive']);
const LANGUAGES = new Set(['en', 'om', 'am']);

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode / quota) — the studio still works in memory.
  }
}

export function normalizeLetterDraft(value: unknown): LetterDraft | null {
  if (!value || typeof value !== 'object') return null;
  const draft = value as Partial<LetterDraft>;
  if (!draft.id || !draft.form || typeof draft.form !== 'object') return null;

  const form = draft.form;
  const normalizedForm = {
    ...form,
    kind: KINDS.has(form.kind) ? form.kind : 'application',
    tone: TONES.has(form.tone) ? form.tone : 'professional',
    requirements: Array.isArray(form.requirements)
      ? form.requirements.filter((item): item is string => typeof item === 'string')
      : [],
    jobPosting: typeof form.jobPosting === 'string' ? form.jobPosting : '',
    includeDate: form.includeDate !== false,
    date: typeof form.date === 'string' ? form.date : '',
  };

  return {
    id: draft.id,
    title: typeof draft.title === 'string' ? draft.title : 'Untitled letter',
    form: normalizedForm as LetterDraft['form'],
    content: typeof draft.content === 'string' ? draft.content : '',
    language: LANGUAGES.has(draft.language || '') ? (draft.language as LetterDraft['language']) : 'en',
    paper: PAPERS.has(draft.paper || '') ? (draft.paper as LetterDraft['paper']) : 'classic',
    font: draft.font === 'sans' ? 'sans' : 'serif',
    accent: typeof draft.accent === 'string' ? draft.accent : '#0c3b74',
    fontSize: typeof draft.fontSize === 'number' ? Math.min(14, Math.max(9, draft.fontSize)) : 11,
    align: draft.align === 'left' ? 'left' : 'justify',
    source:
      draft.source === 'openrouter' || draft.source === 'ai' || draft.source === 'puter'
        ? draft.source
        : 'local',
    updatedAt: typeof draft.updatedAt === 'string' ? draft.updatedAt : new Date().toISOString(),
  };
}

export function loadLetterDrafts(): LetterDraft[] {
  const stored = readJson<unknown>(DRAFTS_KEY);
  if (!Array.isArray(stored)) return [];
  return stored
    .map(normalizeLetterDraft)
    .filter((draft): draft is LetterDraft => Boolean(draft))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 40);
}

export function saveLetterDrafts(drafts: LetterDraft[]): void {
  writeJson(DRAFTS_KEY, drafts.slice(0, 40));
}

export function loadActiveLetterId(): string | null {
  const value = readJson<unknown>(ACTIVE_KEY);
  return typeof value === 'string' ? value : null;
}

export function saveActiveLetterId(id: string | null): void {
  writeJson(ACTIVE_KEY, id);
}

export function createLetterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `letter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
