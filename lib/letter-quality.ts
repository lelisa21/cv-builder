import type { LetterForm, LetterQuality, QualityCheck, QualitySuggestion } from '@/types/letters';
import { splitList } from '@/lib/letter-engine';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'your', 'you', 'are',
  'will', 'our', 'their', 'who', 'what', 'when', 'where', 'which', 'about', 'into',
  'strong', 'good', 'work', 'years', 'year', 'ability', 'knowledge', 'skills', 'skill',
  'required', 'preferred', 'must', 'should', 'including', 'experience', 'candidate',
  'applicant', 'applicants', 'team', 'role', 'position', 'company', 'degree', 'opportunity',
]);

const SALUTATION = /^(?:dear|hello|hi|respected|to whom|kabajamoo|የተከበራችሁ)(?=\s|$|[,፣])/im;
// Ethiopic letters use "፡" where English letters use ":".
const SUBJECT = /^(subject|re:|dhimmi|ጉዳዩ)\s*[:፡]/im;
const CLOSING = /^(?:yours sincerely|sincerely yours|yours faithfully|yours truly|best wishes|warm wishes|kind wishes|sincerely|warm regards|best regards|kind regards|regards|respectfully|with appreciation|galatoomaa|kabajaan|ከሰላምታ(?: ጋር)?|በአክብሮት)(?=\s|$|[,،፣።])/im;
const PLACEHOLDER = /\[[^\]\n]{1,80}\]|\b(?:TBD|TODO|XXX+|N\/A|Your Name|yourname@example\.com)\b/i;
const SENTENCE_SPLIT = /(?<=[.!?።])\s+/u;

function words(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
}

function tokens(text: string): Set<string> {
  return new Set(
    words(text)
      .map((word) => word.toLowerCase())
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word)),
  );
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function requirementMatches(
  requirement: string,
  letterLower: string,
  letterTokens: Set<string>,
  evidenceLower: string,
  evidenceTokens: Set<string>,
): boolean {
  const cleaned = requirement.replace(/^\s*[-*•\d.)]+\s*/, '').trim();
  if (cleaned.length < 4) return true;
  const needle = cleaned.toLowerCase();
  if (letterLower.includes(needle) || evidenceLower.includes(needle)) return true;

  const required = tokens(cleaned);
  if (required.size === 0) return true;
  let hits = 0;
  required.forEach((token) => {
    if (letterTokens.has(token) || evidenceTokens.has(token)) hits += 1;
  });
  return hits / required.size >= 0.5;
}

function scoreRange(value: number, low: number, high: number): number {
  if (value >= low && value <= high) return 100;
  const distance = value < low ? low - value : value - high;
  return clamp(100 - distance * 3);
}

/** Live, explainable quality analysis of a letter, tailored to the target role. */
export function analyzeLetter(content: string, form: LetterForm): LetterQuality {
  const text = content.trim();
  const wordList = words(text);
  const wordCount = wordList.length;
  const charCount = text.length;
  const letterLower = text.toLowerCase();
  const letterTokens = tokens(text);
  // Requirements are usually written in English even when the letter is not.
  // The form evidence is therefore a fair second source for coverage checks.
  const evidenceText = [
    form.skills,
    form.experience,
    form.projects,
    form.degree,
    form.university,
    form.position,
    form.company,
  ].filter(Boolean).join(' ');
  const evidenceLower = evidenceText.toLowerCase();
  const evidenceTokens = tokens(evidenceText);

  const paragraphs = text
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sentences = text
    .split(SENTENCE_SPLIT)
    .map((sentence) => sentence.trim())
    .filter((sentence) => words(sentence).length > 2);
  const avgSentenceLength = sentences.length
    ? Math.round(wordCount / sentences.length)
    : 0;
  const longestSentence = sentences.reduce((longest, sentence) => Math.max(longest, words(sentence).length), 0);
  const hasPlaceholder = PLACEHOLDER.test(text);
  const normalizedName = form.applicantName.trim().toLowerCase();
  const normalizedCompany = form.company.trim().toLowerCase();
  const normalizedPosition = form.position.trim().toLowerCase();

  const checks: QualityCheck[] = [
    { key: 'checkSalutation', passed: SALUTATION.test(text), fix: 'salutation' },
    { key: 'checkSubject', passed: SUBJECT.test(text), fix: 'subject' },
    { key: 'checkClosing', passed: CLOSING.test(text), fix: 'closing' },
    { key: 'checkContact', passed: text.length > 0 && /@|\+?\d/.test(text) },
    { key: 'checkCompany', passed: Boolean(normalizedCompany) && letterLower.includes(normalizedCompany) },
    { key: 'checkPlaceholders', passed: !hasPlaceholder, fix: 'placeholders' },
    { key: 'checkParagraphs', passed: paragraphs.length >= 3 },
  ];

  const requirements = form.requirements.map((item) => item.trim()).filter(Boolean);
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  requirements.forEach((requirement) => {
    if (requirementMatches(requirement, letterLower, letterTokens, evidenceLower, evidenceTokens)) {
      matchedKeywords.push(requirement);
    } else {
      missingKeywords.push(requirement);
    }
  });

  const personalChecks = [
    Boolean(normalizedName) && letterLower.includes(normalizedName),
    Boolean(normalizedPosition) && letterLower.includes(normalizedPosition),
    Boolean(normalizedCompany) && letterLower.includes(normalizedCompany),
    [form.degree, form.university, form.projects, ...splitList(form.skills)]
      .filter(Boolean)
      .some((item) => letterLower.includes(item.toLowerCase().slice(0, 18))),
  ];
  const personal = Math.round((personalChecks.filter(Boolean).length / personalChecks.length) * 100);

  const structure = clamp(
    (checks.find((check) => check.key === 'checkSalutation')?.passed ? 24 : 0) +
    (checks.find((check) => check.key === 'checkSubject')?.passed ? 16 : 0) +
    (checks.find((check) => check.key === 'checkClosing')?.passed ? 20 : 0) +
    (checks.find((check) => check.key === 'checkParagraphs')?.passed ? 20 : 0) +
    (checks.find((check) => check.key === 'checkContact')?.passed ? 20 : 0),
  );

  const coverage = requirements.length
    ? Math.round((matchedKeywords.length / requirements.length) * 100)
    : 82;

  const clarity = clamp(
    (hasPlaceholder ? 0 : 30) +
    scoreRange(avgSentenceLength, 10, 24) * 0.35 +
    (longestSentence <= 38 ? 25 : Math.max(0, 25 - (longestSentence - 38) * 2)) +
    (paragraphs.every((paragraph) => words(paragraph).length <= 130) ? 10 : 0),
  );

  const isFollowUp = form.kind === 'followup' || form.kind === 'inquiry';
  const isAmharic = /[\u1200-\u137F]/.test(text);
  const isOromo = /\b(?:iyyannoo|kabajamoo|galatoomaa|dhaabbata|ogummaa)\b/i.test(text);
  // Ethiopic script packs more meaning into fewer space-delimited words, and
  // Oromo letters are naturally more concise than the English templates.
  const idealLow = isFollowUp ? 70 : isAmharic ? 90 : isOromo ? 100 : 170;
  const idealHigh = isFollowUp ? 200 : isAmharic ? 230 : isOromo ? 270 : 360;
  const length = text ? scoreRange(wordCount, idealLow, idealHigh) : 0;

  const score = text
    ? Math.round(structure * 0.24 + personal * 0.2 + coverage * 0.26 + clarity * 0.2 + length * 0.1)
    : 0;

  const suggestions: QualitySuggestion[] = [];
  if (!checks.find((check) => check.key === 'checkSubject')?.passed) suggestions.push({ key: 'suggestAddSubject' });
  if (!checks.find((check) => check.key === 'checkSalutation')?.passed) suggestions.push({ key: 'suggestAddSalutation' });
  if (!checks.find((check) => check.key === 'checkClosing')?.passed) suggestions.push({ key: 'suggestAddClosing' });
  if (hasPlaceholder) suggestions.push({ key: 'suggestRemovePlaceholders' });
  if (missingKeywords.length) {
    suggestions.push({ key: 'suggestCoverKeyword', value: missingKeywords[0].slice(0, 90) });
  }
  if (wordCount > idealHigh) suggestions.push({ key: 'suggestShorten' });
  if (wordCount > 0 && wordCount < idealLow) suggestions.push({ key: 'suggestExpand' });
  if (personal < 70) suggestions.push({ key: 'suggestSpecifics' });

  return {
    score,
    subscores: {
      structure: text ? structure : 0,
      personal: text ? personal : 0,
      coverage: text ? coverage : 0,
      clarity: text ? clarity : 0,
      length,
    },
    checks,
    matchedKeywords,
    missingKeywords,
    suggestions: suggestions.slice(0, 5),
    wordCount,
    charCount,
    readingMinutes: wordCount ? Math.max(1, Math.round(wordCount / 180)) : 0,
    sentenceCount: sentences.length,
    avgSentenceLength,
    pageEstimate: Math.max(1, Math.ceil(wordCount / 450)),
  };
}

export function qualityTone(score: number): 'good' | 'mid' | 'bad' {
  if (score >= 78) return 'good';
  if (score >= 50) return 'mid';
  return 'bad';
}
