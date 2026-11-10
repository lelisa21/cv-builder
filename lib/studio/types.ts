/**
 * Bikat Studio — canonical document model.
 *
 * A resume is intentionally data-first: the renderer, paginator, quality
 * engine and exporters all read from this single model. Templates are design
 * presets over the same structure, which is what makes deep customisation
 * possible without forking a new component per template.
 */

export type PageFormat = 'a4' | 'letter';
export type PageOrientation = 'portrait' | 'landscape';
export type ColumnMode = 'single' | 'aside-left' | 'aside-right';
export type SectionColumn = 'main' | 'aside';

export type SectionKind =
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'awards'
  | 'volunteering'
  | 'links'
  | 'custom';

export type SectionVariant = 'timeline' | 'stacked' | 'compact' | 'grid' | 'tags' | 'list';

export type FontKey =
  | 'instrument'
  | 'newsreader'
  | 'playfair'
  | 'manrope'
  | 'grotesk'
  | 'sora'
  | 'dmsans'
  | 'mono';

export type HeaderStyle = 'split' | 'centered' | 'banner' | 'compact';
export type SectionStyle = 'rule' | 'accent' | 'lane' | 'plain';
export type DividerStyle = 'line' | 'dotted' | 'none';
export type Density = 'compact' | 'balanced' | 'airy';

export interface ResumeBasics {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  photo?: string;
  availability?: string;
}

export interface ResumeItem {
  id: string;
  title?: string;
  subtitle?: string;
  location?: string;
  period?: string;
  description?: string;
  bullets: string[];
  tags: string[];
  link?: string;
}

export interface ResumeSection {
  id: string;
  kind: SectionKind;
  title: string;
  visible: boolean;
  column: SectionColumn;
  variant: SectionVariant;
  items: ResumeItem[];
}

export interface TypographyConfig {
  displayFont: FontKey;
  bodyFont: FontKey;
  nameSize: number;
  headingSize: number;
  bodySize: number;
  lineHeight: number;
  nameTracking: number;
  headingTracking: number;
  headingCase: 'upper' | 'title';
  nameCase: 'upper' | 'title';
}

export interface LayoutConfig {
  columns: ColumnMode;
  asideWidth: number;
  marginX: number;
  marginY: number;
  gap: number;
  sectionGap: number;
  itemGap: number;
  headerStyle: HeaderStyle;
  headerRule: boolean;
  sectionStyle: SectionStyle;
  divider: DividerStyle;
  density: Density;
  numberedSections: boolean;
  showPageNumbers: boolean;
  showIcons: boolean;
  asideTone: 'tint' | 'ink' | 'paper';
  asideRadius: number;
  photoEnabled: boolean;
  photoShape: 'circle' | 'rounded' | 'square';
  photoSize: number;
}

export interface ColorConfig {
  accent: string;
  ink: string;
  muted: string;
  paper: string;
  aside: string;
  asideInk: string;
}

export interface DesignConfig {
  templateId: string;
  page: {
    format: PageFormat;
    orientation: PageOrientation;
  };
  layout: LayoutConfig;
  type: TypographyConfig;
  color: ColorConfig;
}

export interface ResumeDocument {
  version: 1;
  id: string;
  title: string;
  updatedAt: string;
  basics: ResumeBasics;
  sections: ResumeSection[];
  design: DesignConfig;
}

export interface TemplatePreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'Editorial' | 'Modern' | 'Executive' | 'Academic' | 'Technical' | 'Creative';
  tags: string[];
  swatches: string[];
  design: DesignConfig;
}

export interface QualityCheck {
  id: string;
  label: string;
  detail: string;
  status: 'pass' | 'warn' | 'fail';
  sectionId?: string;
  weight: number;
}

export interface QualityReport {
  score: number;
  checks: QualityCheck[];
  stats: {
    words: number;
    bullets: number;
    quantifiedBullets: number;
    sections: number;
    pages: number;
    readingMinutes: number;
  };
}

export type SectionSelection = 'basics' | string;

export type StudioTab = 'content' | 'design' | 'insights';
