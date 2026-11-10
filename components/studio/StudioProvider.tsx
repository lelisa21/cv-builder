'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ColorConfig,
  DesignConfig,
  LayoutConfig,
  ResumeBasics,
  ResumeDocument,
  ResumeItem,
  ResumeSection,
  SectionKind,
  StudioTab,
  TypographyConfig,
} from '@/lib/studio/types';
import { createEmptyDocument, createSampleDocument } from '@/lib/studio/sample';
import {
  balanceSectionColumns,
  designForTemplate,
  getTemplate,
  mapLegacyTemplateId,
} from '@/lib/studio/templates';
import { createSection, uniqueSectionTitle, uid } from '@/lib/studio/sections';
import {
  documentToSavedCv,
  normalizeDocument,
  parseDocumentJson,
  savedCvToDocument,
} from '@/lib/studio/serialize';
import { useAuth } from '@/lib/AuthContext';

const STORAGE_KEY = 'leli:studio:document:v1';

export type SeriesOverlay = 'gallery' | 'library' | 'palette' | null;
export type MobilePanel = 'outline' | 'canvas' | 'inspector';
export type SaveState = 'idle' | 'saving' | 'saved';
export type ToastTone = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  tone: ToastTone;
}

type Updater = ResumeDocument | ((previous: ResumeDocument) => ResumeDocument);

interface CommitOptions {
  mergeKey?: string;
}

interface StudioContextValue {
  doc: ResumeDocument;
  hydrated: boolean;
  activeSection: ResumeSection | null;
  selection: string;
  setSelection: (value: string) => void;
  tab: StudioTab;
  setTab: (tab: StudioTab) => void;
  overlay: SeriesOverlay;
  setOverlay: (overlay: SeriesOverlay) => void;
  preview: boolean;
  setPreview: (value: boolean) => void;
  mobilePanel: MobilePanel;
  setMobilePanel: (panel: MobilePanel) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  pageCount: number;
  setPageCount: (count: number) => void;
  saveState: SaveState;
  lastSavedAt: Date | null;
  savingCloud: boolean;
  busy: boolean;
  setBusy: (value: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  toasts: ToastMessage[];
  pushToast: (message: string, tone?: ToastTone) => void;
  undo: () => void;
  redo: () => void;
  setTitle: (title: string) => void;
  updateBasics: (patch: Partial<ResumeBasics>, mergeKey?: string) => void;
  updateSection: (id: string, patch: Partial<ResumeSection>, mergeKey?: string) => void;
  updateItem: (
    sectionId: string,
    itemId: string,
    patch: Partial<ResumeItem>,
    mergeKey?: string,
  ) => void;
  addSection: (kind: SectionKind) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  reorderSections: (fromId: string, toId: string) => void;
  moveSection: (id: string, direction: -1 | 1) => void;
  addItem: (sectionId: string) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  duplicateItem: (sectionId: string, itemId: string) => void;
  moveItem: (sectionId: string, itemId: string, direction: -1 | 1) => void;
  patchLayout: (patch: Partial<LayoutConfig>, mergeKey?: string) => void;
  patchType: (patch: Partial<TypographyConfig>, mergeKey?: string) => void;
  patchColor: (patch: Partial<ColorConfig>, mergeKey?: string) => void;
  patchPage: (patch: Partial<DesignConfig['page']>) => void;
  setDesign: (design: DesignConfig) => void;
  applyTemplate: (templateId: string) => void;
  resetDesign: () => void;
  startBlank: () => void;
  startSample: () => void;
  importFromProfile: () => void;
  importDocumentJson: (text: string) => boolean;
  saveCloud: () => Promise<void>;
  loadSavedCv: (id: string) => void;
  savedCvs: ReturnType<typeof useAuth>['savedCvs'];
  flushLocalSave: () => void;
}

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

function readInitialDocument(): ResumeDocument {
  if (typeof window === 'undefined') return createSampleDocument();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = normalizeDocument(JSON.parse(stored));
      if (parsed) return parsed;
    }
  } catch {
    // Ignore malformed storage and fall back to the sample document.
  }
  const params = new URLSearchParams(window.location.search);
  const template = mapLegacyTemplateId(params.get('template')) || params.get('template');
  if (params.get('blank') === '1') return createEmptyDocument(template || 'atelier');
  return createSampleDocument(template || 'atelier');
}

function replaceKind(
  sections: ResumeSection[],
  kind: SectionKind,
  items: ResumeItem[],
): ResumeSection[] {
  if (items.length === 0) return sections;
  const index = sections.findIndex((section) => section.kind === kind);
  if (index === -1) {
    const section = createSection(kind, { items });
    return [...sections, section];
  }
  return sections.map((section, position) =>
    position === index ? { ...section, visible: true, items } : section,
  );
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [doc, setDoc] = useState<ResumeDocument>(() => createSampleDocument());
  const [hydrated, setHydrated] = useState(false);
  const [history, setHistory] = useState<{ past: ResumeDocument[]; future: ResumeDocument[] }>({
    past: [],
    future: [],
  });
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savingCloud, setSavingCloud] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selection, setSelection] = useState<string>('basics');
  const [tab, setTab] = useState<StudioTab>('content');
  const [overlay, setOverlay] = useState<SeriesOverlay>(null);
  const [preview, setPreview] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('canvas');
  const [zoom, setZoomState] = useState(0.72);
  const [pageCount, setPageCountState] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { profile, savedCvs, saveCvToCloud } = useAuth();

  const docRef = useRef(doc);
  const historyRef = useRef(history);
  const lastPush = useRef(0);
  const lastMergeKey = useRef('');

  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const pushToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = uid('toast');
    setToasts((current) => [...current.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const commit = useCallback((updater: Updater, options: CommitOptions = {}) => {
    const previous = docRef.current;
    const next = typeof updater === 'function' ? updater(previous) : updater;
    if (!next || next === previous) return;
    const now = Date.now();
    const mergeKey = options.mergeKey || '';
    const canMerge =
      Boolean(mergeKey) && mergeKey === lastMergeKey.current && now - lastPush.current < 850;
    if (!canMerge) {
      setHistory((current) => ({
        past: [...current.past.slice(-89), previous],
        future: [],
      }));
      lastPush.current = now;
      lastMergeKey.current = mergeKey;
    }
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    docRef.current = stamped;
    setDoc(stamped);
  }, []);

  const resetDocument = useCallback((next: ResumeDocument, message?: string) => {
    docRef.current = next;
    setDoc(next);
    setHistory({ past: [], future: [] });
    lastMergeKey.current = '';
    lastPush.current = 0;
    if (message) pushToast(message, 'info');
  }, [pushToast]);

  // Hydrate once on the client so the server-rendered sample and the stored
  // document never disagree during hydration.
  useEffect(() => {
    const initial = readInitialDocument();
    docRef.current = initial;
    setDoc(initial);
    if (initial.sections.length) setSelection('basics');
    setHydrated(true);
  }, []);

  // Debounced local autosave.
  useEffect(() => {
    if (!hydrated) return;
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
        setSaveState('saved');
        setLastSavedAt(new Date());
      } catch {
        setSaveState('idle');
      }
    }, 620);
    return () => window.clearTimeout(timer);
  }, [doc, hydrated]);

  const flushLocalSave = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(docRef.current));
      setSaveState('saved');
      setLastSavedAt(new Date());
      pushToast('Saved on this device');
    } catch {
      pushToast('Could not save locally', 'error');
    }
  }, [pushToast]);

  const undo = useCallback(() => {
    const current = historyRef.current;
    if (current.past.length === 0) return;
    const previous = current.past[current.past.length - 1];
    const now = docRef.current;
    docRef.current = previous;
    setDoc(previous);
    setHistory({ past: current.past.slice(0, -1), future: [now, ...current.future].slice(0, 90) });
    lastMergeKey.current = '';
  }, []);

  const redo = useCallback(() => {
    const current = historyRef.current;
    if (current.future.length === 0) return;
    const next = current.future[0];
    const now = docRef.current;
    docRef.current = next;
    setDoc(next);
    setHistory({ past: [...current.past, now].slice(-90), future: current.future.slice(1) });
    lastMergeKey.current = '';
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOverlay('palette');
        return;
      }
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        flushLocalSave();
        return;
      }
      if (typing) return;
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (event.key === 'Escape') {
        setOverlay(null);
        setPreview(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flushLocalSave, redo, undo]);

  const setTitle = useCallback(
    (title: string) => {
      commit((previous) => ({ ...previous, title }), { mergeKey: 'title' });
    },
    [commit],
  );

  const updateBasics = useCallback(
    (patch: Partial<ResumeBasics>, mergeKey = 'basics') => {
      commit((previous) => ({ ...previous, basics: { ...previous.basics, ...patch } }), { mergeKey });
    },
    [commit],
  );

  const updateSection = useCallback(
    (id: string, patch: Partial<ResumeSection>, mergeKey?: string) => {
      commit(
        (previous) => ({
          ...previous,
          sections: previous.sections.map((section) =>
            section.id === id ? { ...section, ...patch } : section,
          ),
        }),
        { mergeKey: mergeKey || `section:${id}:${Object.keys(patch).join(',')}` },
      );
    },
    [commit],
  );

  const updateItem = useCallback(
    (sectionId: string, itemId: string, patch: Partial<ResumeItem>, mergeKey?: string) => {
      commit(
        (previous) => ({
          ...previous,
          sections: previous.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  items: section.items.map((entry) =>
                    entry.id === itemId ? { ...entry, ...patch } : entry,
                  ),
                }
              : section,
          ),
        }),
        { mergeKey: mergeKey || `item:${sectionId}:${itemId}:${Object.keys(patch).join(',')}` },
      );
    },
    [commit],
  );

  const addSection = useCallback(
    (kind: SectionKind) => {
      const current = docRef.current;
      const section = createSection(kind, {
        title: uniqueSectionTitle(current.sections, kind),
        column: current.design.layout.columns === 'single' ? 'main' : undefined,
      });
      commit((previous) => ({ ...previous, sections: [...previous.sections, section] }));
      setSelection(section.id);
      setTab('content');
      pushToast(`Added ${section.title.toLowerCase()} section`, 'info');
    },
    [commit, pushToast],
  );

  const removeSection = useCallback(
    (id: string) => {
      commit((previous) => ({
        ...previous,
        sections: previous.sections.filter((section) => section.id !== id),
      }));
      setSelection((current) => (current === id ? 'basics' : current));
      pushToast('Section removed', 'info');
    },
    [commit, pushToast],
  );

  const duplicateSection = useCallback(
    (id: string) => {
      commit((previous) => {
        const index = previous.sections.findIndex((section) => section.id === id);
        if (index === -1) return previous;
        const source = previous.sections[index];
        const copy: ResumeSection = {
          ...source,
          id: uid('sec'),
          title: `${source.title} copy`,
          items: source.items.map((entry) => ({
            ...entry,
            id: uid('item'),
            bullets: [...entry.bullets],
            tags: [...entry.tags],
          })),
        };
        const sections = [...previous.sections];
        sections.splice(index + 1, 0, copy);
        return { ...previous, sections };
      });
      pushToast('Section duplicated', 'info');
    },
    [commit, pushToast],
  );

  const reorderSections = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      commit((previous) => {
        const sections = [...previous.sections];
        const from = sections.findIndex((section) => section.id === fromId);
        const to = sections.findIndex((section) => section.id === toId);
        if (from === -1 || to === -1) return previous;
        const [moved] = sections.splice(from, 1);
        sections.splice(to, 0, moved);
        return { ...previous, sections };
      });
    },
    [commit],
  );

  const moveSection = useCallback(
    (id: string, direction: -1 | 1) => {
      commit((previous) => {
        const sections = [...previous.sections];
        const index = sections.findIndex((section) => section.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= sections.length) return previous;
        const [moved] = sections.splice(index, 1);
        sections.splice(target, 0, moved);
        return { ...previous, sections };
      });
    },
    [commit],
  );

  const addItem = useCallback(
    (sectionId: string) => {
      const section = docRef.current.sections.find((entry) => entry.id === sectionId);
      if (!section) return;
      const item = { ...createSection(section.kind).items[0] };
      commit(
        (previous) => ({
          ...previous,
          sections: previous.sections.map((entry) =>
            entry.id === sectionId ? { ...entry, items: [...entry.items, item] } : entry,
          ),
        }),
      );
    },
    [commit],
  );

  const removeItem = useCallback(
    (sectionId: string, itemId: string) => {
      commit((previous) => ({
        ...previous,
        sections: previous.sections.map((section) =>
          section.id === sectionId
            ? { ...section, items: section.items.filter((entry) => entry.id !== itemId) }
            : section,
        ),
      }));
    },
    [commit],
  );

  const duplicateItem = useCallback(
    (sectionId: string, itemId: string) => {
      commit((previous) => ({
        ...previous,
        sections: previous.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const index = section.items.findIndex((entry) => entry.id === itemId);
          if (index === -1) return section;
          const source = section.items[index];
          const items = [...section.items];
          items.splice(index + 1, 0, {
            ...source,
            id: uid('item'),
            bullets: [...source.bullets],
            tags: [...source.tags],
          });
          return { ...section, items };
        }),
      }));
    },
    [commit],
  );

  const moveItem = useCallback(
    (sectionId: string, itemId: string, direction: -1 | 1) => {
      commit((previous) => ({
        ...previous,
        sections: previous.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const items = [...section.items];
          const index = items.findIndex((entry) => entry.id === itemId);
          const target = index + direction;
          if (index === -1 || target < 0 || target >= items.length) return section;
          const [moved] = items.splice(index, 1);
          items.splice(target, 0, moved);
          return { ...section, items };
        }),
      }));
    },
    [commit],
  );

  const patchLayout = useCallback(
    (patch: Partial<LayoutConfig>, mergeKey?: string) => {
      commit(
        (previous) => {
          const design = {
            ...previous.design,
            layout: { ...previous.design.layout, ...patch },
          };
          const sections =
            patch.columns && patch.columns !== previous.design.layout.columns
              ? balanceSectionColumns(previous.sections, design)
              : previous.sections;
          return { ...previous, design, sections };
        },
        { mergeKey: mergeKey || `layout:${Object.keys(patch).join(',')}` },
      );
    },
    [commit],
  );

  const patchType = useCallback(
    (patch: Partial<TypographyConfig>, mergeKey?: string) => {
      commit(
        (previous) => ({
          ...previous,
          design: { ...previous.design, type: { ...previous.design.type, ...patch } },
        }),
        { mergeKey: mergeKey || `type:${Object.keys(patch).join(',')}` },
      );
    },
    [commit],
  );

  const patchColor = useCallback(
    (patch: Partial<ColorConfig>, mergeKey?: string) => {
      commit(
        (previous) => ({
          ...previous,
          design: { ...previous.design, color: { ...previous.design.color, ...patch } },
        }),
        { mergeKey: mergeKey || `color:${Object.keys(patch).join(',')}` },
      );
    },
    [commit],
  );

  const patchPage = useCallback(
    (patch: Partial<DesignConfig['page']>) => {
      commit((previous) => ({
        ...previous,
        design: { ...previous.design, page: { ...previous.design.page, ...patch } },
      }));
    },
    [commit],
  );

  const setDesign = useCallback(
    (design: DesignConfig) => {
      commit((previous) => ({
        ...previous,
        design: { ...design, templateId: design.templateId || 'custom' },
      }));
    },
    [commit],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      const preset = getTemplate(templateId);
      const design = designForTemplate(preset.id);
      commit((previous) => ({
        ...previous,
        design,
        sections: balanceSectionColumns(previous.sections, design),
      }));
      setOverlay(null);
      pushToast(`${preset.name} applied — your content is intact`, 'info');
    },
    [commit, pushToast],
  );

  const resetDesign = useCallback(() => {
    const design = designForTemplate(docRef.current.design.templateId || 'atelier');
    commit((previous) => ({
      ...previous,
      design,
      sections: balanceSectionColumns(previous.sections, design),
    }));
    pushToast('Design reset to the template', 'info');
  }, [commit, pushToast]);

  const startBlank = useCallback(() => {
    const template = docRef.current.design.templateId || 'atelier';
    resetDocument(createEmptyDocument(template), 'New blank resume started');
    setSelection('basics');
    setTab('content');
    setOverlay(null);
  }, [resetDocument]);

  const startSample = useCallback(() => {
    const template = docRef.current.design.templateId || 'atelier';
    resetDocument(createSampleDocument(template), 'Sample resume loaded');
    setSelection('basics');
    setTab('content');
    setOverlay(null);
  }, [resetDocument]);

  const importFromProfile = useCallback(() => {
    if (!profile || (!profile.fullName && !profile.email)) {
      pushToast('No saved profile found. Add one in Profile first.', 'error');
      return;
    }
    commit((previous) => {
      const basics: ResumeBasics = {
        ...previous.basics,
        name: profile.fullName || previous.basics.name,
        headline: profile.headline || previous.basics.headline,
        email: profile.email || previous.basics.email,
        phone: profile.phone || previous.basics.phone,
        location: profile.location || previous.basics.location,
        website: profile.portfolio || previous.basics.website,
        linkedin: profile.linkedin || previous.basics.linkedin,
        photo: previous.basics.photo || profile.avatarUrl || '',
      };

      let sections = previous.sections;
      if (profile.experience?.length) {
        sections = replaceKind(
          sections,
          'experience',
          profile.experience.map((entry, index) => ({
            id: uid(`exp${index}`),
            title: entry.position || '',
            subtitle: entry.company || '',
            period: entry.duration || '',
            description: '',
            bullets: entry.responsibilities || [],
            tags: entry.technologies || [],
          })),
        );
      }
      if (profile.education?.length) {
        sections = replaceKind(
          sections,
          'education',
          profile.education.map((entry, index) => ({
            id: uid(`edu${index}`),
            title: entry.degree || '',
            subtitle: entry.university || '',
            description: entry.cgpa ? `GPA ${entry.cgpa}` : '',
            bullets: entry.achievements || [],
            tags: [],
          })),
        );
      }
      if (profile.projects?.length) {
        sections = replaceKind(
          sections,
          'projects',
          profile.projects.map((entry, index) => ({
            id: uid(`project${index}`),
            title: entry.name || '',
            subtitle: '',
            description: entry.description || '',
            link: entry.url || '',
            bullets: [],
            tags: entry.technologies || [],
          })),
        );
      }
      const skillItems: ResumeItem[] = [];
      if (profile.skills?.technical?.length) {
        skillItems.push({
          id: uid('skill'),
          title: 'Technical',
          description: '',
          bullets: [],
          tags: profile.skills.technical,
        });
      }
      if (profile.skills?.soft?.length) {
        skillItems.push({
          id: uid('skill'),
          title: 'Ways of working',
          description: '',
          bullets: [],
          tags: profile.skills.soft,
        });
      }
      if (skillItems.length) {
        sections = replaceKind(sections, 'skills', skillItems);
      }
      if (profile.bio) {
        sections = replaceKind(sections, 'summary', [
          {
            id: uid('summary'),
            description: profile.bio,
            bullets: [],
            tags: [],
          },
        ]);
      }
      return { ...previous, basics, sections };
    });
    pushToast('Profile imported into the studio', 'info');
  }, [commit, profile, pushToast]);

  const importDocumentJson = useCallback(
    (text: string) => {
      const parsed = parseDocumentJson(text);
      if (!parsed) {
        pushToast('That file is not a valid studio document.', 'error');
        return false;
      }
      resetDocument(parsed, 'Document imported');
      setSelection('basics');
      return true;
    },
    [pushToast, resetDocument],
  );

  const saveCloud = useCallback(async () => {
    setSavingCloud(true);
    try {
      const result = await saveCvToCloud(documentToSavedCv(docRef.current));
      if (result.error) pushToast(`Cloud save failed: ${result.error}`, 'error');
      else pushToast('Saved to your account');
    } catch {
      pushToast('Cloud save failed. Your work is still saved locally.', 'error');
    } finally {
      setSavingCloud(false);
    }
  }, [pushToast, saveCvToCloud]);

  const loadSavedCv = useCallback(
    (id: string) => {
      const saved = savedCvs.find((entry) => entry.id === id);
      const parsed = saved ? savedCvToDocument(saved) : null;
      if (!parsed) {
        pushToast('This saved CV was made in the classic builder.', 'error');
        return;
      }
      resetDocument({ ...parsed, id: saved?.id || parsed.id }, 'Saved CV opened');
      setOverlay(null);
      setSelection('basics');
    },
    [pushToast, resetDocument, savedCvs],
  );

  const setZoom = useCallback((value: number) => {
    setZoomState(Math.min(1.3, Math.max(0.3, Math.round(value * 100) / 100)));
  }, []);

  const setPageCount = useCallback((count: number) => {
    setPageCountState((current) => (current === count ? current : count));
  }, []);

  const activeSection = useMemo(
    () => doc.sections.find((section) => section.id === selection) || null,
    [doc.sections, selection],
  );

  // Keep the selection valid after deleting a section.
  useEffect(() => {
    if (selection === 'basics') return;
    if (!doc.sections.some((section) => section.id === selection)) setSelection('basics');
  }, [doc.sections, selection]);

  const value: StudioContextValue = {
    doc,
    hydrated,
    activeSection,
    selection,
    setSelection,
    tab,
    setTab,
    overlay,
    setOverlay,
    preview,
    setPreview,
    mobilePanel,
    setMobilePanel,
    zoom,
    setZoom,
    pageCount,
    setPageCount,
    saveState,
    lastSavedAt,
    savingCloud,
    busy,
    setBusy,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    toasts,
    pushToast,
    undo,
    redo,
    setTitle,
    updateBasics,
    updateSection,
    updateItem,
    addSection,
    removeSection,
    duplicateSection,
    reorderSections,
    moveSection,
    addItem,
    removeItem,
    duplicateItem,
    moveItem,
    patchLayout,
    patchType,
    patchColor,
    patchPage,
    setDesign,
    applyTemplate,
    resetDesign,
    startBlank,
    startSample,
    importFromProfile,
    importDocumentJson,
    saveCloud,
    loadSavedCv,
    savedCvs,
    flushLocalSave,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used inside StudioProvider');
  return context;
}
