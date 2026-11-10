'use client';

import React from 'react';
import type { ColorConfig, DesignConfig, FontKey } from '@/lib/studio/types';
import { FONT_LIST } from '@/lib/studio/fonts';
import { TEMPLATES } from '@/lib/studio/templates';
import { Icon } from './Icon';
import { useStudio } from './StudioProvider';
import {
  ColorField,
  RangeField,
  Seg,
  ToggleRow,
} from './fields';

interface Palette {
  name: string;
  colors: ColorConfig;
}

const PALETTES: Palette[] = [
  {
    name: 'Vermilion',
    colors: {
      accent: '#b34a2b',
      ink: '#1d1a15',
      muted: '#6e675c',
      paper: '#fbf8f1',
      aside: '#f2ece0',
      asideInk: '#1d1a15',
    },
  },
  {
    name: 'Cobalt',
    colors: {
      accent: '#3157e8',
      ink: '#18181c',
      muted: '#6f7076',
      paper: '#ffffff',
      aside: '#eef1fc',
      asideInk: '#18181c',
    },
  },
  {
    name: 'Forest',
    colors: {
      accent: '#0f6b50',
      ink: '#141917',
      muted: '#66706b',
      paper: '#fbfbfa',
      aside: '#edf2ee',
      asideInk: '#26312b',
    },
  },
  {
    name: 'Ochre',
    colors: {
      accent: '#8a6432',
      ink: '#1e1c18',
      muted: '#756e60',
      paper: '#fffdf6',
      aside: '#f2ecdf',
      asideInk: '#1e1c18',
    },
  },
  {
    name: 'Graphite',
    colors: {
      accent: '#44403c',
      ink: '#171615',
      muted: '#6b6863',
      paper: '#fcfbf9',
      aside: '#f0eeea',
      asideInk: '#171615',
    },
  },
  {
    name: 'Plum',
    colors: {
      accent: '#6d2f4b',
      ink: '#1c1519',
      muted: '#796a72',
      paper: '#fdf9fa',
      aside: '#f4e9ed',
      asideInk: '#1c1519',
    },
  },
  {
    name: 'Signal',
    colors: {
      accent: '#cf3f1f',
      ink: '#161616',
      muted: '#6b6b66',
      paper: '#ffffff',
      aside: '#f2f1ec',
      asideInk: '#24231f',
    },
  },
  {
    name: 'Midnight',
    colors: {
      accent: '#d8a55b',
      ink: '#f2eee5',
      muted: '#a8a296',
      paper: '#17181c',
      aside: '#22232a',
      asideInk: '#f2eee5',
    },
  },
];

function SwatchPoster({ design }: { design: DesignConfig }) {
  const aside = design.layout.columns !== 'single';
  return (
    <span className="template-mini-poster" style={{ background: design.color.paper }}>
      {design.layout.headerStyle === 'banner' && (
        <span style={{ position: 'absolute', inset: '0 0 auto 0', height: '18%', background: design.color.accent }} />
      )}
      {aside && (
        <span
          style={{
            width: '34%',
            background: design.color.aside,
            marginLeft: design.layout.columns === 'aside-right' ? 'auto' : undefined,
          }}
        />
      )}
      <span style={{ position: 'absolute', left: '12%', top: '26%', width: '50%', height: 3, background: design.color.ink, opacity: 0.8 }} />
      <span style={{ position: 'absolute', left: aside ? '44%' : '12%', top: '38%', width: '36%', height: 2, background: design.color.accent }} />
      <span style={{ position: 'absolute', left: aside ? '44%' : '12%', top: '50%', width: '40%', height: 1.5, background: design.color.muted, opacity: 0.5 }} />
      <span style={{ position: 'absolute', left: aside ? '44%' : '12%', top: '60%', width: '30%', height: 1.5, background: design.color.muted, opacity: 0.5 }} />
    </span>
  );
}

function DesignSection({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="design-section">
      <div className="design-section-head">
        <Icon name={icon} size={13} />
        <h3>{title}</h3>
        {hint && <span className="design-section-hint">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function DesignInspector() {
  const {
    doc,
    applyTemplate,
    patchLayout,
    patchType,
    patchColor,
    patchPage,
    resetDesign,
    pushToast,
  } = useStudio();
  const { design } = doc;
  const twoColumn = design.layout.columns !== 'single';

  const shufflePalette = () => {
    const others = PALETTES.filter((palette) => palette.colors.accent !== design.color.accent);
    const choice = others[Math.floor(Math.random() * others.length)] || PALETTES[0];
    patchColor(choice.colors);
    pushToast(`${choice.name} palette applied`, 'info');
  };

  return (
    <>
      <DesignSection title="Template" icon="template" hint={design.templateId}>
        <div className="template-mini-grid">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`template-mini ${design.templateId === template.id ? 'is-active' : ''}`}
              onClick={() => applyTemplate(template.id)}
              title={template.description}
            >
              <SwatchPoster design={template.design} />
              <span className="template-mini-name">{template.name}</span>
            </button>
          ))}
        </div>
        <div className="design-actions">
          <button type="button" className="mini-btn" onClick={resetDesign}>
            <Icon name="undo" size={11} />
            Reset design
          </button>
          <button type="button" className="mini-btn" onClick={shufflePalette}>
            <Icon name="palette" size={11} />
            Shuffle palette
          </button>
        </div>
      </DesignSection>

      <DesignSection title="Page" icon="file" hint={`${design.page.format} · ${design.page.orientation}`}>
        <div className="field">
          <span className="field-label">Format</span>
          <Seg
            label="Page format"
            value={design.page.format}
            options={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'US Letter' },
            ]}
            onChange={(format) => patchPage({ format })}
          />
        </div>
        <div className="field">
          <span className="field-label">Orientation</span>
          <Seg
            label="Orientation"
            value={design.page.orientation}
            options={[
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
            onChange={(orientation) => patchPage({ orientation })}
          />
        </div>
      </DesignSection>

      <DesignSection title="Grid" icon="layout" hint={twoColumn ? 'Two columns' : 'Single column'}>
        <div className="field">
          <span className="field-label">Columns</span>
          <Seg
            label="Column layout"
            value={design.layout.columns}
            options={[
              { value: 'single', label: 'Single' },
              { value: 'aside-left', label: 'Left rail' },
              { value: 'aside-right', label: 'Right rail' },
            ]}
            onChange={(columns) => patchLayout({ columns })}
          />
        </div>
        {twoColumn && (
          <RangeField
            label="Sidebar width"
            value={design.layout.asideWidth}
            min={20}
            max={44}
            unit="%"
            onChange={(asideWidth) => patchLayout({ asideWidth })}
          />
        )}
        <RangeField
          label="Horizontal margin"
          value={design.layout.marginX}
          min={28}
          max={96}
          unit="px"
          onChange={(marginX) => patchLayout({ marginX })}
        />
        <RangeField
          label="Vertical margin"
          value={design.layout.marginY}
          min={24}
          max={90}
          unit="px"
          onChange={(marginY) => patchLayout({ marginY })}
        />
        <RangeField
          label="Column gap"
          value={design.layout.gap}
          min={12}
          max={52}
          unit="px"
          onChange={(gap) => patchLayout({ gap })}
        />
        <RangeField
          label="Section spacing"
          value={design.layout.sectionGap}
          min={10}
          max={42}
          unit="px"
          onChange={(sectionGap) => patchLayout({ sectionGap })}
        />
        <RangeField
          label="Entry spacing"
          value={design.layout.itemGap}
          min={4}
          max={24}
          unit="px"
          onChange={(itemGap) => patchLayout({ itemGap })}
        />
      </DesignSection>

      <DesignSection title="Header" icon="user" hint={design.layout.headerStyle}>
        <div className="field">
          <span className="field-label">Composition</span>
          <Seg
            label="Header style"
            value={design.layout.headerStyle}
            options={[
              { value: 'split', label: 'Split' },
              { value: 'centered', label: 'Centered' },
              { value: 'banner', label: 'Banner' },
              { value: 'compact', label: 'Compact' },
            ]}
            onChange={(headerStyle) => patchLayout({ headerStyle })}
          />
        </div>
        <ToggleRow
          label="Rule under header"
          checked={design.layout.headerRule}
          onChange={(headerRule) => patchLayout({ headerRule })}
        />
      </DesignSection>

      <DesignSection title="Sections" icon="list" hint={design.layout.sectionStyle}>
        <div className="field">
          <span className="field-label">Heading treatment</span>
          <Seg
            label="Section style"
            value={design.layout.sectionStyle}
            options={[
              { value: 'rule', label: 'Rule' },
              { value: 'accent', label: 'Accent' },
              { value: 'lane', label: 'Lane' },
              { value: 'plain', label: 'Plain' },
            ]}
            onChange={(sectionStyle) => patchLayout({ sectionStyle })}
          />
        </div>
        <div className="field">
          <span className="field-label">Entry dividers</span>
          <Seg
            label="Divider style"
            value={design.layout.divider}
            options={[
              { value: 'line', label: 'Line' },
              { value: 'dotted', label: 'Dotted' },
              { value: 'none', label: 'None' },
            ]}
            onChange={(divider) => patchLayout({ divider })}
          />
        </div>
        <div className="field">
          <span className="field-label">Rhythm</span>
          <Seg
            label="Density"
            value={design.layout.density}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'airy', label: 'Airy' },
            ]}
            onChange={(density) => patchLayout({ density })}
          />
        </div>
        <ToggleRow
          label="Numbered sections"
          checked={design.layout.numberedSections}
          onChange={(numberedSections) => patchLayout({ numberedSections })}
        />
        <ToggleRow
          label="Contact icons"
          checked={design.layout.showIcons}
          onChange={(showIcons) => patchLayout({ showIcons })}
        />
        <ToggleRow
          label="Page numbers"
          checked={design.layout.showPageNumbers}
          onChange={(showPageNumbers) => patchLayout({ showPageNumbers })}
        />
      </DesignSection>

      <DesignSection title="Sidebar" icon="layers" hint={twoColumn ? design.layout.asideTone : 'Single column'}>
        {twoColumn ? (
          <>
            <div className="field">
              <span className="field-label">Tone</span>
              <Seg
                label="Sidebar tone"
                value={design.layout.asideTone}
                options={[
                  { value: 'tint', label: 'Tint' },
                  { value: 'ink', label: 'Ink' },
                  { value: 'paper', label: 'Paper' },
                ]}
                onChange={(asideTone) => patchLayout({ asideTone })}
              />
            </div>
            <RangeField
              label="Corner radius"
              value={design.layout.asideRadius}
              min={0}
              max={28}
              unit="px"
              onChange={(asideRadius) => patchLayout({ asideRadius })}
            />
          </>
        ) : (
          <p className="inspector-sub" style={{ margin: 0 }}>
            Switch to a two-column grid to style the sidebar rail.
          </p>
        )}
      </DesignSection>

      <DesignSection title="Portrait" icon="image" hint={design.layout.photoEnabled ? 'On' : 'Off'}>
        <ToggleRow
          label="Show portrait"
          hint="Upload a photo in Identity."
          checked={design.layout.photoEnabled}
          onChange={(photoEnabled) => patchLayout({ photoEnabled })}
        />
        {design.layout.photoEnabled && (
          <>
            <div className="field">
              <span className="field-label">Shape</span>
              <Seg
                label="Portrait shape"
                value={design.layout.photoShape}
                options={[
                  { value: 'circle', label: 'Circle' },
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'square', label: 'Square' },
                ]}
                onChange={(photoShape) => patchLayout({ photoShape })}
              />
            </div>
            <RangeField
              label="Size"
              value={design.layout.photoSize}
              min={52}
              max={132}
              unit="px"
              onChange={(photoSize) => patchLayout({ photoSize })}
            />
          </>
        )}
      </DesignSection>

      <DesignSection title="Typography" icon="type" hint={`${design.type.displayFont} / ${design.type.bodyFont}`}>
        <div className="font-select-row">
          <span className="font-select-label">Display</span>
          <select
            className="studio-select"
            value={design.type.displayFont}
            onChange={(event) => patchType({ displayFont: event.target.value as FontKey })}
          >
            {FONT_LIST.map((font) => (
              <option key={font.key} value={font.key}>
                {font.label} · {font.category}
              </option>
            ))}
          </select>
        </div>
        <div className="font-select-row">
          <span className="font-select-label">Body</span>
          <select
            className="studio-select"
            value={design.type.bodyFont}
            onChange={(event) => patchType({ bodyFont: event.target.value as FontKey })}
          >
            {FONT_LIST.map((font) => (
              <option key={font.key} value={font.key}>
                {font.label} · {font.category}
              </option>
            ))}
          </select>
        </div>
        <RangeField
          label="Name size"
          value={design.type.nameSize}
          min={26}
          max={68}
          step={0.5}
          unit="px"
          onChange={(nameSize) => patchType({ nameSize })}
        />
        <RangeField
          label="Heading size"
          value={design.type.headingSize}
          min={8}
          max={15}
          step={0.5}
          unit="px"
          onChange={(headingSize) => patchType({ headingSize })}
        />
        <RangeField
          label="Body size"
          value={design.type.bodySize}
          min={8}
          max={12.5}
          step={0.1}
          unit="px"
          onChange={(bodySize) => patchType({ bodySize })}
        />
        <RangeField
          label="Line height"
          value={design.type.lineHeight}
          min={1.25}
          max={1.9}
          step={0.01}
          onChange={(lineHeight) => patchType({ lineHeight })}
        />
        <RangeField
          label="Name tracking"
          value={design.type.nameTracking}
          min={-1.2}
          max={3}
          step={0.1}
          unit="px"
          onChange={(nameTracking) => patchType({ nameTracking })}
        />
        <RangeField
          label="Heading tracking"
          value={design.type.headingTracking}
          min={0}
          max={4}
          step={0.1}
          unit="px"
          onChange={(headingTracking) => patchType({ headingTracking })}
        />
        <div className="field">
          <span className="field-label">Heading case</span>
          <Seg
            label="Heading case"
            value={design.type.headingCase}
            options={[
              { value: 'upper', label: 'Uppercase' },
              { value: 'title', label: 'Title case' },
            ]}
            onChange={(headingCase) => patchType({ headingCase })}
          />
        </div>
        <div className="field">
          <span className="field-label">Name case</span>
          <Seg
            label="Name case"
            value={design.type.nameCase}
            options={[
              { value: 'upper', label: 'Uppercase' },
              { value: 'title', label: 'Title case' },
            ]}
            onChange={(nameCase) => patchType({ nameCase })}
          />
        </div>
      </DesignSection>

      <DesignSection title="Colour" icon="palette" hint={design.color.accent}>
        <div className="palette-row" style={{ marginBottom: 12 }}>
          {PALETTES.map((palette) => {
            const active = palette.colors.accent === design.color.accent;
            return (
              <button
                key={palette.name}
                type="button"
                className={`palette-card ${active ? 'is-active' : ''}`}
                onClick={() => patchColor(palette.colors)}
                title={palette.name}
              >
                <span className="palette-card-swatch">
                  <span style={{ background: palette.colors.paper }} />
                  <span style={{ background: palette.colors.ink }} />
                  <span style={{ background: palette.colors.accent }} />
                  <span style={{ background: palette.colors.aside }} />
                </span>
                <span className="palette-card-label">{palette.name}</span>
              </button>
            );
          })}
        </div>
        <ColorField
          label="Accent"
          value={design.color.accent}
          onChange={(accent) => patchColor({ accent })}
        />
        <ColorField
          label="Ink"
          value={design.color.ink}
          onChange={(ink) => patchColor({ ink })}
        />
        <ColorField
          label="Muted ink"
          value={design.color.muted}
          onChange={(muted) => patchColor({ muted })}
        />
        <ColorField
          label="Paper"
          value={design.color.paper}
          onChange={(paper) => patchColor({ paper })}
        />
        <ColorField
          label="Sidebar"
          value={design.color.aside}
          onChange={(aside) => patchColor({ aside })}
        />
        <ColorField
          label="Sidebar ink"
          value={design.color.asideInk}
          onChange={(asideInk) => patchColor({ asideInk })}
        />
      </DesignSection>
    </>
  );
}
