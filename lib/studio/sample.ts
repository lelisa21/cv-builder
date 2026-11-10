import type { ResumeDocument, ResumeItem, ResumeSection, DesignConfig } from './types';
import { designForTemplate } from './templates';

const item = (
  id: string,
  data: Omit<Partial<ResumeItem>, 'id'>,
): ResumeItem => ({
  id,
  title: data.title || '',
  subtitle: data.subtitle || '',
  location: data.location || '',
  period: data.period || '',
  description: data.description || '',
  bullets: data.bullets || [],
  tags: data.tags || [],
  link: data.link || '',
});

export function sampleSections(): ResumeSection[] {
  return [
    {
      id: 'summary',
      kind: 'summary',
      title: 'Profile',
      visible: true,
      column: 'main',
      variant: 'stacked',
      items: [
        item('summary-1', {
          description:
            'Product designer with six years of experience turning complex financial and productivity products into clear, humane interfaces. I lead design systems work end-to-end — from research and service blueprints to shipped components — and care deeply about accessibility, craft, and measurable outcomes.',
        }),
      ],
    },
    {
      id: 'experience',
      kind: 'experience',
      title: 'Experience',
      visible: true,
      column: 'main',
      variant: 'timeline',
      items: [
        item('exp-1', {
          title: 'Senior Product Designer',
          subtitle: 'Orbit Labs',
          location: 'Remote',
          period: '2022 — Present',
          description:
            'Design lead for the core workspace used by 40k+ teams. Partner with two product squads and mentor a mid-level designer.',
          bullets: [
            'Rebuilt the navigation and command layer, lifting weekly task completion by 18% and reducing support tickets by 31%.',
            'Created “Orbit Foundations”, a 60-component design system now used by five squads and 28 engineers.',
            'Ran a quarterly research programme with 120+ participants, turning findings into a prioritised opportunity map.',
          ],
          tags: ['Design systems', 'Product strategy', 'Research'],
        }),
        item('exp-2', {
          title: 'Product Designer',
          subtitle: 'Kindred Studio',
          location: 'Addis Ababa',
          period: '2020 — 2022',
          description:
            'Sole designer on a fintech platform serving smallholder farmers and cooperatives across East Africa.',
          bullets: [
            'Designed an offline-first savings flow that increased activation by 24% across low-connectivity regions.',
            'Introduced a weekly usability cadence and shared Figma library, cutting design hand-off time in half.',
            'Shipped a bilingual onboarding experience in English and Amharic with a 92% task-success rate in testing.',
          ],
          tags: ['Fintech', 'Field research', 'Localisation'],
        }),
        item('exp-3', {
          title: 'Design Intern',
          subtitle: 'Atlas Bank',
          location: 'Addis Ababa',
          period: '2019 — 2020',
          description: '',
          bullets: [
            'Prototyped three concepts for a small-business dashboard; the selected direction shipped to 12,000 customers.',
            'Audited 40 legacy screens and documented accessibility issues that informed the bank’s first WCAG baseline.',
          ],
          tags: [],
        }),
      ],
    },
    {
      id: 'projects',
      kind: 'projects',
      title: 'Selected Projects',
      visible: true,
      column: 'main',
      variant: 'stacked',
      items: [
        item('project-1', {
          title: 'Ledger — open-source finance UI',
          subtitle: 'Independent',
          period: '2024',
          link: 'github.com/abebab/ledger-ui',
          description:
            'A composable React library for financial dashboards, built around accessible data visualisation.',
          bullets: [
            'Reached 2.8k GitHub stars and 14k monthly installs within eight months of release.',
          ],
          tags: ['React', 'TypeScript', 'Accessibility'],
        }),
        item('project-2', {
          title: 'Field Notes — research toolkit',
          subtitle: 'Kindred Studio',
          period: '2021',
          link: 'fieldnotes.studio',
          description:
            'A lightweight field-research kit for teams working in low-connectivity environments.',
          bullets: [],
          tags: ['Service design', 'Facilitation'],
        }),
      ],
    },
    {
      id: 'education',
      kind: 'education',
      title: 'Education',
      visible: true,
      column: 'main',
      variant: 'timeline',
      items: [
        item('edu-1', {
          title: 'BSc Software Engineering',
          subtitle: 'Addis Ababa University',
          location: 'Addis Ababa',
          period: '2016 — 2020',
          description: 'Graduated with distinction · GPA 3.8 / 4.0',
          bullets: [],
          tags: [],
        }),
      ],
    },
    {
      id: 'awards',
      kind: 'awards',
      title: 'Recognition',
      visible: true,
      column: 'main',
      variant: 'list',
      items: [
        item('award-1', {
          title: 'Red Dot Award — Brands & Communication',
          subtitle: 'Orbit Workspace',
          period: '2023',
        }),
        item('award-2', {
          title: 'Awwwards Honourable Mention',
          subtitle: 'Field Notes',
          period: '2022',
        }),
      ],
    },
    {
      id: 'skills',
      kind: 'skills',
      title: 'Capabilities',
      visible: true,
      column: 'aside',
      variant: 'tags',
      items: [
        item('skill-1', {
          title: 'Product',
          tags: ['Product strategy', 'Design systems', 'Prototyping', 'Research ops'],
        }),
        item('skill-2', {
          title: 'Tools',
          tags: ['Figma', 'Framer', 'Storybook', 'Linear'],
        }),
        item('skill-3', {
          title: 'Engineering',
          tags: ['HTML / CSS', 'React', 'TypeScript', 'WCAG'],
        }),
      ],
    },
    {
      id: 'languages',
      kind: 'languages',
      title: 'Languages',
      visible: true,
      column: 'aside',
      variant: 'list',
      items: [
        item('lang-1', { title: 'English', subtitle: 'Fluent' }),
        item('lang-2', { title: 'Amharic', subtitle: 'Native' }),
        item('lang-3', { title: 'French', subtitle: 'Conversational' }),
      ],
    },
    {
      id: 'certifications',
      kind: 'certifications',
      title: 'Certifications',
      visible: true,
      column: 'aside',
      variant: 'list',
      items: [
        item('cert-1', {
          title: 'Google UX Design',
          subtitle: 'Coursera',
          period: '2021',
        }),
        item('cert-2', {
          title: 'Accessibility Core Competencies',
          subtitle: 'IAAP',
          period: '2023',
        }),
      ],
    },
  ];
}

export function createSampleDocument(templateId = 'atelier'): ResumeDocument {
  return {
    version: 1,
    id: 'studio-sample',
    title: 'Abeba Kebede — Product Designer',
    updatedAt: new Date().toISOString(),
    basics: {
      name: 'Abeba Kebede',
      headline: 'Product Designer · Design Systems',
      email: 'abeba@bekele.design',
      phone: '+251 91 234 5678',
      location: 'Addis Ababa · Remote',
      website: 'bekele.design',
      linkedin: 'linkedin.com/in/abebabekele',
      photo: '',
      availability: 'Open to senior product design roles',
    },
    sections: sampleSections(),
    design: designForTemplate(templateId),
  };
}

export function createEmptyDocument(templateId = 'atelier'): ResumeDocument {
  return {
    version: 1,
    id: `resume-${Math.random().toString(36).slice(2, 10)}`,
    title: 'Untitled resume',
    updatedAt: new Date().toISOString(),
    basics: {
      name: 'Your Name',
      headline: 'Your professional headline',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      photo: '',
      availability: '',
    },
    sections: [
      {
        id: 'summary',
        kind: 'summary',
        title: 'Profile',
        visible: true,
        column: 'main',
        variant: 'stacked',
        items: [item('summary-1', { description: '' })],
      },
      {
        id: 'experience',
        kind: 'experience',
        title: 'Experience',
        visible: true,
        column: 'main',
        variant: 'timeline',
        items: [
          item('exp-1', {
            title: 'Role title',
            subtitle: 'Company',
            period: '2024 — Present',
            bullets: ['Describe an outcome, not a duty. Start with a verb and include a number where you can.'],
          }),
        ],
      },
      {
        id: 'education',
        kind: 'education',
        title: 'Education',
        visible: true,
        column: 'main',
        variant: 'timeline',
        items: [item('edu-1', { title: 'Degree', subtitle: 'Institution', period: '2019 — 2023' })],
      },
      {
        id: 'skills',
        kind: 'skills',
        title: 'Skills',
        visible: true,
        column: 'aside',
        variant: 'tags',
        items: [item('skill-1', { title: 'Core', tags: ['Skill one', 'Skill two', 'Skill three'] })],
      },
    ],
    design: designForTemplate(templateId),
  };
}

export function cloneDocument(doc: ResumeDocument): ResumeDocument {
  return {
    ...doc,
    basics: { ...doc.basics },
    sections: doc.sections.map((section) => ({
      ...section,
      items: section.items.map((entry) => ({
        ...entry,
        bullets: [...entry.bullets],
        tags: [...entry.tags],
      })),
    })),
    design: {
      ...doc.design,
      page: { ...doc.design.page },
      layout: { ...doc.design.layout },
      type: { ...doc.design.type },
      color: { ...doc.design.color },
    },
  };
}

export type { DesignConfig };
