'use client';

import React from 'react';
import { SECTION_META } from '@/lib/studio/sections';
import { Icon } from './Icon';
import { useStudio } from './StudioProvider';

export function SectionLibrary() {
  const { doc, addSection, setOverlay } = useStudio();

  return (
    <div
      className="studio-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Add a section"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOverlay(null);
      }}
    >
      <div className="studio-modal">
        <div className="studio-modal-head">
          <div>
            <div className="studio-modal-title">Add to the document</div>
            <div className="studio-modal-sub">Sections are blocks you can place anywhere</div>
          </div>
          <button
            type="button"
            className="studio-icon-btn"
            onClick={() => setOverlay(null)}
            aria-label="Close section library"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="studio-modal-body">
          <div className="library-grid">
            {SECTION_META.map((meta) => {
              const count = doc.sections.filter((section) => section.kind === meta.kind).length;
              return (
                <button
                  key={meta.kind}
                  type="button"
                  className="library-item"
                  onClick={() => {
                    addSection(meta.kind);
                    setOverlay(null);
                  }}
                >
                  <span className="library-item-icon">
                    <Icon name={meta.icon} size={14} />
                  </span>
                  <span>
                    <span className="library-item-name">
                      {meta.title}
                      {count > 0 && (
                        <span className="library-count"> · {count} in use</span>
                      )}
                    </span>
                    <span className="library-item-desc">{meta.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
