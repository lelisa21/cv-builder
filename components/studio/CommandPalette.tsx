'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TEMPLATES } from '@/lib/studio/templates';
import { iconForSection } from '@/lib/studio/sections';
import { Icon, type IconName } from './Icon';
import { useStudio } from './StudioProvider';

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: IconName;
  run: () => void;
}

export function CommandPalette() {
  const {
    doc,
    setOverlay,
    setTab,
    setSelection,
    undo,
    redo,
    setPreview,
    applyTemplate,
    startBlank,
    startSample,
    importFromProfile,
    saveCloud,
    setMobilePanel,
  } = useStudio();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = () => setOverlay(null);

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      {
        id: 'tab-content',
        group: 'Workspace',
        label: 'Edit content',
        hint: 'Inspector',
        icon: 'text',
        run: () => setTab('content'),
      },
      {
        id: 'tab-design',
        group: 'Workspace',
        label: 'Design & typography',
        hint: 'Inspector',
        icon: 'palette',
        run: () => setTab('design'),
      },
      {
        id: 'tab-insights',
        group: 'Workspace',
        label: 'Resume quality & ATS',
        hint: 'Insights',
        icon: 'target',
        run: () => setTab('insights'),
      },
      {
        id: 'gallery',
        group: 'Workspace',
        label: 'Open the template gallery',
        hint: 'Templates',
        icon: 'template',
        run: () => setOverlay('gallery'),
      },
      {
        id: 'library',
        group: 'Workspace',
        label: 'Add a section',
        hint: 'Library',
        icon: 'plus',
        run: () => setOverlay('library'),
      },
      {
        id: 'preview',
        group: 'Workspace',
        label: 'Enter reading preview',
        hint: 'Focus',
        icon: 'eye',
        run: () => setPreview(true),
      },
      {
        id: 'undo',
        group: 'Document',
        label: 'Undo the last change',
        hint: 'Ctrl Z',
        icon: 'undo',
        run: undo,
      },
      {
        id: 'redo',
        group: 'Document',
        label: 'Redo the last change',
        hint: 'Ctrl Shift Z',
        icon: 'redo',
        run: redo,
      },
      {
        id: 'save',
        group: 'Document',
        label: 'Save to your account',
        hint: 'Cloud',
        icon: 'cloud',
        run: () => {
          void saveCloud();
        },
      },
      {
        id: 'profile',
        group: 'Document',
        label: 'Import details from Profile',
        hint: 'Profile',
        icon: 'user',
        run: importFromProfile,
      },
      {
        id: 'sample',
        group: 'Document',
        label: 'Load the sample resume',
        hint: 'Example',
        icon: 'sparkles',
        run: startSample,
      },
      {
        id: 'blank',
        group: 'Document',
        label: 'Start a blank resume',
        hint: 'New',
        icon: 'file',
        run: startBlank,
      },
    ];

    doc.sections.forEach((section) => {
      list.push({
        id: `jump-${section.id}`,
        group: 'Jump to section',
        label: section.title,
        hint: `${section.items.length} ${section.items.length === 1 ? 'entry' : 'entries'}`,
        icon: iconForSection(section),
        run: () => {
          setSelection(section.id);
          setTab('content');
          setMobilePanel('inspector');
        },
      });
    });

    TEMPLATES.forEach((template) => {
      list.push({
        id: `template-${template.id}`,
        group: 'Apply a template',
        label: template.name,
        hint: template.category,
        icon: 'template',
        run: () => applyTemplate(template.id),
      });
    });

    return list;
  }, [
    applyTemplate,
    doc.sections,
    importFromProfile,
    redo,
    saveCloud,
    setMobilePanel,
    setOverlay,
    setPreview,
    setSelection,
    setTab,
    startBlank,
    startSample,
    undo,
  ]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.group} ${command.hint || ''}`.toLowerCase().includes(needle),
    );
  }, [commands, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    node?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (command: Command) => {
    close();
    command.run();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => Math.min(filtered.length - 1, value + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => Math.max(0, value - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = filtered[active];
      if (command) run(command);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  let lastGroup = '';

  return (
    <div
      className="studio-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="palette-shell">
        <div className="palette-search">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search sections, templates and commands…"
            aria-label="Search commands"
            spellCheck={false}
          />
          <span className="studio-kbd">ESC</span>
        </div>

        <div className="palette-results" ref={listRef}>
          {filtered.length === 0 && (
            <div className="palette-empty">
              No command matches “{query}”. Try a section name or a template.
            </div>
          )}

          {filtered.map((command, index) => {
            const showGroup = command.group !== lastGroup;
            lastGroup = command.group;
            return (
              <React.Fragment key={command.id}>
                {showGroup && <div className="palette-group-label">{command.group}</div>}
                <button
                  type="button"
                  className={`palette-item ${index === active ? 'is-active' : ''}`}
                  data-active={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => run(command)}
                >
                  <span className="palette-item-icon">
                    <Icon name={command.icon} size={13} />
                  </span>
                  <span className="palette-item-label">{command.label}</span>
                  {command.hint && <span className="palette-item-hint">{command.hint}</span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="palette-footer">
          <span>
            <span className="studio-kbd">↑</span>
            <span className="studio-kbd">↓</span>
            to move
          </span>
          <span>
            <span className="studio-kbd">↵</span>
            to open
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <Icon name="command" size={10} /> K
          </span>
        </div>
      </div>
    </div>
  );
}
