'use client';

import { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import type { LetterDraft } from '@/types/letters';

interface LetterLibraryProps {
  drafts: LetterDraft[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onOpenDraft: (draft: LetterDraft) => void;
  onNew: () => void;
  onDuplicate: (draft: LetterDraft) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (drafts: LetterDraft[]) => void;
  onImportError: () => void;
}

export default function LetterLibrary({
  drafts,
  activeId,
  open,
  onClose,
  onOpenDraft,
  onNew,
  onDuplicate,
  onRename,
  onDelete,
  onExport,
  onImport,
  onImportError,
}: LetterLibraryProps) {
  const { t } = useApp();
  const tl = t.letters;
  const fileRef = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  if (!open) return null;

  const kindLabel = (draft: LetterDraft) => {
    if (draft.form.kind === 'cover') return tl.coverLetter;
    if (draft.form.kind === 'followup') return tl.followUp;
    if (draft.form.kind === 'inquiry') return tl.inquiry;
    return tl.formalApp;
  };

  const commitRename = (id: string) => {
    const value = renameValue.trim();
    if (value) onRename(id, value);
    setRenaming(null);
    setRenameValue('');
  };

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const list = Array.isArray(parsed) ? parsed : (parsed as { drafts?: unknown }).drafts;
      if (!Array.isArray(list)) {
        onImportError();
        return;
      }
      const imported = list.filter((item): item is LetterDraft => {
        const draft = item as Partial<LetterDraft> | null;
        return Boolean(draft && typeof draft.id === 'string' && typeof draft.content === 'string' && draft.form && typeof draft.form === 'object');
      });
      if (imported.length) onImport(imported);
      else onImportError();
    } catch {
      onImportError();
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="ls-library-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="ls-library" role="dialog" aria-modal="true" aria-label={tl.library}>
        <header className="ls-library-head">
          <div>
            <h2>{tl.library}</h2>
            <p>{drafts.length} {tl.wordCount}</p>
          </div>
          <button type="button" className="ls-icon-btn" onClick={onClose} aria-label={tl.close}>
            <X size={17} strokeWidth={1.8} aria-hidden />
          </button>
        </header>

        <div className="ls-library-actions">
          <button type="button" className="ls-small-btn is-primary" onClick={onNew}>
            <Plus size={14} strokeWidth={1.8} aria-hidden />
            {tl.newLetter}
          </button>
          <button type="button" className="ls-small-btn" onClick={onExport}>
            <Download size={14} strokeWidth={1.8} aria-hidden />
            {tl.backupExport}
          </button>
          <button type="button" className="ls-small-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={14} strokeWidth={1.8} aria-hidden />
            {tl.backupImport}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </div>

        <div className="ls-library-list">
          {drafts.length === 0 && <p className="ls-library-empty">{tl.emptyLibrary}</p>}
          {drafts.map((draft) => (
            <article className={`ls-library-item${draft.id === activeId ? ' is-active' : ''}`} key={draft.id}>
              {renaming === draft.id ? (
                <div className="ls-rename-row">
                  <input
                    className="ls-input"
                    value={renameValue}
                    autoFocus
                    onChange={(event) => setRenameValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitRename(draft.id);
                      if (event.key === 'Escape') setRenaming(null);
                    }}
                  />
                  <button type="button" className="ls-small-btn is-primary" onClick={() => commitRename(draft.id)} aria-label={tl.renameDraft}>
                    <Check size={14} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              ) : (
                <>
                  <button type="button" className="ls-library-open" onClick={() => onOpenDraft(draft)}>
                    <strong>{draft.title}</strong>
                    <span>{kindLabel(draft)} · {draft.form.company || draft.form.position || tl.newLetter}</span>
                    <small>{tl.savedAt} {new Date(draft.updatedAt).toLocaleString()}</small>
                  </button>
                  <div className="ls-library-tools">
                    <button type="button" onClick={() => onOpenDraft(draft)} aria-label={tl.openDraft}>
                      <FolderOpen size={13} strokeWidth={1.8} aria-hidden />
                      {tl.openDraft}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenaming(draft.id);
                        setRenameValue(draft.title);
                      }}
                      aria-label={tl.renameDraft}
                    >
                      <Pencil size={13} strokeWidth={1.8} aria-hidden />
                      {tl.renameDraft}
                    </button>
                    <button type="button" onClick={() => onDuplicate(draft)} aria-label={tl.duplicateDraft}>
                      <Copy size={13} strokeWidth={1.8} aria-hidden />
                      {tl.duplicateDraft}
                    </button>
                    <button type="button" className="is-danger" onClick={() => onDelete(draft.id)} aria-label={tl.deleteDraft}>
                      <Trash2 size={13} strokeWidth={1.8} aria-hidden />
                      {tl.deleteDraft}
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
