import type { LanguageCode } from '@/types';
import type {
  LetterBlocks,
  LetterForm,
  LetterKind,
  LetterRewrite,
  QualityFix,
} from '@/types/letters';
import { aiService } from '@/services/ai';

export function splitList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,|\n•]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function extractRequirementsFromPosting(posting: string): string[] {
  const lines = posting
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•–—]|\d+[.)])\s*/, '').trim())
    .filter((line) => line.length >= 8);

  if (lines.length >= 2) {
    return Array.from(new Set(lines)).slice(0, 14);
  }

  return Array.from(
    new Set(
      posting
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.replace(/^\s*(?:[-*•]\s*)+/, '').trim())
        .filter((sentence) => sentence.length >= 10),
    ),
  ).slice(0, 14);
}

function formatDate(date: string, language: LanguageCode): string {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  const locale = language === 'am' ? 'am-ET' : 'en-US';
  try {
    return parsed.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

function swapGeneratedDate(letter: string, formatted: string): string {
  const generated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return formatted ? letter.replace(generated, formatted) : letter;
}

const KIND_SUBJECT: Record<LetterKind, string> = {
  application: 'Formal Application',
  cover: 'Cover Letter',
  followup: 'Follow-up on Application',
  inquiry: 'Inquiry about Opportunities',
};

function contactLine(form: LetterForm): string {
  return [form.email, form.phone, form.location, form.linkedin]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(' | ');
}

function composeLocal(form: LetterForm, language: LanguageCode): string {
  const name = form.applicantName.trim() || 'Applicant Name';
  const contact = contactLine(form);
  const date = form.includeDate ? formatDate(form.date, language) : '';
  const company = form.company.trim() || 'Hiring Organization';
  const position = form.position.trim() || 'Target Position';
  const recipient = form.recipient.trim() || 'Hiring Manager';
  const skills = splitList(form.skills).slice(0, 5).join(', ');
  const requirement = form.requirements.find((item) => item.trim())?.trim() || '';

  if (language === 'om') {
    const subject = form.kind === 'inquiry' ? `Gaaffii carraa hojii - ${position}` : form.kind === 'followup' ? `Hordoffii iyyannoo - ${position}` : `Iyyannoo hojii - ${position}`;
    return [
      name,
      contact,
      '',
      date ? `Guyyaa: ${date}` : '',
      '',
      `Gara: ${recipient}`,
      `Dhaabbata: ${company}`,
      '',
      `Dhimmi: ${subject}`,
      '',
      `Kabajamoo ${recipient},`,
      '',
      form.kind === 'followup'
        ? `Ani ${name} iyyannoo koo bakka hojii "${position}" dhaabbata keessan ${company} tiif dhiyeesseera. Haala isaa oguu hordofuuf barreeffama kana barreessaa jira.`
        : form.kind === 'inquiry'
          ? `Ani ${name} carraa hojii "${position}" dhaabbata keessan ${company} keessatti jiraachuuf laafii fi fedhii qaba. Yoo carraan jiraate maal akka ta'u naaf himuu gaafadha.`
          : `Ani maqaan koo ${name} jedhama. Bakka hojii "${position}" jedhu dhaabbata keessan ${company} keessatti iyyannoo koo dhiyeessera.`,
      '',
      skills ? `Ogummaa koo ${skills} fayyadamuun bu'aa qabatamaa fi guddina dhaabbata keessaniitiif gumaachuuf qophiidha.` : 'Barnootaa fi muuxannoo koo qabatamaan hojitti hiikuun galma keessaniitiif cimee hojjechuuf qophiidha.',
      form.experience ? `Muuxannoo koo ${form.experience} keessatti cimee hojjechuun dandeettii koo cimsaa jira.` : '',
      form.projects ? `Piroojektiiwwan koo ${form.projects} keessatti ga'umsaa fi ofiin dandeettii koo agarsiisaa jira.` : '',
      requirement ? `Ulaagalee hojii keessan kan ${requirement} jedhu uf cimsuuf qophii koo ibsuun barbaada.` : '',
      '',
      'Yeroo keessaniif galatoomaa, marii dabalataa taasisuuf qophii koon jira.',
      '',
      'Kabajaan,',
      name,
    ]
      .filter((line, index, all) => line !== '' || (all[index - 1] !== '' && all[index + 1] !== ''))
      .join('\n');
  }

  if (language === 'am') {
    const subject = form.kind === 'inquiry' ? `ስለ "${position}" የሥራ ዕድል መጠየቅ` : form.kind === 'followup' ? `ስለ "${position}" ማመልከቻ ክትትል` : `ለ"${position}" የሥራ ማመልከቻ`;
    return [
      name,
      contact,
      '',
      date ? `ቀን: ${date}` : '',
      '',
      `ለ: ${recipient}`,
      `ድርጅት: ${company}`,
      '',
      `ጉዳዩ፡ ${subject}`,
      '',
      `የተከበራችሁ ${recipient}፣`,
      '',
      form.kind === 'followup'
        ? `እኔ ${name} በድርጅታችሁ ${company} ውስጥ ለ"${position}" ያቀረብኩትን ማመልከቻ ሁኔታ ለማረጋገጥ ይህን ጽሁፍ አዘጋጅቻለሁ።`
        : form.kind === 'inquiry'
          ? `እኔ ${name} በድርጅታችሁ ${company} ውስጥ የ"${position}" ዕድል መኖሩን ለማወቅ ፍላጎት አለኝ። ዕድሉ ካለ ስለ ሁኔታው ልንገሩኝ ይበል የሚል ጥያቄ አቀርባለሁ።`
          : `እኔ ${name} በድርጅታችሁ ${company} ውስጥ ክፍት በሆነው የ"${position}" መደብ ላይ ለመቀጠር ያለኝን ፍላጎት በአክብሮት እገልጻለሁ።`,
      '',
      skills ? `ባሉኝ ${skills} ክህሎቶች ለድርጅታችሁ ግቦች መሳካት የበኩሌን አስተዋጽዖ ለማበርከት ዝግጁ ነኝ።` : 'ዕውቀቴንና ክህሎቴን በተግባር በማዋል ለድርጅታችሁ መሻሻል አስተዋጽዖ ለማድረግ ተነሳሽነት አለኝ።',
      form.experience ? `በ${form.experience} ውስጥ ያገኘሁት ልምድ ለዚህ ኃላፊነት እንደሚጠቅመኝ አምናለሁ።` : '',
      form.projects ? `በ${form.projects} ፕሮጀክቶች ላይ በመስራት ችግር መፍታት እና ቡድን ውስጥ መስራት ችሎታዬን አዳብሬያለሁ።` : '',
      requirement ? `በስራ ማስታወቂያው ላይ ከተጠቀሰው ${requirement} አንጻር ምን ማበርከት እንደምችል ማብራራት እፈልጋለሁ።` : '',
      '',
      'ለጊዜዎ አመሰግናለሁ፤ ስለ ማመልከቻዬ ለመወያየት ዝግጁ ነኝ።',
      '',
      'በአክብሮት፣',
      name,
    ]
      .filter((line, index, all) => line !== '' || (all[index - 1] !== '' && all[index + 1] !== ''))
      .join('\n');
  }

  const subject = `Subject: ${KIND_SUBJECT[form.kind]} — ${position}`;
  const opening =
    form.kind === 'followup'
      ? `I recently submitted my application for the ${position} role at ${company}, and I am writing to follow up respectfully on its status.`
      : form.kind === 'inquiry'
        ? `I am writing to inquire about opportunities for a ${position} at ${company}. I have long admired the work your team is doing and would welcome the chance to learn more about how my background could fit your needs.`
        : form.kind === 'cover'
          ? `I am writing to express my interest in the ${position} role at ${company} and to show how my background can help your team move forward.`
          : `Please accept this letter as my application for the ${position} position at ${company}.`;

  const evidence = [
    form.experience ? `My experience includes ${form.experience}, where I learned to deliver dependable work in a collaborative setting.` : '',
    form.projects ? `I have also worked on ${form.projects}, which taught me to turn requirements into practical, well-structured outcomes.` : '',
    form.degree || form.university
      ? `My academic background${form.degree ? ` in ${form.degree}` : ''}${form.university ? ` at ${form.university}` : ''} gave me a strong foundation for this work.`
      : '',
    skills ? `I would bring practical skills in ${skills} to the role.` : '',
    requirement ? `In particular, I am ready to address your requirement for ${requirement.toLowerCase()}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return [
    name,
    contact,
    '',
    date,
    '',
    recipient,
    company,
    '',
    subject,
    '',
    `Dear ${recipient},`,
    '',
    opening,
    '',
    evidence || 'I am confident that my discipline, curiosity, and willingness to learn would allow me to make a meaningful contribution.',
    '',
    form.kind === 'inquiry'
      ? 'I would value any guidance you can share about the application process or an upcoming opening. Thank you for your time and consideration.'
      : form.kind === 'followup'
        ? 'Please let me know if any additional details would help with your review. I would welcome the opportunity to discuss the role at your convenience.'
        : 'Thank you for your time and consideration. I would welcome the opportunity to discuss how I can contribute to your team.',
    '',
    'Sincerely,',
    name,
  ]
    .filter((line, index, all) => line !== '' || (all[index - 1] !== '' && all[index + 1] !== ''))
    .join('\n');
}

/** Builds a complete letter from the form. AI is preferred by the UI; this is the offline engine. */
export function composeLetter(form: LetterForm, language: LanguageCode): string {
  if (form.kind === 'application' || form.kind === 'cover') {
    try {
      const generated = aiService.generateHumanLetter({
        letterType: form.kind,
        tone: form.tone === 'confident' ? 'modern' : form.tone,
        language,
        company: form.company,
        position: form.position,
        recipient: form.recipient,
        applicantName: form.applicantName,
        email: form.email,
        phone: form.phone,
        location: form.location,
        degree: form.degree,
        university: form.university,
        skills: splitList(form.skills),
        experienceSummary: form.experience,
        keyProjects: form.projects,
        jobRequirements: form.requirements,
      });
      return swapGeneratedDate(generated, form.includeDate ? formatDate(form.date, language) : '');
    } catch {
      return composeLocal(form, language);
    }
  }

  return composeLocal(form, language);
}

const SALUTATION_RE = /^(?:dear|hello|hi|respected|to whom|kabajamoo|galatoomaa|የተከበራችሁ|ለእርስዎ)(?=\s|$|[,፣])/i;
const SUBJECT_RE = /^(?:subject|re:|dhimmi|ጉዳዩ)\s*[:፡]/i;
const CLOSING_RE = /^(?:yours sincerely|sincerely yours|yours faithfully|yours truly|best wishes|warm wishes|kind wishes|sincerely|warm regards|best regards|kind regards|regards|respectfully|with appreciation|galatoomaa|kabajaan|ከሰላምታ(?: ጋር)?|በአክብሮት)(?=\s|$|[,،፣።])/i;

function looksLikeContact(line: string): boolean {
  return /@|\+\s*\d|\d{3,}|https?:\/\//.test(line);
}

/** Splits a plain-text letter into the parts used by the styled preview and Word export. */
export function parseLetter(content: string): LetterBlocks {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const blocks: LetterBlocks = {
    sender: '',
    contact: '',
    meta: [],
    subject: '',
    salutation: '',
    paragraphs: [],
    closing: '',
    signature: '',
  };

  let index = 0;
  while (index < lines.length && !lines[index]) index += 1;
  if (index >= lines.length) return blocks;

  blocks.sender = lines[index];
  index += 1;
  if (index < lines.length && looksLikeContact(lines[index])) {
    blocks.contact = lines[index];
    index += 1;
  }

  while (index < lines.length && blocks.meta.length < 4) {
    const line = lines[index];
    if (!line) {
      index += 1;
      continue;
    }
    if (SUBJECT_RE.test(line) || SALUTATION_RE.test(line)) break;
    // Long prose before a salutation is body text, not letterhead metadata.
    if (blocks.meta.length > 0 && (line.length > 110 || /[.?!]$/.test(line))) break;
    blocks.meta.push(line);
    index += 1;
  }

  if (index < lines.length && SUBJECT_RE.test(lines[index])) {
    blocks.subject = lines[index];
    index += 1;
    while (index < lines.length && !lines[index]) index += 1;
  }
  if (index < lines.length && SALUTATION_RE.test(lines[index])) {
    blocks.salutation = lines[index];
    index += 1;
  }

  const remaining = lines.slice(index);
  const lastNonEmpty = remaining.reduce((last, line, i) => (line ? i : last), -1);
  if (isSignatureLine(remaining, lastNonEmpty)) {
    blocks.signature = remaining[lastNonEmpty];
  }
  const end = lastNonEmpty >= 0 && blocks.signature ? lastNonEmpty : remaining.length;
  let paragraph: string[] = [];

  for (let i = 0; i < end; i += 1) {
    const line = remaining[i];
    if (!line) {
      if (paragraph.length) {
        blocks.paragraphs.push(paragraph.join(' '));
        paragraph = [];
      }
      continue;
    }
    if (CLOSING_RE.test(line) && line.length <= 60) {
      if (paragraph.length) {
        blocks.paragraphs.push(paragraph.join(' '));
        paragraph = [];
      }
      blocks.closing = line;
      continue;
    }
    paragraph.push(line);
  }
  if (paragraph.length) blocks.paragraphs.push(paragraph.join(' '));

  return blocks;
}

function isSignatureLine(remaining: string[], last: number): boolean {
  if (last < 0) return false;
  const line = remaining[last];
  return line.length > 0 && line.length < 80 && !/[.?!]$/.test(line) && !CLOSING_RE.test(line);
}

export function renderBlocks(blocks: LetterBlocks): string {
  const parts = [blocks.sender];
  if (blocks.contact) parts.push(blocks.contact);
  parts.push(...blocks.meta);
  if (blocks.subject) parts.push(blocks.subject);
  if (blocks.salutation) parts.push(blocks.salutation);
  parts.push(...blocks.paragraphs);
  if (blocks.closing) parts.push(blocks.closing);
  if (blocks.signature) parts.push(blocks.signature);
  return parts.filter(Boolean).join('\n\n');
}

type RewriteInstruction = LetterRewrite;

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/** Deterministic rewrite used when no AI provider is reachable. */
export function rewriteLetterLocally(
  content: string,
  instruction: RewriteInstruction,
  form: LetterForm,
  language: LanguageCode,
): string {
  const blocks = parseLetter(content);
  const paragraphs = blocks.paragraphs.length
    ? [...blocks.paragraphs]
    : content.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);

  if (instruction === 'shorten') {
    const kept = paragraphs.slice(0, 2).map((paragraph, index) =>
      index === 1 ? sentences(paragraph).slice(0, 2).join(' ') : paragraph,
    );
    blocks.paragraphs = kept;
    return renderBlocks(blocks);
  }

  let rewritten = paragraphs.join('\n\n');

  if (instruction === 'grammar') {
    rewritten = rewritten
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .replace(/,{2,}/g, ',')
      .replace(/\.{2,}/g, '.')
      .split(/(?<=\.)\s+(?=[a-z])/g)
      .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1))
      .join(' ')
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => (/[.!?]$/.test(sentence) ? sentence : `${sentence}.`))
      .join(' ');
  }

  if (instruction === 'strengthen' && language === 'en') {
    rewritten = rewritten
      .replace(/\bI am writing to\b/gi, 'I am pleased to write to you')
      .replace(/\bI believe\b/gi, 'I am confident')
      .replace(/\bI think\b/gi, 'I am confident that')
      .replace(/\bI hope\b/gi, 'I look forward to the opportunity')
      .replace(/\bhopefully\b/gi, 'with confidence')
      .replace(/\bhopefully,/gi, 'With confidence,')
      .replace(/\bquite\b/gi, 'highly')
      .replace(/\bvery good\b/gi, 'excellent')
      .replace(/\btry to\b/gi, 'commit to');
  }

  if (instruction === 'formal' && language === 'en') {
    rewritten = rewritten
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bI'd\b/gi, 'I would')
      .replace(/\bI'm\b/gi, 'I am')
      .replace(/\bit's\b/gi, 'it is')
      .replace(/\bguys\b/gi, 'colleagues')
      .replace(/\ba lot\b/gi, 'significantly')
      .replace(/\bhey\b/gi, 'hello');
  }

  if (instruction === 'tailor') {
    const requirement = form.requirements.find((item) => item.trim())?.trim();
    const skill = splitList(form.skills)[0];
    if (requirement && language === 'en') {
      const sentence = skill
        ? `My hands-on experience with ${skill} directly supports your requirement for ${requirement.toLowerCase()}.`
        : `I am prepared to meet your requirement for ${requirement.toLowerCase()} from day one.`;
      if (!rewritten.toLowerCase().includes(requirement.toLowerCase().slice(0, 24))) {
        rewritten = `${rewritten.trim()} ${sentence}`;
      }
    }
  }

  blocks.paragraphs = rewritten.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  return renderBlocks(blocks);
}

/** Inserts or removes the structural elements flagged by the quality inspector. */
export function fixLetter(content: string, fix: QualityFix, form: LetterForm, language: LanguageCode): string {
  if (fix === 'placeholders') {
    return content
      .replace(/\[[^\]\n]{1,80}\]/g, '')
      .replace(/\b(?:TBD|TODO|XXX+|N\/A)\b/gi, '')
      .replace(/\bYour Name\b/gi, form.applicantName.trim() || 'Applicant Name')
      .replace(/yourname@example\.com/gi, form.email.trim())
      .replace(/[ \t]{2,}/g, ' ')
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  }

  const reference = parseLetter(composeLetter(form, language));
  const lines = content.split(/\r?\n/);
  const salutationIndex = lines.findIndex((line) => SALUTATION_RE.test(line.trim()));
  const insertAt = salutationIndex >= 0 ? salutationIndex : Math.min(lines.length, 8);

  if (fix === 'subject' && reference.subject) {
    lines.splice(insertAt, 0, '', reference.subject, '');
  } else if (fix === 'salutation' && reference.salutation) {
    lines.splice(insertAt, 0, reference.salutation, '');
  } else if (fix === 'closing' && reference.closing) {
    const closingIndex = lines.findIndex((line) => CLOSING_RE.test(line.trim()));
    if (closingIndex >= 0) {
      // Standardize an existing closing instead of stacking a second one.
      lines[closingIndex] = reference.closing;
    } else {
      const lastLine = lines.reduce((last, line, i) => (line.trim() ? i : last), -1);
      const at = lastLine >= 0 ? lastLine : lines.length;
      lines.splice(at, 0, reference.closing, '');
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
