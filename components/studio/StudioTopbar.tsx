'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import { ExportMenu } from './ExportMenu';
import { useStudio } from './StudioProvider';

function SaveState() {
  const { saveState, lastSavedAt, flushLocalSave } = useStudio();
  const label =
    saveState === 'saving'
      ? 'Saving'
      : lastSavedAt
        ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Saved locally';

  return (
    <button
      type="button"
      className="studio-save-state"
      onClick={flushLocalSave}
      title="Save now (Ctrl/Cmd + S)"
    >
      <span className={`studio-save-dot ${saveState === 'saving' ? 'is-saving' : ''}`} />
      <span>{label}</span>
    </button>
  );
}

export function StudioTopbar() {
  const {
    doc,
    setTitle,
    tab,
    setTab,
    setOverlay,
    preview,
    setPreview,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useStudio();

  return (
    <header className="studio-topbar">
      <Link href="/" className="studio-brand" aria-label="Lelisa home">
        <span className="studio-brand-name">Lelisa</span>
        <span className="studio-brand-tag">Studio</span>
      </Link>

      <span className="studio-topbar-divider" />

      <div className="studio-doc-meta">
        <input
          className="studio-doc-title"
          value={doc.title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Document title"
          spellCheck={false}
        />
        <SaveState />
      </div>

      <div className="studio-topbar-actions">
        <div className="studio-undo-redo studio-hide-preview">
          <button
            type="button"
            className="studio-icon-btn"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo — Ctrl/Cmd + Z"
          >
            <Icon name="undo" size={15} />
          </button>
          <button
            type="button"
            className="studio-icon-btn"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo — Ctrl/Cmd + Shift + Z"
          >
            <Icon name="redo" size={15} />
          </button>
        </div>

        <button
          type="button"
          className="studio-icon-btn studio-hide-preview"
          onClick={() => setOverlay('palette')}
          aria-label="Open the command palette"
          title="Command palette — Ctrl/Cmd + K"
        >
          <Icon name="command" size={15} />
        </button>

        <button
          type="button"
          className={`studio-btn studio-btn--outline studio-hide-preview ${tab === 'design' ? 'is-active' : ''}`}
          onClick={() => setTab('design')}
          title="Open design controls"
        >
          <Icon name="sliders" size={13} />
          <span>Design</span>
        </button>

        <button
          type="button"
          className="studio-btn studio-btn--outline studio-hide-preview"
          onClick={() => setOverlay('gallery')}
          title="Browse templates"
        >
          <Icon name="template" size={13} />
          <span>Templates</span>
        </button>

        <button
          type="button"
          className={`studio-icon-btn studio-preview-btn ${preview ? 'is-active' : ''}`}
          onClick={() => setPreview(!preview)}
          aria-label={preview ? 'Exit preview' : 'Preview the resume'}
          title={preview ? 'Exit preview — Esc' : 'Preview — hide the studio'}
        >
          <Icon name={preview ? 'eyeOff' : 'eye'} size={15} />
        </button>

        <span className="studio-topbar-divider studio-hide-preview" />

        <ExportMenu />
      </div>
    </header>
  );
}
