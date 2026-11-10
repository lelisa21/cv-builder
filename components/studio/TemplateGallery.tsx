'use client';

import React, { useMemo, useState } from 'react';
import type { DesignConfig, TemplatePreset } from '@/lib/studio/types';
import { fontStack } from '@/lib/studio/fonts';
import { TEMPLATES } from '@/lib/studio/templates';
import { Icon } from './Icon';
import { useStudio } from './StudioProvider';

const CATEGORIES = ['All', 'Editorial', 'Modern', 'Executive', 'Academic', 'Technical', 'Creative'] as const;

type Category = (typeof CATEGORIES)[number];

/** A tiny editorial poster built from the template's own design tokens. */
export function TemplatePreview({ design }: { design: DesignConfig }) {
  const { layout, color, type } = design;
  const twoColumn = layout.columns !== 'single';
  const asideLeft = layout.columns === 'aside-left';
  const name = type.nameCase === 'upper' ? 'Abeba Kebede' : 'Abeba Kebede';

  const Aside = (
    <span className="tpl-aside" style={{ background: color.aside, color: color.asideInk }}>
      {layout.photoEnabled && <span className="tpl-photo" style={{ background: color.asideInk }} />}
      <span className="tpl-aside-title">Contact</span>
      <span className="tpl-line" />
      <span className="tpl-line is-short" />
      <span className="tpl-aside-title">Skills</span>
      <span className="tpl-tags">
        <span>Research</span>
        <span>Systems</span>
        <span>Figma</span>
        <span>React</span>
        <span>Strategy</span>
      </span>
      <span className="tpl-aside-title">Languages</span>
      <span className="tpl-line" />
      <span className="tpl-line is-tiny" />
    </span>
  );

  return (
    <span
      className="tpl-preview"
      data-header={layout.headerStyle}
      data-section={layout.sectionStyle}
      style={
        {
          background: color.paper,
          color: color.ink,
          fontFamily: fontStack(type.bodyFont),
          '--tpl-accent': color.accent,
          '--tpl-muted': color.muted,
          '--tpl-rule': `color-mix(in srgb, ${color.ink} 15%, transparent)`,
          '--tpl-soft': `color-mix(in srgb, ${color.ink} 8%, transparent)`,
          '--tpl-paper': color.paper,
          '--tpl-aside-width': `${layout.asideWidth}%`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <span className="tpl-head">
        <span className="tpl-head-main">
          <span
            className="tpl-name"
            style={{
              fontFamily: fontStack(type.displayFont),
              letterSpacing: `${type.nameTracking * 0.22}px`,
              textTransform: type.nameCase === 'upper' ? 'uppercase' : 'none',
            }}
          >
            {name}
          </span>
          <span className="tpl-headline">Product Designer · Design Systems</span>
        </span>
        <span className="tpl-contact">
          <span>abeba@bekele.design</span>
          <span>Addis Ababa · Remote</span>
          <span>bekele.design</span>
        </span>
      </span>

      <span className="tpl-body">
        {twoColumn && asideLeft && Aside}
        <span className="tpl-main">
          <span className="tpl-section">
            <span className="tpl-section-title">Profile</span>
            <span className="tpl-line" />
            <span className="tpl-line" />
            <span className="tpl-line is-short" />
          </span>

          <span className="tpl-section">
            <span className="tpl-section-title">Experience</span>
            <span className="tpl-entry">
              <span className="tpl-entry-head">
                <span className="tpl-entry-title">Senior Product Designer</span>
                <span className="tpl-date">2022—Now</span>
              </span>
              <span className="tpl-entry-sub">Orbit Labs</span>
              <span className="tpl-bullet" />
              <span className="tpl-bullet is-short" />
              <span className="tpl-bullet is-tiny" />
            </span>
            <span className="tpl-entry">
              <span className="tpl-entry-head">
                <span className="tpl-entry-title">Product Designer</span>
                <span className="tpl-date">2020—22</span>
              </span>
              <span className="tpl-entry-sub">Kindred Studio</span>
              <span className="tpl-bullet" />
              <span className="tpl-bullet is-short" />
            </span>
          </span>

          <span className="tpl-section">
            <span className="tpl-section-title">Education</span>
            <span className="tpl-entry">
              <span className="tpl-entry-head">
                <span className="tpl-entry-title">BSc Software Engineering</span>
                <span className="tpl-date">2016—20</span>
              </span>
              <span className="tpl-entry-sub">Addis Ababa University</span>
            </span>
          </span>
        </span>
        {twoColumn && !asideLeft && Aside}
      </span>
    </span>
  );
}

function TemplateCard({
  template,
  current,
  onUse,
}: {
  template: TemplatePreset;
  current: boolean;
  onUse: () => void;
}) {
  return (
    <button
      type="button"
      className={`template-card ${current ? 'is-current' : ''}`}
      onClick={onUse}
      aria-label={`Use the ${template.name} template`}
    >
      <span className="template-card-frame">
        <TemplatePreview design={template.design} />
        {current && <span className="template-card-badge">In use</span>}
        <span className="template-card-hover">
          <span className="template-card-use">
            <Icon name={current ? 'check' : 'template'} size={12} />
            {current ? 'Current template' : `Use ${template.name}`}
          </span>
        </span>
      </span>
      <span className="template-card-info">
        <span>
          <span className="template-card-name">{template.name}</span>
          <span className="template-card-tagline">{template.tagline}</span>
        </span>
        <span className="template-card-cat">{template.category}</span>
      </span>
      <span className="template-card-swatches">
        {template.swatches.map((swatch) => (
          <span key={swatch} style={{ background: swatch }} />
        ))}
        <span className="template-card-tags">{template.tags.join(' · ')}</span>
      </span>
    </button>
  );
}

export function TemplateGallery() {
  const { doc, setOverlay, applyTemplate } = useStudio();
  const [filter, setFilter] = useState<Category>('All');

  const visible = useMemo(
    () => (filter === 'All' ? TEMPLATES : TEMPLATES.filter((template) => template.category === filter)),
    [filter],
  );

  return (
    <div
      className="studio-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Template gallery"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOverlay(null);
      }}
    >
      <div className="gallery-shell">
        <div className="gallery-head">
          <div className="gallery-title-wrap">
            <h2 className="gallery-title">The template atelier</h2>
            <span className="gallery-sub">Six systems · one document</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="gallery-filters" role="group" aria-label="Filter templates">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`gallery-filter ${filter === category ? 'is-active' : ''}`}
                  aria-pressed={filter === category}
                  onClick={() => setFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="studio-icon-btn"
              onClick={() => setOverlay(null)}
              aria-label="Close template gallery"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
        <div className="gallery-body">
          <div className="gallery-grid">
            {visible.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                current={doc.design.templateId === template.id}
                onUse={() => applyTemplate(template.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
