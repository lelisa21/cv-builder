import type { LanguageCode } from '@/types';

export type LetterKind = 'application' | 'cover' | 'followup' | 'inquiry';
export type LetterTone = 'professional' | 'fresh-graduate' | 'modern' | 'confident';
export type LetterPaper = 'classic' | 'modern' | 'minimal' | 'executive';
export type LetterFont = 'serif' | 'sans';
export type LetterSource = 'openrouter' | 'ai' | 'puter' | 'local';
export type LetterRewrite = 'shorten' | 'strengthen' | 'formal' | 'grammar' | 'tailor';

export interface LetterForm {
  kind: LetterKind;
  tone: LetterTone;
  applicantName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  company: string;
  position: string;
  recipient: string;
  degree: string;
  university: string;
  skills: string;
  experience: string;
  projects: string;
  requirements: string[];
  jobPosting: string;
  includeDate: boolean;
  date: string;
}

export interface LetterDraft {
  id: string;
  title: string;
  form: LetterForm;
  content: string;
  language: LanguageCode;
  paper: LetterPaper;
  font: LetterFont;
  accent: string;
  fontSize: number;
  align: 'left' | 'justify';
  source: LetterSource;
  updatedAt: string;
}

export type QualityFix = 'subject' | 'salutation' | 'closing' | 'placeholders';

export interface QualityCheck {
  key: string;
  passed: boolean;
  fix?: QualityFix;
}

export interface QualitySuggestion {
  key: string;
  value?: string;
}

export interface LetterQuality {
  score: number;
  subscores: {
    structure: number;
    personal: number;
    coverage: number;
    clarity: number;
    length: number;
  };
  checks: QualityCheck[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: QualitySuggestion[];
  wordCount: number;
  charCount: number;
  readingMinutes: number;
  sentenceCount: number;
  avgSentenceLength: number;
  pageEstimate: number;
}

export interface LetterExportOptions {
  paper?: LetterPaper;
  font?: LetterFont;
  accent?: string;
  fontSize?: number;
  align?: 'left' | 'justify';
  language?: LanguageCode;
}

export interface LetterBlocks {
  sender: string;
  contact: string;
  meta: string[];
  subject: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
  signature: string;
}
