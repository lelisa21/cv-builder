import type { QualityCheck, QualityReport, ResumeDocument } from './types';

const ACTION_VERBS = new Set([
  'led', 'built', 'created', 'designed', 'shipped', 'launched', 'grew', 'increased', 'reduced',
  'improved', 'delivered', 'owned', 'drove', 'managed', 'mentored', 'partnered', 'established',
  'introduced', 'rebuilt', 'redesigned', 'scaled', 'streamlined', 'transformed', 'developed',
  'implemented', 'directed', 'coordinated', 'produced', 'generated', 'negotiated', 'resolved',
  'automated', 'migrated', 'founded', 'secured', 'raised', 'cut', 'accelerated', 'unified',
  'crafted', 'facilitated', 'analysed', 'analyzed', 'researched', 'prototyped', 'tested',
]);

const WEAK_PHRASES = [
  'responsible for', 'worked on', 'helped with', 'assisted with', 'duties included',
  'participated in', 'involved in', 'tasked with',
];

const FLUFF = ['team player', 'hard worker', 'passionate', 'go-getter', 'think outside the box', 'detail-oriented'];

function words(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function allBullets(doc: ResumeDocument): Array<{ text: string; sectionId: string }> {
  return doc.sections.flatMap((section) =>
    section.items.flatMap((entry) => entry.bullets.map((text) => ({ text, sectionId: section.id }))),
  );
}

function sample<T>(values: T[], max: number): T[] {
  return values.slice(0, max);
}

export function analyzeQuality(doc: ResumeDocument, pageCount = 1): QualityReport {
  const checks: QualityCheck[] = [];
  const bullets = allBullets(doc);
  const visibleSections = doc.sections.filter((section) => section.visible);
  const experienceSections = visibleSections.filter((section) => section.kind === 'experience');
  const educationSections = visibleSections.filter((section) => section.kind === 'education');
  const skillsSections = visibleSections.filter((section) => section.kind === 'skills');
  const summarySection = visibleSections.find((section) => section.kind === 'summary');
  const summaryText = summarySection?.items.map((entry) => entry.description || '').join(' ') || '';
  const summaryWords = words(summaryText);
  const quantified = bullets.filter((bullet) => /\d/.test(bullet.text)).length;
  const quantifiedPct = bullets.length ? Math.round((quantified / bullets.length) * 100) : 0;

  const contactFields = [doc.basics.email, doc.basics.phone, doc.basics.location].filter(Boolean);
  checks.push({
    id: 'identity',
    label: 'Identity & contact',
    detail:
      contactFields.length >= 3
        ? 'Name, email, phone and location are ready for recruiters and ATS parsing.'
        : 'Add an email, phone number and location so recruiters can reach you.',
    status: doc.basics.name && contactFields.length >= 3 ? 'pass' : contactFields.length >= 2 ? 'warn' : 'fail',
    sectionId: 'basics',
    weight: 10,
  });

  checks.push({
    id: 'headline',
    label: 'Professional headline',
    detail: doc.basics.headline
      ? `“${doc.basics.headline}” gives the reader an immediate anchor.`
      : 'Add a short headline naming the role you want, not just your current title.',
    status: doc.basics.headline.trim().length >= 8 ? 'pass' : doc.basics.headline ? 'warn' : 'fail',
    sectionId: 'basics',
    weight: 7,
  });

  checks.push({
    id: 'links',
    label: 'Proof links',
    detail:
      doc.basics.website || doc.basics.linkedin
        ? 'A portfolio or LinkedIn link lets reviewers verify your work.'
        : 'Add a portfolio, personal site or LinkedIn profile.',
    status: doc.basics.website || doc.basics.linkedin ? 'pass' : 'warn',
    sectionId: 'basics',
    weight: 4,
  });

  let summaryStatus: QualityCheck['status'] = 'pass';
  let summaryDetail = 'A concise profile gives context before the timeline begins.';
  if (!summarySection) {
    summaryStatus = 'warn';
    summaryDetail = 'Add a short profile section to frame your experience.';
  } else if (summaryWords < 35) {
    summaryStatus = 'warn';
    summaryDetail = `Your profile is ${summaryWords} words. Aim for 45–90 words with a clear specialism and proof.`;
  } else if (summaryWords > 120) {
    summaryStatus = 'warn';
    summaryDetail = `Your profile is ${summaryWords} words. Tighten it to 45–90 words so the page breathes.`;
  }
  if (summaryStatus !== 'warn' && summarySection) {
    summaryDetail = `${summaryWords} words — a measured length that keeps the first screen scannable.`;
  }
  checks.push({
    id: 'summary',
    label: 'Profile narrative',
    detail: summaryDetail,
    status: summaryStatus,
    sectionId: summarySection?.id,
    weight: 9,
  });

  const experienceBulletCount = experienceSections.reduce(
    (total, section) => total + section.items.reduce((sum, entry) => sum + entry.bullets.length, 0),
    0,
  );
  checks.push({
    id: 'experience',
    label: 'Experience evidence',
    detail:
      experienceBulletCount >= 4
        ? `${experienceBulletCount} evidence-led bullets across your experience.`
        : 'Add at least two achievement bullets per role — outcomes beat responsibilities.',
    status: experienceBulletCount >= 4 ? 'pass' : experienceBulletCount >= 2 ? 'warn' : 'fail',
    sectionId: experienceSections[0]?.id,
    weight: 12,
  });

  checks.push({
    id: 'quantified',
    label: 'Quantified impact',
    detail:
      quantifiedPct >= 45
        ? `${quantifiedPct}% of bullets include a number, scale or measurable outcome.`
        : `Only ${quantifiedPct}% of bullets contain a metric. Add scale, %, time saved or revenue where possible.`,
    status: quantifiedPct >= 45 ? 'pass' : quantifiedPct >= 20 ? 'warn' : 'fail',
    sectionId: experienceSections[0]?.id,
    weight: 11,
  });

  const weakBullets = sample(
    bullets.filter((bullet) => WEAK_PHRASES.some((phrase) => bullet.text.toLowerCase().includes(phrase))),
    3,
  );
  checks.push({
    id: 'verbs',
    label: 'Strong openers',
    detail:
      weakBullets.length === 0
        ? 'Bullets open with action rather than duty.'
        : `Rewrite phrases like “${weakBullets[0].text.slice(0, 46)}…” to start with a verb and an outcome.`,
    status: weakBullets.length === 0 ? 'pass' : 'warn',
    sectionId: weakBullets[0]?.sectionId,
    weight: 7,
  });

  const passiveBullets = bullets.filter((bullet) => {
    const first = bullet.text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    return first ? !ACTION_VERBS.has(first) : false;
  });
  checks.push({
    id: 'verbs-opening',
    label: 'Action-verb coverage',
    detail:
      passiveBullets.length <= Math.max(1, Math.floor(bullets.length * 0.35))
        ? 'Most bullets begin with a decisive verb.'
        : `${passiveBullets.length} bullets start with a soft opener. Try “Led…”, “Built…”, “Reduced…”.`,
    status:
      bullets.length === 0
        ? 'warn'
        : passiveBullets.length <= Math.max(1, Math.floor(bullets.length * 0.35))
          ? 'pass'
          : 'warn',
    sectionId: experienceSections[0]?.id,
    weight: 5,
  });

  const longBullets = bullets.filter((bullet) => words(bullet.text) > 34);
  checks.push({
    id: 'bullet-length',
    label: 'Bullet rhythm',
    detail:
      longBullets.length === 0
        ? 'Bullets are short enough to scan in a six-second review.'
        : `${longBullets.length} bullet${longBullets.length > 1 ? 's are' : ' is'} longer than 34 words. Split the idea or cut filler.`,
    status: longBullets.length === 0 ? 'pass' : 'warn',
    sectionId: longBullets[0]?.sectionId,
    weight: 6,
  });

  const skillTags = skillsSections.reduce(
    (total, section) => total + section.items.reduce((sum, entry) => sum + entry.tags.length, 0),
    0,
  );
  checks.push({
    id: 'skills',
    label: 'Skill coverage',
    detail:
      skillTags >= 8
        ? `${skillTags} skills grouped into readable clusters.`
        : 'Group 8–16 relevant skills into 2–4 clusters so both people and parsers can scan them.',
    status: skillTags >= 8 ? 'pass' : skillTags >= 4 ? 'warn' : 'fail',
    sectionId: skillsSections[0]?.id,
    weight: 8,
  });

  const datedItems = visibleSections
    .filter((section) => ['experience', 'education'].includes(section.kind))
    .flatMap((section) => section.items);
  const missingDates = datedItems.filter((entry) => !entry.period?.trim());
  checks.push({
    id: 'dates',
    label: 'Timeline clarity',
    detail:
      datedItems.length > 0 && missingDates.length === 0
        ? 'Every role and qualification has a visible period.'
        : 'Add a date range to every role and qualification. Gaps invite doubt.',
    status: datedItems.length > 0 && missingDates.length === 0 ? 'pass' : 'warn',
    sectionId: experienceSections[0]?.id,
    weight: 6,
  });

  checks.push({
    id: 'education',
    label: 'Education',
    detail:
      educationSections.length > 0
        ? 'Education is present and easy to find.'
        : 'Add your highest qualification or a relevant certification.',
    status: educationSections.length > 0 ? 'pass' : 'warn',
    sectionId: educationSections[0]?.id,
    weight: 5,
  });

  const fluff = FLUFF.filter((phrase) =>
    JSON.stringify(doc).toLowerCase().includes(phrase),
  );
  checks.push({
    id: 'fluff',
    label: 'Signal, not filler',
    detail:
      fluff.length === 0
        ? 'No empty buzzwords detected.'
        : `Consider removing “${fluff[0]}” — replace it with evidence.`,
    status: fluff.length === 0 ? 'pass' : 'warn',
    sectionId: summarySection?.id,
    weight: 4,
  });

  checks.push({
    id: 'density',
    label: 'Page architecture',
    detail:
      pageCount <= 2
        ? `${pageCount} page${pageCount > 1 ? 's' : ''} — an appropriate length for most applications.`
        : `${pageCount} pages is long for a private-sector application. Cut older or duplicate evidence.`,
    status: pageCount <= 2 ? 'pass' : pageCount === 3 ? 'warn' : 'fail',
    sectionId: experienceSections[0]?.id,
    weight: 8,
  });

  checks.push({
    id: 'order',
    label: 'Narrative order',
    detail:
      visibleSections[0]?.kind === 'summary'
        ? 'The page opens with context before chronology.'
        : 'Lead with a short profile, then experience. Recruiters scan top-down.',
    status: visibleSections[0]?.kind === 'summary' ? 'pass' : 'warn',
    sectionId: visibleSections[0]?.id,
    weight: 5,
  });

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce(
    (sum, check) => sum + check.weight * (check.status === 'pass' ? 1 : check.status === 'warn' ? 0.55 : 0),
    0,
  );
  const score = Math.round((earned / totalWeight) * 100);

  const bulletWords = bullets.reduce((sum, bullet) => sum + words(bullet.text), 0);
  const descriptions = visibleSections.reduce(
    (sum, section) => sum + section.items.reduce((inner, entry) => inner + words(entry.description || ''), 0),
    0,
  );
  const totalWords =
    words(`${doc.basics.name} ${doc.basics.headline}`) +
    words(summaryText) +
    bulletWords +
    descriptions +
    visibleSections.reduce(
      (sum, section) => sum + section.items.reduce((inner, entry) => inner + words(entry.title || '') + words(entry.subtitle || ''), 0),
      0,
    );

  return {
    score,
    checks,
    stats: {
      words: totalWords,
      bullets: bullets.length,
      quantifiedBullets: quantified,
      sections: visibleSections.length,
      pages: pageCount,
      readingMinutes: Math.max(1, Math.round(totalWords / 220)),
    },
  };
}

/** Small deterministic writing coach used when no AI provider is configured. */
export function tightenBullet(text: string): string {
  let result = text.trim().replace(/\s+/g, ' ');
  for (const phrase of WEAK_PHRASES) {
    const pattern = new RegExp(`^${phrase}\\s+`, 'i');
    result = result.replace(pattern, '');
  }
  result = result.replace(/^(i|we)\s+/i, '');
  if (result && result[0]) result = result[0].toUpperCase() + result.slice(1);
  if (result && !/[.!?]$/.test(result)) result += '.';
  return result;
}

export function bulletOpenerAdvice(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of WEAK_PHRASES) {
    if (lower.startsWith(phrase) || lower.includes(phrase)) {
      return `Replace “${phrase}” with a verb such as “Led”, “Built” or “Reduced”.`;
    }
  }
  if (!/\d/.test(text)) return 'Add a number — scale, percentage, time saved or revenue.';
  if (sentences(text).length > 2) return 'Split this into two tighter bullets.';
  return null;
}
