import type {
  ColorConfig,
  DesignConfig,
  LayoutConfig,
  PageFormat,
  PageOrientation,
  ResumeSection,
  TemplatePreset,
  TypographyConfig,
} from './types';

const BASE_LAYOUT: LayoutConfig = {
  columns: 'single',
  asideWidth: 30,
  marginX: 56,
  marginY: 54,
  gap: 26,
  sectionGap: 24,
  itemGap: 11,
  headerStyle: 'split',
  headerRule: true,
  sectionStyle: 'rule',
  divider: 'line',
  density: 'balanced',
  numberedSections: false,
  showPageNumbers: true,
  showIcons: false,
  asideTone: 'tint',
  asideRadius: 0,
  photoEnabled: false,
  photoShape: 'circle',
  photoSize: 84,
};

const BASE_TYPE: TypographyConfig = {
  displayFont: 'instrument',
  bodyFont: 'manrope',
  nameSize: 44,
  headingSize: 11,
  bodySize: 10,
  lineHeight: 1.5,
  nameTracking: 0,
  headingTracking: 1.4,
  headingCase: 'upper',
  nameCase: 'title',
};

const BASE_COLOR: ColorConfig = {
  accent: '#b34a2b',
  ink: '#1d1a15',
  muted: '#6e675c',
  paper: '#fbf8f1',
  aside: '#f2ece0',
  asideInk: '#1d1a15',
};

const BASE_DESIGN: DesignConfig = {
  templateId: 'atelier',
  page: { format: 'a4', orientation: 'portrait' },
  layout: BASE_LAYOUT,
  type: BASE_TYPE,
  color: BASE_COLOR,
};

/** Deep-partial helper that keeps template definitions readable. */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function makeDesign(overrides: DeepPartial<DesignConfig> = {}): DesignConfig {
  return {
    templateId: overrides.templateId ?? 'custom',
    page: {
      format: (overrides.page?.format as PageFormat) ?? BASE_DESIGN.page.format,
      orientation: (overrides.page?.orientation as PageOrientation) ?? BASE_DESIGN.page.orientation,
    },
    layout: { ...BASE_LAYOUT, ...(overrides.layout as Partial<LayoutConfig> | undefined) },
    type: { ...BASE_TYPE, ...(overrides.type as Partial<TypographyConfig> | undefined) },
    color: { ...BASE_COLOR, ...(overrides.color as Partial<ColorConfig> | undefined) },
  };
}

export const TEMPLATES: TemplatePreset[] = [
  {
    id: 'atelier',
    name: 'Atelier',
    tagline: 'Editorial calm',
    description:
      'A warm, typographic single-column page with generous air, literary display type and quiet rules.',
    category: 'Editorial',
    tags: ['Single column', 'Serif display', 'Warm paper'],
    swatches: ['#b34a2b', '#1d1a15', '#fbf8f1', '#f2ece0'],
    design: makeDesign({
      templateId: 'atelier',
      color: {
        accent: '#b34a2b',
        ink: '#1d1a15',
        muted: '#6e675c',
        paper: '#fbf8f1',
        aside: '#f2ece0',
        asideInk: '#1d1a15',
      },
      type: {
        displayFont: 'instrument',
        bodyFont: 'manrope',
        nameSize: 50,
        headingSize: 10.5,
        bodySize: 10.2,
        lineHeight: 1.55,
        nameTracking: -0.2,
        headingTracking: 1.8,
        headingCase: 'upper',
        nameCase: 'title',
      },
      layout: {
        columns: 'single',
        marginX: 64,
        marginY: 58,
        sectionGap: 27,
        itemGap: 12,
        headerStyle: 'split',
        headerRule: true,
        sectionStyle: 'rule',
        divider: 'line',
        numberedSections: false,
        showIcons: false,
      },
    }),
  },
  {
    id: 'meridian',
    name: 'Meridian',
    tagline: 'Swiss precision',
    description:
      'An asymmetric sidebar grid with numbered sections, a disciplined grotesk and a measured vermilion accent.',
    category: 'Modern',
    tags: ['Two column', 'Numbered', 'Grid'],
    swatches: ['#cf3f1f', '#161616', '#ffffff', '#f2f1ec'],
    design: makeDesign({
      templateId: 'meridian',
      color: {
        accent: '#cf3f1f',
        ink: '#161616',
        muted: '#6b6b66',
        paper: '#ffffff',
        aside: '#f2f1ec',
        asideInk: '#24231f',
      },
      type: {
        displayFont: 'grotesk',
        bodyFont: 'dmsans',
        nameSize: 38,
        headingSize: 10.5,
        bodySize: 9.8,
        lineHeight: 1.46,
        nameTracking: -0.6,
        headingTracking: 1.5,
        headingCase: 'upper',
        nameCase: 'title',
      },
      layout: {
        columns: 'aside-left',
        asideWidth: 31,
        marginX: 44,
        marginY: 44,
        gap: 27,
        sectionGap: 23,
        itemGap: 10,
        headerStyle: 'split',
        headerRule: true,
        sectionStyle: 'accent',
        divider: 'none',
        numberedSections: true,
        showIcons: true,
        asideTone: 'tint',
        photoEnabled: false,
      },
    }),
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Gallery modern',
    description:
      'A confident dark rail, luminous sans typography and a portrait-led header for creative and product roles.',
    category: 'Creative',
    tags: ['Dark sidebar', 'Portrait', 'Bold'],
    swatches: ['#3157e8', '#17181c', '#ffffff', '#f3f2ec'],
    design: makeDesign({
      templateId: 'studio',
      color: {
        accent: '#3157e8',
        ink: '#18181c',
        muted: '#6f7076',
        paper: '#ffffff',
        aside: '#17181c',
        asideInk: '#f3f2ec',
      },
      type: {
        displayFont: 'sora',
        bodyFont: 'manrope',
        nameSize: 40,
        headingSize: 10.5,
        bodySize: 9.9,
        lineHeight: 1.5,
        nameTracking: -0.4,
        headingTracking: 1.6,
        headingCase: 'upper',
        nameCase: 'upper',
      },
      layout: {
        columns: 'aside-left',
        asideWidth: 30,
        marginX: 42,
        marginY: 42,
        gap: 28,
        sectionGap: 25,
        itemGap: 11,
        headerStyle: 'split',
        headerRule: false,
        sectionStyle: 'accent',
        divider: 'none',
        numberedSections: false,
        showIcons: true,
        asideTone: 'ink',
        photoEnabled: true,
        photoShape: 'circle',
        photoSize: 88,
      },
    }),
  },
  {
    id: 'parchment',
    name: 'Parchment',
    tagline: 'Academic poise',
    description:
      'A centred, bookish composition for research, academia and public-sector applications. Quietly authoritative.',
    category: 'Academic',
    tags: ['Centered', 'All serif', 'Classic'],
    swatches: ['#8a6432', '#1e1c18', '#fffdf6', '#f2ecdf'],
    design: makeDesign({
      templateId: 'parchment',
      color: {
        accent: '#8a6432',
        ink: '#1e1c18',
        muted: '#756e60',
        paper: '#fffdf6',
        aside: '#f2ecdf',
        asideInk: '#1e1c18',
      },
      type: {
        displayFont: 'newsreader',
        bodyFont: 'newsreader',
        nameSize: 42,
        headingSize: 10.5,
        bodySize: 10.2,
        lineHeight: 1.58,
        nameTracking: 0.2,
        headingTracking: 1.6,
        headingCase: 'upper',
        nameCase: 'title',
      },
      layout: {
        columns: 'single',
        marginX: 68,
        marginY: 62,
        sectionGap: 25,
        itemGap: 11,
        headerStyle: 'centered',
        headerRule: true,
        sectionStyle: 'rule',
        divider: 'dotted',
        numberedSections: false,
        showIcons: false,
        showPageNumbers: true,
      },
    }),
  },
  {
    id: 'signal',
    name: 'Signal',
    tagline: 'Quietly technical',
    description:
      'A compact, ATS-minded system with a right-hand facts rail, numbered sections and high signal-to-noise.',
    category: 'Technical',
    tags: ['ATS-first', 'Compact', 'Facts rail'],
    swatches: ['#0f6b50', '#141917', '#fbfbfa', '#edf2ee'],
    design: makeDesign({
      templateId: 'signal',
      color: {
        accent: '#0f6b50',
        ink: '#141917',
        muted: '#66706b',
        paper: '#fbfbfa',
        aside: '#edf2ee',
        asideInk: '#26312b',
      },
      type: {
        displayFont: 'grotesk',
        bodyFont: 'dmsans',
        nameSize: 35,
        headingSize: 10,
        bodySize: 9.4,
        lineHeight: 1.43,
        nameTracking: 0.4,
        headingTracking: 1.7,
        headingCase: 'upper',
        nameCase: 'upper',
      },
      layout: {
        columns: 'aside-right',
        asideWidth: 28,
        marginX: 44,
        marginY: 42,
        gap: 24,
        sectionGap: 19,
        itemGap: 8,
        headerStyle: 'compact',
        headerRule: true,
        sectionStyle: 'lane',
        divider: 'line',
        density: 'compact',
        numberedSections: true,
        showIcons: false,
        asideTone: 'tint',
        photoEnabled: false,
      },
    }),
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    tagline: 'Type as structure',
    description:
      'A poster-like composition with a full-bleed title banner, oversized display type and colour-coded lanes.',
    category: 'Creative',
    tags: ['Banner', 'Expressive', 'Poster'],
    swatches: ['#e23b2e', '#17161a', '#fdf7ec', '#f4e7d6'],
    design: makeDesign({
      templateId: 'bauhaus',
      color: {
        accent: '#e23b2e',
        ink: '#17161a',
        muted: '#6d675c',
        paper: '#fdf7ec',
        aside: '#f4e7d6',
        asideInk: '#17161a',
      },
      type: {
        displayFont: 'playfair',
        bodyFont: 'sora',
        nameSize: 54,
        headingSize: 11,
        bodySize: 9.9,
        lineHeight: 1.48,
        nameTracking: 0.6,
        headingTracking: 1.8,
        headingCase: 'upper',
        nameCase: 'upper',
      },
      layout: {
        columns: 'single',
        marginX: 52,
        marginY: 48,
        sectionGap: 27,
        itemGap: 12,
        headerStyle: 'banner',
        headerRule: false,
        sectionStyle: 'lane',
        divider: 'none',
        numberedSections: true,
        showIcons: false,
        showPageNumbers: true,
      },
    }),
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];

export function getTemplate(id: string | undefined | null): TemplatePreset {
  return TEMPLATES.find((template) => template.id === id) || DEFAULT_TEMPLATE;
}

export function cloneDesign(design: DesignConfig): DesignConfig {
  return {
    ...design,
    page: { ...design.page },
    layout: { ...design.layout },
    type: { ...design.type },
    color: { ...design.color },
  };
}

export function designForTemplate(id: string): DesignConfig {
  return cloneDesign(getTemplate(id).design);
}

/** Legacy template ids from the classic builder map onto the nearest preset. */
export function mapLegacyTemplateId(id: string | null): string | null {
  if (!id) return null;
  const direct = TEMPLATES.find((template) => template.id === id);
  if (direct) return direct.id;
  const map: Record<string, string> = {
    'modern-executive': 'studio',
    'navy-professional': 'meridian',
    'slate-timeline': 'studio',
    'academic-graduate': 'parchment',
    'minimal-ats': 'signal',
    'creative-bold': 'bauhaus',
    'editorial-serif': 'atelier',
  };
  return map[id] || null;
}

/**
 * Assigns aside-friendly sections to the rail when a two-column template is
 * applied. Content is never destroyed — only its column assignment changes.
 */
export function balanceSectionColumns(
  sections: ResumeSection[],
  design: DesignConfig,
): ResumeSection[] {
  if (design.layout.columns === 'single') {
    return sections.map((section) => ({ ...section, column: 'main' }));
  }
  const asideKinds = new Set(['skills', 'languages', 'links', 'certifications']);
  return sections.map((section) => ({
    ...section,
    column: asideKinds.has(section.kind) ? 'aside' : 'main',
  }));
}
