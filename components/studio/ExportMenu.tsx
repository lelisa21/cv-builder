'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  copyText,
  exportDocx,
  exportJson,
  exportPng,
  exportText,
  printResume,
} from '@/lib/studio/export';
import { blocksToText } from '@/lib/studio/blocks';
import { Icon, type IconName } from './Icon';
import { useStudio } from './StudioProvider';

interface MenuItem {
  label: string;
  description: string;
  icon: IconName;
  action: () => void | Promise<void>;
}

export function ExportMenu() {
  const {
    doc,
    busy,
    setBusy,
    pushToast,
    saveCloud,
    savingCloud,
    importDocumentJson,
    startBlank,
    startSample,
    importFromProfile,
  } = useStudio();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = async (action: () => void | Promise<void>) => {
    setOpen(false);
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      pushToast(message, 'error');
    }
  };

  const downloadPng = async () => {
    setBusy(true);
    pushToast('Rendering page images…', 'info');
    try {
      const pages = await exportPng(doc);
      pushToast(`${pages} page${pages > 1 ? 's' : ''} exported as PNG`);
    } finally {
      setBusy(false);
    }
  };

  const downloadDocx = async () => {
    setBusy(true);
    try {
      await exportDocx(doc);
      pushToast('Word document exported');
    } finally {
      setBusy(false);
    }
  };

  const copyPlain = async () => {
    const ok = await copyText(blocksToText(doc));
    pushToast(ok ? 'Plain text copied for ATS forms' : 'Copy failed', ok ? 'success' : 'error');
  };

  const groups: MenuItem[][] = [
    [
      {
        label: 'Print or save as PDF',
        description: 'Browser print · highest fidelity, vector type',
        icon: 'printer',
        action: () => {
          printResume(doc);
          pushToast('Opening the print dialogue', 'info');
        },
      },
      {
        label: 'Export PNG',
        description: 'Every page as a crisp, shareable image',
        icon: 'image',
        action: downloadPng,
      },
      {
        label: 'Export Word',
        description: 'Editable .docx for portals and recruiters',
        icon: 'file',
        action: downloadDocx,
      },
    ],
    [
      {
        label: 'Export a backup',
        description: 'A complete .json studio document',
        icon: 'json',
        action: () => {
          exportJson(doc);
          pushToast('Backup downloaded');
        },
      },
      {
        label: 'Download plain text',
        description: 'ATS-friendly .txt with no styling',
        icon: 'text',
        action: () => {
          exportText(doc);
          pushToast('Plain text downloaded');
        },
      },
      {
        label: 'Copy plain text',
        description: 'Paste into an application form',
        icon: 'copy',
        action: copyPlain,
      },
    ],
    [
      {
        label: savingCloud ? 'Saving to account…' : 'Save to your account',
        description: 'Sync this document to the cloud',
        icon: 'cloud',
        action: saveCloud,
      },
      {
        label: 'Import profile details',
        description: 'Pull name, roles and skills from Profile',
        icon: 'user',
        action: importFromProfile,
      },
      {
        label: 'Restore studio backup',
        description: 'Open a .json document from disk',
        icon: 'upload',
        action: () => fileRef.current?.click(),
      },
    ],
    [
      {
        label: 'Start a blank resume',
        description: 'Keep the current design, clear the content',
        icon: 'file',
        action: startBlank,
      },
      {
        label: 'Load the sample document',
        description: 'A complete example to learn from',
        icon: 'sparkles',
        action: startSample,
      },
    ],
  ];

  return (
    <div className="studio-export" ref={wrapRef}>
      <button
        type="button"
        className="studio-btn studio-btn--primary"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
      >
        <Icon name={busy ? 'sparkles' : 'download'} size={14} />
        <span>{busy ? 'Working…' : 'Export'}</span>
        <Icon name="chevronDown" size={11} />
      </button>

      {open && (
        <div className="studio-menu" role="menu" aria-label="Export and document actions">
          {groups.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {groupIndex > 0 && <div className="studio-menu-sep" />}
              {group.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className="studio-menu-item"
                  onClick={() => run(item.action)}
                >
                  <Icon name={item.icon} size={14} />
                  <span>
                    <span className="studio-menu-label">{item.label}</span>
                    <span className="studio-menu-desc">{item.description}</span>
                  </span>
                </button>
              ))}
            </React.Fragment>
          ))}

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              const text = await file.text();
              importDocumentJson(text);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
