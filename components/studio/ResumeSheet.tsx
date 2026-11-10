'use client';

import React, { useLayoutEffect, useRef } from 'react';
import type { DesignConfig, ResumeBasics, ResumeDocument, ResumeItem, ResumeSection } from '@/lib/studio/types';
import type { RenderBlock } from '@/lib/studio/blocks';
import { fontStack } from '@/lib/studio/fonts';
import { Icon, type IconName } from './Icon';

export interface MeasureResult {
  headerHeight: number;
  photoHeight: number;
  blockHeights: Record<string, number>;
}

const contactIcon = (key: string): IconName => {
  if (key === 'email') return 'mail';
  if (key === 'phone') return 'phone';
  if (key === 'location') return 'pin';
  if (key === 'linkedin') return 'linkedin';
  return 'globe';
};

const stripProtocol = (value: string) => value.replace(/^https?:\/\//, '').replace(/\/$/, '');

function contactRows(basics: ResumeBasics) {
  return [
    { key: 'email', value: basics.email },
    { key: 'phone', value: basics.phone },
    { key: 'location', value: basics.location },
    { key: 'website', value: stripProtocol(basics.website) },
    { key: 'linkedin', value: stripProtocol(basics.linkedin) },
  ].filter((entry) => entry.value.trim());
}

export function sheetStyle(design: DesignConfig): React.CSSProperties {
  const { color, layout, type } = design;
  return {
    '--rs-paper': color.paper,
    '--rs-ink': color.ink,
    '--rs-muted': color.muted,
    '--rs-accent': color.accent,
    '--rs-aside-bg': color.aside,
    '--rs-aside-ink': color.asideInk,
    '--rs-aside-accent': `color-mix(in srgb, ${color.accent} 52%, ${color.asideInk})`,
    '--rs-rule': `color-mix(in srgb, ${color.ink} 18%, transparent)`,
    '--rs-rule-strong': `color-mix(in srgb, ${color.ink} 38%, transparent)`,
    '--rs-tint': `color-mix(in srgb, ${color.accent} 9%, ${color.paper})`,
    '--rs-aside-soft': `color-mix(in srgb, ${color.asideInk} 12%, transparent)`,
    '--rs-font-display': fontStack(type.displayFont),
    '--rs-font-body': fontStack(type.bodyFont),
    '--rs-name-size': `${type.nameSize}px`,
    '--rs-heading-size': `${type.headingSize}px`,
    '--rs-body-size': `${type.bodySize}px`,
    '--rs-line-height': String(type.lineHeight),
    '--rs-name-tracking': `${type.nameTracking}px`,
    '--rs-heading-tracking': `${type.headingTracking}px`,
    '--rs-heading-case': type.headingCase === 'upper' ? 'uppercase' : 'none',
    '--rs-name-case': type.nameCase === 'upper' ? 'uppercase' : 'none',
    '--rs-margin-x': `${layout.marginX}px`,
    '--rs-margin-y': `${layout.marginY}px`,
    '--rs-gap': `${layout.gap}px`,
    '--rs-section-gap': `${layout.sectionGap}px`,
    '--rs-item-gap': `${layout.itemGap}px`,
    '--rs-aside-width': `${layout.asideWidth}%`,
    '--rs-aside-radius': `${layout.asideRadius}px`,
    '--rs-photo-size': `${layout.photoSize}px`,
  } as React.CSSProperties;
}

function Photo({ basics, design, className }: { basics: ResumeBasics; design: DesignConfig; className?: string }) {
  if (!design.layout.photoEnabled || !basics.photo) return null;
  const radius =
    design.layout.photoShape === 'circle' ? '50%' : design.layout.photoShape === 'rounded' ? '16px' : '0';
  return (
    <img
      src={basics.photo}
      alt={basics.name ? `${basics.name} portrait` : 'Portrait'}
      className={`rs-photo ${className || ''}`}
      style={{ width: design.layout.photoSize, height: design.layout.photoSize, borderRadius: radius }}
    />
  );
}

function ContactList({ basics, design, tone = 'default' }: { basics: ResumeBasics; design: DesignConfig; tone?: 'default' | 'paper' }) {
  const rows = contactRows(basics);
  if (rows.length === 0) return null;
  return (
    <ul className={`rs-contact rs-contact--${tone}`}>
      {rows.map((row) => (
        <li key={row.key}>
          {design.layout.showIcons && <Icon name={contactIcon(row.key)} size={10} strokeWidth={1.8} />}
          <span>{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

function ResumeHeader({ doc, design }: { doc: ResumeDocument; design: DesignConfig }) {
  const { basics } = doc;
  const style = design.layout.headerStyle;
  const hasPhoto = design.layout.photoEnabled && Boolean(basics.photo);
  return (
    <header className={`rs-header rs-header--${style} ${design.layout.headerRule ? 'has-rule' : ''}`}>
      {basics.availability && style !== 'banner' && <div className="rs-eyebrow">{basics.availability}</div>}
      <div className="rs-header-inner">
        <div className="rs-identity">
          <h1 className="rs-name">{basics.name || 'Your Name'}</h1>
          <div className="rs-headline">{basics.headline || 'Your professional headline'}</div>
        </div>
        {style === 'split' || style === 'compact' ? (
          <div className="rs-header-meta">
            <ContactList basics={basics} design={design} tone="default" />
          </div>
        ) : null}
        {hasPhoto && style !== 'banner' && (
          <div className="rs-header-photo">
            <Photo basics={basics} design={design} />
          </div>
        )}
      </div>
      {style === 'centered' && (
        <div className="rs-header-meta rs-header-meta--centered">
          <ContactList basics={basics} design={design} />
        </div>
      )}
      {style === 'banner' && (
        <div className="rs-banner-meta">
          {basics.availability && <div className="rs-eyebrow">{basics.availability}</div>}
          <ContactList basics={basics} design={design} tone="paper" />
        </div>
      )}
    </header>
  );
}

function LevelDots({ level }: { level: string }) {
  const normalized = level.toLowerCase();
  const score = normalized.includes('native')
    ? 5
    : normalized.includes('fluent')
      ? 5
      : normalized.includes('advanced')
        ? 4
        : normalized.includes('conversational')
          ? 3
          : normalized.includes('intermediate')
            ? 3
            : normalized.includes('basic')
              ? 2
              : 0;
  if (!score) return <span className="rs-level-text">{level}</span>;
  return (
    <span className="rs-level" aria-label={level}>
      {[1, 2, 3, 4, 5].map((dot) => (
        <span key={dot} className={dot <= score ? 'is-filled' : ''} />
      ))}
      <span className="rs-level-text">{level}</span>
    </span>
  );
}

function ItemView({ section, item }: { section: ResumeSection; item: ResumeItem }) {
  if (section.kind === 'summary') {
    return <p className="rs-summary">{item.description || 'Add a short professional profile.'}</p>;
  }

  if (section.kind === 'skills' || section.variant === 'tags') {
    return (
      <div className="rs-skill-group">
        {item.title && <div className="rs-group-title">{item.title}</div>}
        <div className="rs-tags">
          {item.tags.map((tag) => (
            <span key={tag} className="rs-tag">
              {tag}
            </span>
          ))}
        </div>
        {item.description && <p className="rs-description">{item.description}</p>}
      </div>
    );
  }

  if (section.kind === 'languages') {
    return (
      <div className="rs-language">
        <span className="rs-language-name">{item.title}</span>
        <LevelDots level={item.subtitle || ''} />
      </div>
    );
  }

  if (section.kind === 'links') {
    return (
      <div className="rs-link-row">
        <span>{item.title}</span>
        <span className="rs-link-value">{item.link || item.subtitle}</span>
      </div>
    );
  }

  const compact = section.kind === 'certifications' || section.kind === 'awards' || section.variant === 'list';

  if (compact) {
    return (
      <div className="rs-item rs-item--compact">
        <div className="rs-item-copy">
          <span className="rs-item-title">{item.title}</span>
          {item.subtitle && <span className="rs-item-subtitle"> · {item.subtitle}</span>}
          {item.description && <span className="rs-item-desc-inline"> — {item.description}</span>}
        </div>
        {item.period && <span className="rs-period">{item.period}</span>}
      </div>
    );
  }

  return (
    <div className="rs-item">
      <div className="rs-item-top">
        <div className="rs-item-copy">
          <div className="rs-item-title-row">
            <span className="rs-item-title">{item.title}</span>
            {item.link && <span className="rs-item-link">{item.link}</span>}
          </div>
          {(item.subtitle || item.location) && (
            <div className="rs-item-subtitle">
              {item.subtitle}
              {item.subtitle && item.location ? ' · ' : ''}
              {item.location}
            </div>
          )}
        </div>
        {item.period && <div className="rs-period">{item.period}</div>}
      </div>
      {item.description && <p className="rs-description">{item.description}</p>}
      {item.bullets.some((bullet) => bullet.trim()) && (
        <ul className="rs-bullets">
          {item.bullets
            .filter((bullet) => bullet.trim())
            .map((bullet, index) => (
              <li key={`${item.id}-b-${index}`}>{bullet}</li>
            ))}
        </ul>
      )}
      {item.tags.length > 0 && (
        <div className="rs-inline-tags">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SectionChunk({
  block,
  design,
  showHeading = true,
  onSelect,
}: {
  block: RenderBlock;
  design: DesignConfig;
  showHeading?: boolean;
  onSelect?: () => void;
}) {
  const { section, items, sectionIndex, firstInSection } = block;
  const heading = showHeading && firstInSection;
  return (
    <div
      className={`rs-block ${heading ? 'rs-block--first' : ''}`}
      data-selectable={onSelect ? 'true' : undefined}
      onClick={onSelect}
      style={{
        paddingTop: heading ? 'var(--rs-section-gap)' : 'var(--rs-item-gap)',
      }}
    >
      {heading && (
        <div className={`rs-section-head rs-section-head--${design.layout.sectionStyle}`}>
          <div className="rs-section-head-inner">
            {design.layout.numberedSections && (
              <span className="rs-section-index">{String(sectionIndex + 1).padStart(2, '0')}</span>
            )}
            <h2>{section.title}</h2>
          </div>
          <span className="rs-section-line" />
        </div>
      )}
      <div className={`rs-items rs-items--${section.variant}`} data-kind={section.kind}>
        {items.map((item) => (
          <ItemView key={item.id} section={section} item={item} />
        ))}
      </div>
    </div>
  );
}

function AsideColumn({
  blocks,
  design,
  pageIndex,
  photo,
  onSelectSection,
}: {
  blocks: RenderBlock[];
  design: DesignConfig;
  pageIndex: number;
  photo: React.ReactNode;
  onSelectSection?: (id: string) => void;
}) {
  return (
    <aside className="rs-aside">
      {pageIndex === 0 && photo && <div className="rs-aside-photo-wrap">{photo}</div>}
      {blocks.map((block) => (
        <SectionChunk
          key={block.key}
          block={block}
          design={design}
          onSelect={
            onSelectSection ? () => onSelectSection(block.section.id) : undefined
          }
        />
      ))}
    </aside>
  );
}

export interface ResumeSheetProps {
  doc: ResumeDocument;
  pageW: number;
  pageH: number;
  pageIndex: number;
  pageCount: number;
  mainBlocks: RenderBlock[];
  asideBlocks: RenderBlock[];
  hasAside: boolean;
  asideLeft: boolean;
  isMeasure?: boolean;
  onSelectSection?: (id: string) => void;
}

export function ResumeSheet({
  doc,
  pageW,
  pageH,
  pageIndex,
  pageCount,
  mainBlocks,
  asideBlocks,
  hasAside,
  asideLeft,
  isMeasure = false,
  onSelectSection,
}: ResumeSheetProps) {
  const { design } = doc;
  const photo = <Photo basics={doc.basics} design={design} className="rs-aside-photo" />;
  return (
    <div
      className={`rs-sheet ${isMeasure ? 'rs-sheet--measure' : ''}`}
      style={{ ...sheetStyle(design), width: pageW, height: pageH }}
      data-template={design.templateId}
      data-page={pageIndex + 1}
    >
      <div
        className="rs-inner"
        style={{
          paddingTop: design.layout.marginY,
          paddingBottom: design.layout.marginY,
          paddingLeft: design.layout.marginX,
          paddingRight: design.layout.marginX,
        }}
      >
        {pageIndex === 0 && <ResumeHeader doc={doc} design={design} />}
        <div className={`rs-body ${hasAside ? 'rs-body--aside' : ''}`}>
          {hasAside && asideLeft && (
            <AsideColumn
              blocks={asideBlocks}
              design={design}
              pageIndex={pageIndex}
              photo={photo}
              onSelectSection={onSelectSection}
            />
          )}
          <main className="rs-main">
            {mainBlocks.map((block) => (
              <SectionChunk
                key={block.key}
                block={block}
                design={design}
                onSelect={
                  onSelectSection ? () => onSelectSection(block.section.id) : undefined
                }
              />
            ))}
          </main>
          {hasAside && !asideLeft && (
            <AsideColumn
              blocks={asideBlocks}
              design={design}
              pageIndex={pageIndex}
              photo={photo}
              onSelectSection={onSelectSection}
            />
          )}
        </div>
      </div>
      {design.layout.showPageNumbers && !isMeasure && (
        <div className="rs-page-number">
          <span>{String(pageIndex + 1).padStart(2, '0')}</span>
          <span className="rs-page-number-sep">/</span>
          <span>{String(pageCount).padStart(2, '0')}</span>
        </div>
      )}
    </div>
  );
}

export function MeasureSheet({
  doc,
  pageW,
  pageH,
  mainBlocks,
  asideBlocks,
  hasAside,
  asideLeft,
  onMeasure,
  revision = 0,
}: {
  doc: ResumeDocument;
  pageW: number;
  pageH: number;
  mainBlocks: RenderBlock[];
  asideBlocks: RenderBlock[];
  hasAside: boolean;
  asideLeft: boolean;
  onMeasure: (result: MeasureResult) => void;
  revision?: number;
}) {
  const { design } = doc;
  const headerRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const photo = <Photo basics={doc.basics} design={design} className="rs-aside-photo" />;

  useLayoutEffect(() => {
    let raf = 0;
    const run = () => {
      const heights: Record<string, number> = {};
      blockRefs.current.forEach((el, key) => {
        heights[key] = el.getBoundingClientRect().height;
      });
      onMeasure({
        headerHeight: headerRef.current?.getBoundingClientRect().height || 0,
        photoHeight: photoRef.current?.getBoundingClientRect().height || 0,
        blockHeights: heights,
      });
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [doc, design, pageW, pageH, onMeasure, revision]);

  const registerBlock = (key: string) => (el: HTMLDivElement | null) => {
    if (el) blockRefs.current.set(key, el);
    else blockRefs.current.delete(key);
  };

  return (
    <div
      className="rs-sheet rs-sheet--measure"
      style={{ ...sheetStyle(design), width: pageW, height: pageH }}
      data-template={design.templateId}
      aria-hidden="true"
    >
      <div
        className="rs-inner"
        style={{
          paddingTop: design.layout.marginY,
          paddingBottom: design.layout.marginY,
          paddingLeft: design.layout.marginX,
          paddingRight: design.layout.marginX,
        }}
      >
        <div ref={headerRef}>
          <ResumeHeader doc={doc} design={design} />
        </div>
        <div className={`rs-body ${hasAside ? 'rs-body--aside' : ''}`}>
          {hasAside && asideLeft && (
            <aside className="rs-aside">
              {design.layout.photoEnabled && doc.basics.photo && (
                <div ref={photoRef} className="rs-aside-photo-wrap">
                  {photo}
                </div>
              )}
              {asideBlocks.map((block) => (
                <div ref={registerBlock(block.key)} key={block.key}>
                  <SectionChunk block={block} design={design} />
                </div>
              ))}
            </aside>
          )}
          <main className="rs-main">
            {mainBlocks.map((block) => (
              <div ref={registerBlock(block.key)} key={block.key}>
                <SectionChunk block={block} design={design} />
              </div>
            ))}
          </main>
          {hasAside && !asideLeft && (
            <aside className="rs-aside">
              {design.layout.photoEnabled && doc.basics.photo && (
                <div ref={photoRef} className="rs-aside-photo-wrap">
                  {photo}
                </div>
              )}
              {asideBlocks.map((block) => (
                <div ref={registerBlock(block.key)} key={block.key}>
                  <SectionChunk block={block} design={design} />
                </div>
              ))}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
