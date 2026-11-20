'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  Copy,
  FileDown,
  FileText,
  FileType2,
  Library,
  Mail,
  Plus,
  Printer,
  Redo2,
  Scissors,
  ShieldCheck,
  Sparkles,
  Target,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useAuth } from '@/lib/AuthContext';
import type {
  LetterDraft,
  LetterForm,
  LetterFont,
  LetterPaper,
  LetterRewrite,
  LetterSource,
  QualityFix,
} from '@/types/letters';
import {
  composeLetter,
  extractRequirementsFromPosting,
  fixLetter,
  rewriteLetterLocally,
} from '@/lib/letter-engine';
import { analyzeLetter } from '@/lib/letter-quality';
import {
  createLetterId,
  loadActiveLetterId,
  loadLetterDrafts,
  normalizeLetterDraft,
  saveActiveLetterId,
  saveLetterDrafts,
} from '@/lib/letter-storage';
import { exportLetterToPdf, exportLetterToWord } from '@/lib/export-utils';
import { writeLetterWithPuterClient } from '@/lib/puter-ai';
import LetterComposer from '@/components/letters/LetterComposer';
import LetterLibrary from '@/components/letters/LetterLibrary';
import LetterPaperView from '@/components/letters/LetterPaper';
import LetterQualityPanel from '@/components/letters/LetterQualityPanel';

type BusyMode = 'generate' | 'rewrite' | null;
type ToastTone = 'ok' | 'warn';

function today(): string {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function emptyForm(): LetterForm {
  return {
    kind: 'application',
    tone: 'professional',
    applicantName: 'Your Name',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    company: '',
    position: '',
    recipient: '',
    degree: '',
    university: '',
    skills: '',
    experience: '',
    projects: '',
    requirements: [],
    jobPosting: '',
    includeDate: true,
    date: today(),
  };
}

function meaningfulForm(form: LetterForm): boolean {
  return [
    form.email,
    form.phone,
    form.location,
    form.linkedin,
    form.company,
    form.position,
    form.recipient,
    form.degree,
    form.university,
    form.skills,
    form.experience,
    form.projects,
    form.jobPosting,
    ...form.requirements,
  ].some((value) => Boolean(value.trim()));
}

function safeName(value: string): string {
  return value.replace(/[^a-z0-9\-_]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'Letter';
}

function downloadText(filename: string, text: string, type = 'text/plain;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function LetterGenerator() {
  const { t, language, setLanguage } = useApp();
  const { profile } = useAuth();
  const tl = t.letters;

  const [form, setForm] = useState<LetterForm>(emptyForm);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(tl.newLetter);
  const [drafts, setDrafts] = useState<LetterDraft[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [source, setSource] = useState<LetterSource>('local');
  const [busy, setBusy] = useState<BusyMode>(null);
  const [extracting, setExtracting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [paper, setPaper] = useState<LetterPaper>('classic');
  const [font, setFont] = useState<LetterFont>('serif');
  const [accent, setAccent] = useState('#0c3b74');
  const [fontSize, setFontSize] = useState(11);
  const [zoom, setZoom] = useState(1);
  const [align, setAlign] = useState<'left' | 'justify'>('justify');
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const contentRef = useRef('');
  const activeIdRef = useRef<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setLanguageRef = useRef(setLanguage);

  useEffect(() => {
    setLanguageRef.current = setLanguage;
  }, [setLanguage]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = 'ok') => {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const applyContent = useCallback((value: string) => {
    contentRef.current = value;
    setContent(value);
  }, []);

  const pushContent = useCallback((value: string) => {
    const previous = contentRef.current;
    if (previous === value) return;
    setPast((items) => [...items.slice(-29), previous]);
    setFuture([]);
    applyContent(value);
  }, [applyContent]);

  const patchForm = useCallback((patch: Partial<LetterForm>) => {
    setForm((previous) => ({ ...previous, ...patch }));
  }, []);

  const persistDrafts = useCallback((next: LetterDraft[]) => {
    setDrafts(next);
    saveLetterDrafts(next);
  }, []);

  const loadDraft = useCallback((draft: LetterDraft) => {
    setForm({ ...draft.form, requirements: [...draft.form.requirements] });
    applyContent(draft.content);
    setTitle(draft.title);
    setPaper(draft.paper);
    setFont(draft.font);
    setAccent(draft.accent);
    setFontSize(draft.fontSize);
    setAlign(draft.align);
    setSource(draft.source);
    setLanguageRef.current(draft.language);
    activeIdRef.current = draft.id;
    setActiveId(draft.id);
    saveActiveLetterId(draft.id);
    setSavedAt(draft.updatedAt);
    setPast([]);
    setFuture([]);
    setEditing(false);
    setZoom(1);
    setLibraryOpen(false);
  }, [applyContent]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const stored = loadLetterDrafts();
      setDrafts(stored);
      const storedId = loadActiveLetterId();
      const draft = (storedId && stored.find((item) => item.id === storedId)) || stored[0];
      if (draft) loadDraft(draft);
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, [loadDraft]);

  // Autosave the active letter locally. No account or network required.
  useEffect(() => {
    if (!hydrated) return;
    if (!content.trim() && !meaningfulForm(form)) return;

    const timer = setTimeout(() => {
      let id = activeIdRef.current;
      if (!id) {
        id = createLetterId();
        activeIdRef.current = id;
        setActiveId(id);
        saveActiveLetterId(id);
      }
      const updatedAt = new Date().toISOString();
      const draft: LetterDraft = {
        id,
        title: title.trim() || tl.newLetter,
        form,
        content,
        language,
        paper,
        font,
        accent,
        fontSize,
        align,
        source,
        updatedAt,
      };
      setDrafts((previous) => {
        const next = [draft, ...previous.filter((item) => item.id !== id)].slice(0, 40);
        saveLetterDrafts(next);
        return next;
      });
      setSavedAt(updatedAt);
    }, 650);

    return () => clearTimeout(timer);
  }, [hydrated, content, form, title, language, paper, font, accent, fontSize, align, source, tl.newLetter]);

  const quality = useMemo(() => analyzeLetter(content, form), [content, form]);

  const sourceLabel: Record<LetterSource, string> = {
    openrouter: tl.sourceOpenRouter,
    ai: tl.sourceAi,
    puter: tl.sourcePuter,
    local: tl.sourceLocal,
  };

  const validationError = useMemo(() => {
    const name = form.applicantName.trim();
    if (!name || name.toLowerCase() === 'your name') return true;
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return true;
    if (!form.company.trim() || !form.position.trim()) return true;
    return false;
  }, [form.applicantName, form.email, form.company, form.position]);

  const requestLetter = async (mode: 'generate' | 'rewrite', instruction?: LetterRewrite) => {
    let written = '';
    let usedSource: LetterSource = 'local';

    try {
      const response = await fetch('/api/write-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          form,
          language,
          content: mode === 'rewrite' ? contentRef.current : undefined,
          instruction,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { letter?: string; source?: string };
      if (typeof data.letter === 'string' && data.letter.trim()) {
        written = data.letter;
        usedSource = data.source === 'openrouter' ? 'openrouter' : 'ai';
      }
    } catch {
      // Fall through to client-side providers and the offline engine.
    }

    if (!written) {
      const clientLetter = await writeLetterWithPuterClient({
        form,
        language,
        mode,
        content: mode === 'rewrite' ? contentRef.current : undefined,
        instruction,
      });
      if (clientLetter) {
        written = clientLetter;
        usedSource = 'puter';
      }
    }

    if (!written) {
      written = mode === 'generate'
        ? composeLetter(form, language)
        : rewriteLetterLocally(contentRef.current, instruction || 'grammar', form, language);
      usedSource = 'local';
    }

    pushContent(written);
    setSource(usedSource);
    setEditing(false);
    notify(sourceLabel[usedSource]);
  };

  const handleGenerate = async () => {
    if (validationError) {
      notify(tl.validationError, 'warn');
      return;
    }
    setBusy('generate');
    try {
      await requestLetter('generate');
    } finally {
      setBusy(null);
    }
  };

  const handleRewrite = async (instruction: LetterRewrite) => {
    if (!contentRef.current.trim()) {
      notify(tl.noContent, 'warn');
      return;
    }
    setBusy('rewrite');
    try {
      await requestLetter('rewrite', instruction);
    } finally {
      setBusy(null);
    }
  };

  const handleExtract = async () => {
    const posting = form.jobPosting.trim();
    if (posting.length < 20) {
      notify(tl.noRequirements, 'warn');
      return;
    }

    setExtracting(true);
    let requirements: string[] = [];
    try {
      const response = await fetch('/api/write-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'requirements', form, language, jobPosting: posting }),
      });
      const data = (await response.json().catch(() => ({}))) as { requirements?: string[] };
      if (Array.isArray(data.requirements)) {
        requirements = data.requirements.filter(
          (item): item is string => typeof item === 'string' && Boolean(item.trim()),
        );
      }
    } catch {
      // The local extractor below keeps this control usable offline.
    } finally {
      setExtracting(false);
    }

    if (!requirements.length) {
      requirements = extractRequirementsFromPosting(posting);
    }
    if (!requirements.length) {
      notify(tl.noRequirements, 'warn');
      return;
    }
    patchForm({ requirements });
    notify(tl.jobExtracted);
  };

  const handleUseProfile = () => {
    if (!profile) {
      notify(tl.profileMissing, 'warn');
      return;
    }
    const education = profile.education?.[0];
    const experience = profile.experience?.[0];
    const skills = [
      ...(profile.skills?.technical || []),
      ...(profile.skills?.soft || []),
    ].join(', ');
    const projects = (profile.projects || []).map((project) => project.name).filter(Boolean).join(', ');
    const experienceText = experience
      ? [
          experience.position,
          experience.company ? `at ${experience.company}` : '',
          experience.duration ? `(${experience.duration})` : '',
          (experience.responsibilities || []).slice(0, 2).join('; '),
        ].filter(Boolean).join(' ')
      : '';

    patchForm({
      applicantName: profile.fullName || form.applicantName,
      email: profile.email || form.email,
      phone: profile.phone || form.phone,
      location: profile.location || form.location,
      linkedin: profile.linkedin || form.linkedin,
      degree: education?.degree || form.degree,
      university: education?.university || form.university,
      skills: skills || form.skills,
      experience: experienceText || form.experience,
      projects: projects || form.projects,
    });
    notify(tl.useProfile);
  };

  const handleSample = (sample: 'software' | 'marketing') => {
    if (sample === 'software') {
      patchForm({
        applicantName: 'Alemayehu Tesfaye',
        email: 'alemayehu.tesfaye@example.com',
        phone: '+251 91 234 5678',
        location: 'Addis Ababa, Ethiopia',
        linkedin: 'linkedin.com/in/yourname',
        company: 'ABC Technology PLC',
        position: 'Junior Software Engineer',
        recipient: 'Engineering Hiring Team',
        degree: 'BSc in Software Engineering',
        university: 'ABC University',
        skills: 'React, Node.js, TypeScript, SQL, Git, Problem Solving',
        experience: 'software development internship at ABC Technology PLC',
        projects: 'employee hiring system and a house rental platform',
        requirements: [
          'BSc in Computer Science or Software Engineering',
          'Practical React and Node.js experience',
          'Database knowledge (SQL or MongoDB)',
          'Strong problem-solving and teamwork skills',
        ],
      });
    } else {
      patchForm({
        applicantName: 'Alemayehu Tesfaye',
        email: 'alemayehu.tesfaye@example.com',
        phone: '+251 91 234 5678',
        location: 'Addis Ababa, Ethiopia',
        linkedin: 'linkedin.com/in/yourname',
        company: 'Bikat Business Solutions',
        position: 'Marketing Associate',
        recipient: 'Marketing Hiring Committee',
        degree: 'BA in Marketing',
        university: 'ABC University',
        skills: 'Market research, content strategy, SEO, analytics, communication',
        experience: 'marketing internship with a consumer goods brand',
        projects: 'a campus brand launch and a social media growth campaign',
        requirements: [
          'Degree in marketing, business or a related field',
          'Strong written and verbal communication',
          'Familiarity with analytics and social media tools',
        ],
      });
    }
    notify(tl.sampleProfiles);
  };

  const handleCopy = async () => {
    if (!content.trim()) {
      notify(tl.noContent, 'warn');
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const helper = document.createElement('textarea');
      helper.value = content;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
    }
    notify(tl.copySuccess);
  };

  const exportOptions = { paper, font, accent, fontSize, align, language };
  const fileBase = `${safeName(form.position || 'Letter')}_${safeName(form.company || 'Application')}`;

  const handleWord = async () => {
    if (!content.trim()) return notify(tl.noContent, 'warn');
    try {
      await exportLetterToWord(content, form.applicantName, form.position, `${fileBase}.docx`, exportOptions);
      notify(tl.exportSuccess);
    } catch {
      notify(tl.validationError, 'warn');
    }
  };

  const handlePdf = () => {
    if (!content.trim()) return notify(tl.noContent, 'warn');
    const downloaded = exportLetterToPdf(content, `${fileBase}.pdf`, exportOptions);
    if (!downloaded) {
      setEditing(false);
      setTimeout(() => window.print(), 60);
      notify(tl.printHint);
      return;
    }
    notify(tl.exportSuccess);
  };

  const handleTxt = () => {
    if (!content.trim()) return notify(tl.noContent, 'warn');
    downloadText(`${fileBase}.txt`, content);
    notify(tl.exportSuccess);
  };

  const handlePrint = () => {
    if (!content.trim()) return notify(tl.noContent, 'warn');
    setEditing(false);
    setTimeout(() => window.print(), 60);
  };

  const handleEmail = () => {
    if (!content.trim()) return notify(tl.noContent, 'warn');
    const subject = encodeURIComponent(`${form.position || 'Application'} — ${form.company || 'Opportunity'}`);
    const body = encodeURIComponent(content);
    // Use a temporary anchor so the current page is never replaced by the
    // mailto: navigation in browsers that handle external protocols strictly.
    const anchor = document.createElement('a');
    anchor.href = `mailto:?subject=${subject}&body=${body}`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const undo = () => {
    if (!past.length) return;
    // Capture before applyContent mutates the ref: functional updaters run later.
    const current = contentRef.current;
    const previous = past[past.length - 1];
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [current, ...items].slice(0, 30));
    applyContent(previous);
  };

  const redo = () => {
    if (!future.length) return;
    const current = contentRef.current;
    const next = future[0];
    setFuture((items) => items.slice(1));
    setPast((items) => [...items.slice(-29), current]);
    applyContent(next);
  };

  const handleFix = (fix: QualityFix) => {
    if (!contentRef.current.trim()) return;
    pushContent(fixLetter(contentRef.current, fix, form, language));
    notify(tl.qualityFix);
  };

  const resetStudio = () => {
    activeIdRef.current = null;
    setActiveId(null);
    saveActiveLetterId(null);
    setForm(emptyForm());
    applyContent('');
    setTitle(tl.newLetter);
    setSource('local');
    setPast([]);
    setFuture([]);
    setSavedAt(null);
    setEditing(false);
    setLibraryOpen(false);
    setZoom(1);
  };

  const duplicateDraft = (draft: LetterDraft) => {
    const copy: LetterDraft = {
      ...draft,
      id: createLetterId(),
      title: `${draft.title} (copy)`,
      updatedAt: new Date().toISOString(),
    };
    persistDrafts([copy, ...drafts]);
    notify(tl.duplicateDraft);
  };

  const renameDraft = (id: string, nextTitle: string) => {
    persistDrafts(drafts.map((draft) => (
      draft.id === id ? { ...draft, title: nextTitle, updatedAt: new Date().toISOString() } : draft
    )));
    if (id === activeIdRef.current) setTitle(nextTitle);
    notify(tl.renameDraft);
  };

  const deleteDraft = (id: string) => {
    persistDrafts(drafts.filter((draft) => draft.id !== id));
    if (id === activeIdRef.current) resetStudio();
    notify(tl.deleteDraft);
  };

  const exportBackup = () => {
    downloadText(
      `letter-studio-backup-${today()}.json`,
      JSON.stringify({ drafts }, null, 2),
      'application/json',
    );
    notify(tl.exportSuccess);
  };

  const importBackup = (incoming: LetterDraft[]) => {
    const normalized = incoming
      .map((draft) => normalizeLetterDraft(draft))
      .filter((draft): draft is LetterDraft => Boolean(draft));
    const known = new Set(normalized.map((draft) => draft.id));
    persistDrafts([...normalized, ...drafts.filter((draft) => !known.has(draft.id))].slice(0, 40));
    notify(tl.backupImport);
  };

  const rewrites: Array<{ id: LetterRewrite; label: string; icon: LucideIcon }> = [
    { id: 'shorten', label: tl.shorten, icon: Scissors },
    { id: 'strengthen', label: tl.strengthen, icon: ArrowUp },
    { id: 'formal', label: tl.moreFormal, icon: ShieldCheck },
    { id: 'grammar', label: tl.fixGrammar, icon: Check },
    { id: 'tailor', label: tl.tailor, icon: Target },
  ];

  return (
    <div className="letter-studio">
      <header className="ls-hero">
        <div className="ls-hero-text">
          <span className="ls-badge">{tl.badge}</span>
          <h1>{tl.title}</h1>
          <p>{tl.subtitle}</p>
        </div>
        <div className="ls-hero-actions">
          <div className={`ls-hero-score is-${quality.score >= 78 ? 'good' : quality.score >= 50 ? 'mid' : 'bad'}`}>
            <strong>{quality.score}</strong>
            <span>{tl.scoreLabel}</span>
          </div>
          <button type="button" className="ls-hero-btn" onClick={() => setLibraryOpen(true)}>
            <Library size={15} strokeWidth={1.8} aria-hidden />
            {tl.library} <b>{drafts.length}</b>
          </button>
          <button type="button" className="ls-hero-btn is-primary" onClick={resetStudio}>
            <Plus size={15} strokeWidth={1.8} aria-hidden />
            {tl.newLetter}
          </button>
        </div>
      </header>

      <div className="ls-workspace">
        <LetterComposer
          form={form}
          onChange={patchForm}
          onUseProfile={handleUseProfile}
          profileAvailable={Boolean(profile)}
          onExtract={() => void handleExtract()}
          onGenerate={() => void handleGenerate()}
          onSample={handleSample}
          busy={busy}
          extracting={extracting}
        />

        <main className="ls-main">
          <div className="ls-toolbar ls-toolbar--top">
            <div className="ls-tool-group">
              <button
                type="button"
                className={`ls-mode-btn${!editing ? ' is-active' : ''}`}
                onClick={() => setEditing(false)}
              >
                {tl.preview}
              </button>
              <button
                type="button"
                className={`ls-mode-btn${editing ? ' is-active' : ''}`}
                onClick={() => setEditing(true)}
              >
                {tl.edit}
              </button>
              <span className="ls-tool-sep" />
              <button type="button" className="ls-icon-btn" onClick={undo} disabled={!past.length} aria-label={tl.undo} title={tl.undo}>
                <Undo2 size={15} strokeWidth={1.8} aria-hidden />
              </button>
              <button type="button" className="ls-icon-btn" onClick={redo} disabled={!future.length} aria-label={tl.redo} title={tl.redo}>
                <Redo2 size={15} strokeWidth={1.8} aria-hidden />
              </button>
            </div>

            <div className="ls-tool-group">
              <label className="ls-select-wrap">
                <span>{tl.paperStyle}</span>
                <select value={paper} onChange={(event) => setPaper(event.target.value as LetterPaper)}>
                  <option value="classic">{tl.styleClassic}</option>
                  <option value="modern">{tl.styleModern}</option>
                  <option value="minimal">{tl.styleMinimal}</option>
                  <option value="executive">{tl.styleExecutive}</option>
                </select>
              </label>
              <label className="ls-select-wrap">
                <span>{tl.fontLabel}</span>
                <select value={font} onChange={(event) => setFont(event.target.value as LetterFont)}>
                  <option value="serif">{tl.fontSerif}</option>
                  <option value="sans">{tl.fontSans}</option>
                </select>
              </label>
              <label className="ls-select-wrap">
                <span>{tl.fontSize}</span>
                <input type="range" min={9} max={14} step={1} value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
              </label>
              <label className="ls-select-wrap">
                <span>{tl.zoom}</span>
                <input type="range" min={0.55} max={1.2} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </label>
              <div className="ls-accents" aria-label={tl.paperStyle}>
                {['#0c3b74', '#176b5c', '#8a3d2e', '#4b3b8f'].map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={`ls-accent${accent === color ? ' is-active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setAccent(color)}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="ls-stage">
            <div className="ls-paper-column">
              <LetterPaperView
                content={content}
                editing={editing}
                onChange={pushContent}
                paper={paper}
                font={font}
                accent={accent}
                fontSize={fontSize}
                align={align}
                zoom={zoom}
                language={language}
                emptyLabel={tl.noContent}
              />
            </div>

            <aside className="ls-insight-column">
              <section className="ls-refine">
                <h3>{tl.rewriteLabel}</h3>
                <div className="ls-refine-grid">
                  {rewrites.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      disabled={!content.trim() || busy === 'rewrite'}
                      onClick={() => void handleRewrite(item.id)}
                    >
                      <item.icon size={14} strokeWidth={1.8} aria-hidden />
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="ls-regenerate"
                  disabled={validationError || busy === 'generate'}
                  onClick={() => void handleGenerate()}
                >
                  <Sparkles size={14} strokeWidth={1.8} aria-hidden />
                  {busy === 'generate' ? tl.generatingBtn : tl.regenerate}
                </button>
              </section>

              <LetterQualityPanel quality={quality} onFix={handleFix} />
            </aside>
          </div>

          <div className="ls-toolbar ls-toolbar--bottom">
            <div className="ls-export-group">
              <button type="button" className="ls-export-btn is-primary" onClick={() => void handleCopy()}>
                <Copy size={14} strokeWidth={1.8} aria-hidden />
                {tl.copy}
              </button>
              <button type="button" className="ls-export-btn" onClick={() => void handleWord()}>
                <FileType2 size={14} strokeWidth={1.8} aria-hidden />
                {tl.wordDoc}
              </button>
              <button type="button" className="ls-export-btn" onClick={handlePdf}>
                <FileDown size={14} strokeWidth={1.8} aria-hidden />
                {tl.printPdf}
              </button>
              <button type="button" className="ls-export-btn" onClick={handleTxt}>
                <FileText size={14} strokeWidth={1.8} aria-hidden />
                {tl.txtFile}
              </button>
              <button type="button" className="ls-export-btn" onClick={handlePrint} aria-label={tl.print} title={tl.print}>
                <Printer size={15} strokeWidth={1.8} aria-hidden />
              </button>
              <button type="button" className="ls-export-btn" onClick={handleEmail}>
                <Mail size={14} strokeWidth={1.8} aria-hidden />
                {tl.emailLetter}
              </button>
            </div>
            <div className="ls-status">
              <span>{sourceLabel[source]}</span>
              <span>·</span>
              <span>{quality.wordCount} {tl.wordCount}</span>
              <span>·</span>
              <span>{quality.readingMinutes} {tl.readTime}</span>
              {savedAt && (
                <>
                  <span>·</span>
                  <span>{tl.savedAt} {new Date(savedAt).toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <LetterLibrary
        drafts={drafts}
        activeId={activeId}
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onOpenDraft={loadDraft}
        onNew={resetStudio}
        onDuplicate={duplicateDraft}
        onRename={renameDraft}
        onDelete={deleteDraft}
        onExport={exportBackup}
        onImport={importBackup}
        onImportError={() => notify(tl.backupInvalid, 'warn')}
      />

      {toast && <div className={`ls-toast is-${toast.tone}`} role="status">{toast.message}</div>}
    </div>
  );
}
