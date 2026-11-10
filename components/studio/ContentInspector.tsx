'use client';

import React, { useRef } from 'react';
import type { ResumeItem, ResumeSection } from '@/lib/studio/types';
import { tightenBullet } from '@/lib/studio/quality';
import { resizeDataUrl } from '@/lib/image-utils';
import { VARIANT_OPTIONS } from '@/lib/studio/sections';
import { Icon } from './Icon';
import { useStudio } from './StudioProvider';
import {
  Field,
  LinesField,
  Seg,
  TagsField,
  ToggleRow,
} from './fields';

function BasicsEditor() {
  const { doc, updateBasics, importFromProfile, pushToast } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(file);
      });
      const resized = await resizeDataUrl(dataUrl, 900, 0.86);
      updateBasics({ photo: resized });
      pushToast('Portrait updated', 'success');
    } catch {
      pushToast('That image could not be read.', 'error');
    }
  };

  return (
    <>
      <div className="inspector-section-head">
        <div>
          <div className="inspector-eyebrow">Identity</div>
          <div className="inspector-title">Name & contact</div>
          <div className="inspector-sub">
            The first six seconds decide the next sixty. Keep this block precise.
          </div>
        </div>
        <div className="inspector-actions">
          <button
            type="button"
            className="studio-icon-btn"
            title="Import from your saved profile"
            aria-label="Import from profile"
            onClick={importFromProfile}
          >
            <Icon name="cloud" size={14} />
          </button>
        </div>
      </div>

      <Field label="Full name">
        <input
          className="studio-input"
          value={doc.basics.name}
          onChange={(event) => updateBasics({ name: event.target.value })}
          placeholder="Amara Bekele"
        />
      </Field>

      <Field label="Headline" hint="Role + specialism">
        <input
          className="studio-input"
          value={doc.basics.headline}
          onChange={(event) => updateBasics({ headline: event.target.value })}
          placeholder="Product Designer · Design Systems"
        />
      </Field>

      <Field label="Availability / status">
        <input
          className="studio-input"
          value={doc.basics.availability || ''}
          onChange={(event) => updateBasics({ availability: event.target.value })}
          placeholder="Open to senior product design roles"
        />
      </Field>

      <div className="field-grid">
        <Field label="Email">
          <input
            className="studio-input"
            type="email"
            value={doc.basics.email}
            onChange={(event) => updateBasics({ email: event.target.value })}
            placeholder="you@studio.com"
          />
        </Field>
        <Field label="Phone">
          <input
            className="studio-input"
            value={doc.basics.phone}
            onChange={(event) => updateBasics({ phone: event.target.value })}
            placeholder="+1 555 0100"
          />
        </Field>
      </div>

      <Field label="Location">
        <input
          className="studio-input"
          value={doc.basics.location}
          onChange={(event) => updateBasics({ location: event.target.value })}
          placeholder="City · Remote"
        />
      </Field>

      <div className="field-grid">
        <Field label="Website">
          <input
            className="studio-input"
            value={doc.basics.website}
            onChange={(event) => updateBasics({ website: event.target.value })}
            placeholder="your.site"
          />
        </Field>
        <Field label="LinkedIn">
          <input
            className="studio-input"
            value={doc.basics.linkedin}
            onChange={(event) => updateBasics({ linkedin: event.target.value })}
            placeholder="linkedin.com/in/you"
          />
        </Field>
      </div>

      <div className="field">
        <span className="field-label">Portrait</span>
        <div className="photo-drop">
          {doc.basics.photo ? (
            <img src={doc.basics.photo} alt="" className="photo-preview" />
          ) : (
            <span className="photo-preview photo-preview--empty">
              <Icon name="user" size={18} />
            </span>
          )}
          <span className="photo-drop-body">
            <span className="photo-drop-title">Studio portrait</span>
            <span className="photo-drop-note">Square crop · JPG or PNG</span>
            <span className="photo-drop-actions">
              <button
                type="button"
                className="mini-btn"
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="image" size={11} />
                {doc.basics.photo ? 'Replace' : 'Upload'}
              </button>
              {doc.basics.photo && (
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => updateBasics({ photo: '' })}
                >
                  Remove
                </button>
              )}
            </span>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="insight-note">
        <Icon name="sparkles" size={14} />
        <span>
          Add a portfolio link and a specific headline — these are the two fields recruiters verify
          first. Import your saved profile to fill this in automatically.
        </span>
      </div>
    </>
  );
}

function ItemEditor({ section, entry, index }: { section: ResumeSection; entry: ResumeItem; index: number }) {
  const { updateItem, removeItem, duplicateItem, moveItem } = useStudio();
  const patch = (data: Partial<ResumeItem>) => updateItem(section.id, entry.id, data);
  const isSummary = section.kind === 'summary';
  const isSkills = section.kind === 'skills' || section.variant === 'tags';
  const isLanguage = section.kind === 'languages';
  const isLink = section.kind === 'links';
  const compact =
    section.kind === 'certifications' ||
    section.kind === 'awards' ||
    section.variant === 'list';
  const showBullets =
    section.kind === 'experience' ||
    section.kind === 'projects' ||
    section.kind === 'volunteering' ||
    section.kind === 'custom' ||
    section.variant === 'timeline';

  return (
    <div className="item-card">
      <div className="item-card-head">
        <span className="item-card-index">
          <span>{String(index + 1).padStart(2, '0')}</span>
          {entry.title || entry.description?.slice(0, 30) || 'Untitled entry'}
        </span>
        <div className="item-card-actions">
          <button
            type="button"
            className="studio-icon-btn"
            title="Move up"
            aria-label="Move entry up"
            disabled={index === 0}
            onClick={() => moveItem(section.id, entry.id, -1)}
          >
            <Icon name="arrowUp" size={12} />
          </button>
          <button
            type="button"
            className="studio-icon-btn"
            title="Move down"
            aria-label="Move entry down"
            disabled={index === section.items.length - 1}
            onClick={() => moveItem(section.id, entry.id, 1)}
          >
            <Icon name="arrowDown" size={12} />
          </button>
          <button
            type="button"
            className="studio-icon-btn"
            title="Duplicate"
            aria-label="Duplicate entry"
            onClick={() => duplicateItem(section.id, entry.id)}
          >
            <Icon name="copy" size={12} />
          </button>
          <button
            type="button"
            className="studio-icon-btn"
            title="Delete"
            aria-label="Delete entry"
            onClick={() => removeItem(section.id, entry.id)}
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>

      {isSummary ? (
        <>
          <Field label="Profile narrative" hint="45–90 words">
            <textarea
              className="studio-textarea"
              rows={5}
              value={entry.description || ''}
              placeholder="What you do, the scale you operate at, and the outcomes you create."
              onChange={(event) => patch({ description: event.target.value })}
            />
          </Field>
          <p className="bullet-helper-note">
            Lead with a specialism, then evidence. Avoid adjectives without proof.
          </p>
        </>
      ) : isSkills ? (
        <>
          <Field label="Group label">
            <input
              className="studio-input"
              value={entry.title || ''}
              placeholder="Product"
              onChange={(event) => patch({ title: event.target.value })}
            />
          </Field>
          <TagsField value={entry.tags} onChange={(tags) => patch({ tags })} />
        </>
      ) : isLanguage ? (
        <div className="field-grid">
          <Field label="Language">
            <input
              className="studio-input"
              value={entry.title || ''}
              placeholder="English"
              onChange={(event) => patch({ title: event.target.value })}
            />
          </Field>
          <Field label="Level">
            <select
              className="studio-select"
              value={entry.subtitle || ''}
              onChange={(event) => patch({ subtitle: event.target.value })}
            >
              <option value="">Choose level</option>
              <option value="Native">Native</option>
              <option value="Fluent">Fluent</option>
              <option value="Advanced">Advanced</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Conversational">Conversational</option>
              <option value="Basic">Basic</option>
            </select>
          </Field>
        </div>
      ) : isLink ? (
        <div className="field-grid">
          <Field label="Label">
            <input
              className="studio-input"
              value={entry.title || ''}
              placeholder="Portfolio"
              onChange={(event) => patch({ title: event.target.value })}
            />
          </Field>
          <Field label="URL">
            <input
              className="studio-input"
              value={entry.link || ''}
              placeholder="your.site"
              onChange={(event) => patch({ link: event.target.value })}
            />
          </Field>
        </div>
      ) : (
        <>
          <Field label="Title">
            <input
              className="studio-input"
              value={entry.title || ''}
              placeholder={section.kind === 'education' ? 'Degree' : 'Role or project'}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </Field>

          <div className="field-grid">
            <Field label={section.kind === 'education' ? 'Institution' : 'Organisation'}>
              <input
                className="studio-input"
                value={entry.subtitle || ''}
                placeholder={section.kind === 'education' ? 'University' : 'Company'}
                onChange={(event) => patch({ subtitle: event.target.value })}
              />
            </Field>
            <Field label="Period">
              <input
                className="studio-input"
                value={entry.period || ''}
                placeholder="2022 — Present"
                onChange={(event) => patch({ period: event.target.value })}
              />
            </Field>
          </div>

          {!compact && (
            <Field label="Location">
              <input
                className="studio-input"
                value={entry.location || ''}
                placeholder="Remote"
                onChange={(event) => patch({ location: event.target.value })}
              />
            </Field>
          )}

          <Field label="Summary">
            <textarea
              className="studio-textarea"
              rows={2}
              value={entry.description || ''}
              placeholder="One sentence of context for this entry."
              onChange={(event) => patch({ description: event.target.value })}
            />
          </Field>

          {showBullets && (
            <>
              <LinesField
                value={entry.bullets}
                onChange={(bullets) => patch({ bullets })}
              />
              <div className="bullet-helper">
                <span className="bullet-helper-note">
                  Start with a verb. Add a number where you can.
                </span>
                <button
                  type="button"
                  className="mini-btn mini-btn--accent"
                  onClick={() =>
                    patch({
                      bullets: entry.bullets.map((bullet) =>
                        bullet.trim() ? tightenBullet(bullet) : bullet,
                      ),
                    })
                  }
                  title="Remove weak openers and tighten punctuation"
                >
                  <Icon name="wand" size={11} />
                  Tighten
                </button>
              </div>
            </>
          )}

          {!compact && !isSkills && (
            <TagsField
              value={entry.tags}
              onChange={(tags) => patch({ tags })}
              placeholder="Design systems, Research, Figma"
            />
          )}

          {section.kind === 'projects' && (
            <Field label="Link">
              <input
                className="studio-input"
                value={entry.link || ''}
                placeholder="github.com/you/project"
                onChange={(event) => patch({ link: event.target.value })}
              />
            </Field>
          )}
        </>
      )}
    </div>
  );
}

function SectionEditor({ section }: { section: ResumeSection }) {
  const {
    doc,
    updateSection,
    addItem,
    removeSection,
    duplicateSection,
    moveSection,
  } = useStudio();
  const twoColumn = doc.design.layout.columns !== 'single';

  return (
    <>
      <div className="inspector-section-head">
        <div>
          <div className="inspector-eyebrow">Section</div>
          <div className="inspector-title">{section.title}</div>
          <div className="inspector-sub">
            {section.items.length} {section.items.length === 1 ? 'entry' : 'entries'} ·{' '}
            {section.column === 'aside' ? 'sidebar rail' : 'main column'}
          </div>
        </div>
        <div className="inspector-actions">
          <button
            type="button"
            className="studio-icon-btn"
            title="Move section up"
            aria-label="Move section up"
            onClick={() => moveSection(section.id, -1)}
          >
            <Icon name="arrowUp" size={13} />
          </button>
          <button
            type="button"
            className="studio-icon-btn"
            title="Move section down"
            aria-label="Move section down"
            onClick={() => moveSection(section.id, 1)}
          >
            <Icon name="arrowDown" size={13} />
          </button>
          <button
            type="button"
            className="studio-icon-btn"
            title="Duplicate section"
            aria-label="Duplicate section"
            onClick={() => duplicateSection(section.id)}
          >
            <Icon name="copy" size={13} />
          </button>
          <button
            type="button"
            className="studio-icon-btn"
            title="Delete section"
            aria-label="Delete section"
            onClick={() => removeSection(section.id)}
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>

      <Field label="Section title">
        <input
          className="studio-input"
          value={section.title}
          onChange={(event) => updateSection(section.id, { title: event.target.value })}
        />
      </Field>

      <div className="field">
        <span className="field-label">Entry style</span>
        <select
          className="studio-select"
          value={section.variant}
          onChange={(event) =>
            updateSection(section.id, {
              variant: event.target.value as ResumeSection['variant'],
            })
          }
        >
          {VARIANT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {twoColumn && (
        <div className="field">
          <span className="field-label">Column placement</span>
          <Seg
            label="Column placement"
            value={section.column}
            options={[
              { value: 'main', label: 'Main' },
              { value: 'aside', label: 'Sidebar' },
            ]}
            onChange={(column) => updateSection(section.id, { column })}
          />
        </div>
      )}

      <ToggleRow
        label="Visible on the page"
        hint="Hidden sections stay in your file."
        checked={section.visible}
        onChange={(visible) => updateSection(section.id, { visible })}
      />

      <div className="design-section" style={{ marginTop: 16 }}>
        <div className="design-section-head">
          <Icon name="list" size={13} />
          <h3>Entries</h3>
          <span className="design-section-hint">{section.items.length}</span>
        </div>

        {section.items.map((entry, index) => (
          <ItemEditor
            key={entry.id}
            section={section}
            entry={entry}
            index={index}
          />
        ))}

        <button type="button" className="add-item-btn" onClick={() => addItem(section.id)}>
          <Icon name="plus" size={13} />
          Add an entry
        </button>
      </div>
    </>
  );
}

export function ContentInspector() {
  const { activeSection } = useStudio();
  return activeSection ? <SectionEditor section={activeSection} /> : <BasicsEditor />;
}
