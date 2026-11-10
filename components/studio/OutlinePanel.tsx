'use client';

import React, { useMemo, useState } from 'react';
import { getTemplate } from '@/lib/studio/templates';
import { iconForSection } from '@/lib/studio/sections';
import { Icon } from './Icon';
import { useStudio } from './StudioProvider';

function totalWords(doc: ReturnType<typeof useStudio>['doc']): number {
  const text = [
    doc.basics.name,
    doc.basics.headline,
    ...doc.sections
      .filter((section) => section.visible)
      .flatMap((section) => [
        section.title,
        ...section.items.flatMap((entry) => [
          entry.title || '',
          entry.subtitle || '',
          entry.description || '',
          ...entry.bullets,
          ...entry.tags,
        ]),
      ]),
  ];
  return text.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

export function OutlinePanel() {
  const {
    doc,
    selection,
    setSelection,
    setTab,
    setOverlay,
    updateSection,
    reorderSections,
    setMobilePanel,
    pageCount,
  } = useStudio();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const visibleSections = useMemo(
    () => doc.sections.filter((section) => section.visible).length,
    [doc.sections],
  );
  const words = useMemo(() => totalWords(doc), [doc]);
  const template = getTemplate(doc.design.templateId);

  const choose = (id: string) => {
    setSelection(id);
    setTab('content');
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      setMobilePanel('inspector');
    }
  };

  return (
    <>
      <div className="studio-panel-head">
        <span className="studio-panel-title">Document</span>
        <span className="studio-mono" style={{ fontSize: 8.5, color: '#5d5a53' }}>
          {pageCount}p · {words}w
        </span>
      </div>

      <div className="studio-left-scroll">
        <div
          className={`doc-card ${selection === 'basics' ? 'is-active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => choose('basics')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              choose('basics');
            }
          }}
        >
          <div className="doc-card-kicker">Active resume</div>
          <div className="doc-card-name">{doc.basics.name || doc.title || 'Untitled resume'}</div>
          <div className="doc-card-role">
            {doc.basics.headline || 'Add a professional headline'}
          </div>
          <div className="doc-card-stats">
            <span>
              <Icon name="file" size={10} /> {pageCount} page{pageCount > 1 ? 's' : ''}
            </span>
            <span>
              <Icon name="text" size={10} /> {words} words
            </span>
            <span>
              <Icon name="layers" size={10} /> {visibleSections} sections
            </span>
          </div>
        </div>

        <div className="outline-group">
          <div className="outline-group-head">
            <span>Identity</span>
          </div>
          <div
            className={`outline-row ${selection === 'basics' ? 'is-active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => choose('basics')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                choose('basics');
              }
            }}
          >
            <span className="outline-grip" aria-hidden="true">
              <Icon name="user" size={11} />
            </span>
            <span className="outline-icon">
              <Icon name="user" size={12} />
            </span>
            <span className="outline-label">Name, contact & photo</span>
            <span className="outline-count">
              {[doc.basics.email, doc.basics.phone, doc.basics.location].filter(Boolean).length}/3
            </span>
          </div>
        </div>

        <div className="outline-group">
          <div className="outline-group-head">
            <span>Sections</span>
            <span>{doc.sections.length}</span>
          </div>

          {doc.sections.map((section) => (
            <div
              key={section.id}
              className={`outline-row ${selection === section.id ? 'is-active' : ''} ${
                section.visible ? '' : 'is-hidden'
              } ${overId === section.id ? 'is-drop-target' : ''}`}
              draggable
              role="button"
              tabIndex={0}
              onClick={() => choose(section.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  choose(section.id);
                }
              }}
              onDragStart={(event) => {
                setDragId(section.id);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', section.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragId && dragId !== section.id) setOverId(section.id);
              }}
              onDragLeave={() => setOverId((current) => (current === section.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                const from = event.dataTransfer.getData('text/plain') || dragId;
                if (from && from !== section.id) reorderSections(from, section.id);
                setDragId(null);
                setOverId(null);
              }}
            >
              <span className="outline-grip" aria-hidden="true" title="Drag to reorder">
                <Icon name="grip" size={11} />
              </span>
              <span className="outline-icon">
                <Icon name={iconForSection(section)} size={12} />
              </span>
              <span className="outline-label">{section.title}</span>
              <span className="outline-count">{section.items.length}</span>
              <button
                type="button"
                className="outline-eye"
                aria-label={section.visible ? `Hide ${section.title}` : `Show ${section.title}`}
                title={section.visible ? 'Hide section' : 'Show section'}
                onClick={(event) => {
                  event.stopPropagation();
                  updateSection(section.id, { visible: !section.visible });
                }}
              >
                <Icon name={section.visible ? 'eye' : 'eyeOff'} size={12} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="outline-add"
            onClick={() => setOverlay('library')}
          >
            <Icon name="plus" size={13} />
            Add a section
          </button>
        </div>
      </div>

      <div className="outline-footer">
        <button
          type="button"
          className="template-chip"
          onClick={() => setOverlay('gallery')}
          title="Browse the template gallery"
        >
          <span className="template-chip-swatch">
            <span
              style={{
                background: `linear-gradient(160deg, ${template.swatches[0]} 0%, ${template.swatches[0]} 46%, ${template.swatches[3]} 46%, ${template.swatches[3]} 100%)`,
              }}
            />
          </span>
          <span className="template-chip-body">
            <span className="template-chip-kicker">Template</span>
            <span className="template-chip-name">{template.name}</span>
            <span className="template-chip-sub">{template.tagline}</span>
          </span>
          <Icon name="chevronRight" size={13} />
        </button>
      </div>
    </>
  );
}
