import type { ResumeDocument } from './types';
import { cloneDocument } from './sample';
import { designForTemplate } from './templates';

const STUDIO_KEY = '__studio';

export function isResumeDocument(value: unknown): value is ResumeDocument {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ResumeDocument>;
  return (
    candidate.version === 1 &&
    Boolean(candidate.basics) &&
    Array.isArray(candidate.sections) &&
    Boolean(candidate.design) &&
    Boolean(candidate.design?.layout) &&
    Boolean(candidate.design?.type) &&
    Boolean(candidate.design?.color)
  );
}

/**
 * Repairs older / partial studio documents without losing content. Used for
 * imports, saved CVs and localStorage restoration.
 */
export function normalizeDocument(raw: unknown): ResumeDocument | null {
  if (!isResumeDocument(raw)) return null;
  const doc = cloneDocument(raw as ResumeDocument);
  const template = designForTemplate(doc.design.templateId || 'atelier');
  doc.design = {
    ...template,
    ...doc.design,
    page: { ...template.page, ...doc.design.page },
    layout: { ...template.layout, ...doc.design.layout },
    type: { ...template.type, ...doc.design.type },
    color: { ...template.color, ...doc.design.color },
  };
  doc.sections = doc.sections
    .filter((section) => section && typeof section.id === 'string')
    .map((section) => ({
      ...section,
      visible: section.visible !== false,
      column: section.column === 'aside' ? 'aside' : 'main',
      items: Array.isArray(section.items)
        ? section.items.map((entry) => ({
            ...entry,
            bullets: Array.isArray(entry.bullets) ? entry.bullets : [],
            tags: Array.isArray(entry.tags) ? entry.tags : [],
          }))
        : [],
    }));
  doc.title = doc.title || `${doc.basics?.name || 'Untitled'} — Resume`;
  return doc;
}

export function parseDocumentJson(text: string): ResumeDocument | null {
  try {
    return normalizeDocument(JSON.parse(text));
  } catch {
    return null;
  }
}

interface SavedLike {
  id?: string;
  title: string;
  templateId: string;
  singletonData: Record<string, string>;
  entriesData: Record<string, Array<Record<string, string>>>;
  styleOverrides?: Record<string, unknown>;
  photoUrl?: string;
}

/** Packs the canonical model into the legacy cloud schema without losing fidelity. */
export function documentToSavedCv(doc: ResumeDocument) {
  return {
    id: doc.id,
    title: doc.title,
    templateId: doc.design.templateId,
    singletonData: {
      fullName: doc.basics.name,
      jobTitle: doc.basics.headline,
      email: doc.basics.email,
      phone: doc.basics.phone,
      location: doc.basics.location,
      website: doc.basics.website,
      linkedin: doc.basics.linkedin,
    },
    entriesData: Object.fromEntries(
      doc.sections.map((section) => [
        section.id,
        section.items.map((entry) => ({
          title: entry.title || '',
          subtitle: entry.subtitle || '',
          period: entry.period || '',
          description: entry.description || '',
          bullets: entry.bullets.join('\n'),
        })),
      ]),
    ),
    styleOverrides: { [STUDIO_KEY]: doc },
    photoUrl: doc.basics.photo || '',
  };
}

export function savedCvToDocument(saved: SavedLike): ResumeDocument | null {
  const stashed = saved?.styleOverrides?.[STUDIO_KEY];
  const doc = normalizeDocument(stashed);
  if (doc) {
    if (!doc.basics.photo && saved.photoUrl) doc.basics.photo = saved.photoUrl;
    return doc;
  }
  return null;
}
