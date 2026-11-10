import type {
  ResumeItem,
  ResumeSection,
  SectionColumn,
  SectionKind,
  SectionVariant,
} from './types';
import type { IconName } from '@/components/studio/Icon';

export interface SectionMeta {
  kind: SectionKind;
  title: string;
  description: string;
  icon: IconName;
  variant: SectionVariant;
  column: SectionColumn;
}

export const SECTION_META: SectionMeta[] = [
  {
    kind: 'summary',
    title: 'Profile',
    description: 'A short, evidence-led introduction.',
    icon: 'user',
    variant: 'stacked',
    column: 'main',
  },
  {
    kind: 'experience',
    title: 'Experience',
    description: 'Roles, outcomes and proof of impact.',
    icon: 'briefcase',
    variant: 'timeline',
    column: 'main',
  },
  {
    kind: 'education',
    title: 'Education',
    description: 'Degrees, institutions and honours.',
    icon: 'graduation',
    variant: 'timeline',
    column: 'main',
  },
  {
    kind: 'projects',
    title: 'Projects',
    description: 'Selected work, side projects and launches.',
    icon: 'folder',
    variant: 'stacked',
    column: 'main',
  },
  {
    kind: 'skills',
    title: 'Skills',
    description: 'Clustered capabilities and tools.',
    icon: 'tag',
    variant: 'tags',
    column: 'aside',
  },
  {
    kind: 'languages',
    title: 'Languages',
    description: 'Spoken languages and fluency.',
    icon: 'globe',
    variant: 'list',
    column: 'aside',
  },
  {
    kind: 'certifications',
    title: 'Certifications',
    description: 'Credentials, licences and courses.',
    icon: 'checkCircle',
    variant: 'list',
    column: 'aside',
  },
  {
    kind: 'awards',
    title: 'Awards',
    description: 'Recognition, prizes and honours.',
    icon: 'award',
    variant: 'list',
    column: 'main',
  },
  {
    kind: 'volunteering',
    title: 'Volunteering',
    description: 'Community and pro-bono contributions.',
    icon: 'heart',
    variant: 'timeline',
    column: 'main',
  },
  {
    kind: 'links',
    title: 'Links',
    description: 'Portfolio, writing and social profiles.',
    icon: 'external',
    variant: 'list',
    column: 'aside',
  },
  {
    kind: 'custom',
    title: 'Custom section',
    description: 'Anything else worth showing.',
    icon: 'layers',
    variant: 'stacked',
    column: 'main',
  },
];

export function metaForKind(kind: SectionKind): SectionMeta {
  return SECTION_META.find((meta) => meta.kind === kind) || SECTION_META[SECTION_META.length - 1];
}

export function iconForSection(section: ResumeSection): IconName {
  return metaForKind(section.kind).icon;
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function blankItem(kind: SectionKind): ResumeItem {
  const base: ResumeItem = {
    id: uid('item'),
    title: '',
    subtitle: '',
    location: '',
    period: '',
    description: '',
    bullets: [],
    tags: [],
    link: '',
  };

  switch (kind) {
    case 'summary':
      return { ...base, description: '' };
    case 'experience':
      return {
        ...base,
        title: 'Role title',
        subtitle: 'Company',
        period: '2024 — Present',
        bullets: ['Describe an outcome, not a duty. Start with a verb and add a number where you can.'],
      };
    case 'education':
      return {
        ...base,
        title: 'Degree',
        subtitle: 'Institution',
        period: '2019 — 2023',
      };
    case 'projects':
      return {
        ...base,
        title: 'Project name',
        subtitle: 'Independent',
        period: '2024',
        description: 'What it is and why it matters.',
        bullets: [],
      };
    case 'skills':
      return {
        ...base,
        title: 'Core',
        tags: ['Skill one', 'Skill two', 'Skill three'],
      };
    case 'languages':
      return { ...base, title: 'English', subtitle: 'Fluent' };
    case 'certifications':
      return { ...base, title: 'Certification', subtitle: 'Issuer', period: '2024' };
    case 'awards':
      return { ...base, title: 'Award name', subtitle: 'Organisation', period: '2024' };
    case 'links':
      return { ...base, title: 'Portfolio', link: 'your.site' };
    case 'volunteering':
      return {
        ...base,
        title: 'Volunteer role',
        subtitle: 'Organisation',
        period: '2023 — 2024',
      };
    default:
      return { ...base, title: 'Entry title', description: 'Add a short description.' };
  }
}

export function createSection(kind: SectionKind, overrides: Partial<ResumeSection> = {}): ResumeSection {
  const meta = metaForKind(kind);
  return {
    id: uid('sec'),
    kind,
    title: overrides.title || meta.title,
    visible: overrides.visible ?? true,
    column: overrides.column || meta.column,
    variant: overrides.variant || meta.variant,
    items: overrides.items || [blankItem(kind)],
    ...overrides,
  };
}

/** Sensible title when inserting a second section of the same kind. */
export function uniqueSectionTitle(sections: ResumeSection[], kind: SectionKind): string {
  const meta = metaForKind(kind);
  const existing = sections.filter((section) => section.kind === kind).length;
  return existing === 0 ? meta.title : `${meta.title} ${existing + 1}`;
}

export const VARIANT_OPTIONS: Array<{ value: SectionVariant; label: string }> = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'compact', label: 'Compact' },
  { value: 'grid', label: 'Grid' },
  { value: 'tags', label: 'Tags' },
  { value: 'list', label: 'List' },
];
