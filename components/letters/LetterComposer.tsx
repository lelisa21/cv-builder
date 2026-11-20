'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CornerUpLeft,
  Download,
  FileText,
  GraduationCap,
  Mail,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import type { LanguageCode } from '@/types';
import type { LetterForm, LetterKind, LetterTone } from '@/types/letters';

interface ComposerProps {
  form: LetterForm;
  onChange: (patch: Partial<LetterForm>) => void;
  onUseProfile: () => void;
  profileAvailable: boolean;
  onExtract: () => void;
  onGenerate: () => void;
  onSample: (sample: 'software' | 'marketing') => void;
  busy: boolean | 'generate' | 'rewrite' | null;
  extracting: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  rows,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  rows?: number;
  wide?: boolean;
}) {
  return (
    <label className={`ls-field${wide ? ' is-wide' : ''}`}>
      <span className="ls-label">
        {label}
        {required && <span className="ls-required"> *</span>}
      </span>
      {rows ? (
        <textarea
          className="ls-input"
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="ls-input"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

export default function LetterComposer({
  form,
  onChange,
  onUseProfile,
  profileAvailable,
  onExtract,
  onGenerate,
  onSample,
  busy,
  extracting,
}: ComposerProps) {
  const { t, language, setLanguage } = useApp();
  const tl = t.letters;
  const [tab, setTab] = useState<'details' | 'job'>('details');
  const [newRequirement, setNewRequirement] = useState('');

  const kinds: Array<{ id: LetterKind; label: string; icon: LucideIcon }> = [
    { id: 'application', label: tl.formalApp, icon: FileText },
    { id: 'cover', label: tl.coverLetter, icon: Mail },
    { id: 'followup', label: tl.followUp, icon: CornerUpLeft },
    { id: 'inquiry', label: tl.inquiry, icon: Search },
  ];

  const tones: Array<{ id: LetterTone; label: string }> = [
    { id: 'professional', label: tl.toneProfessional },
    { id: 'fresh-graduate', label: tl.toneFreshGrad },
    { id: 'modern', label: tl.toneModern },
    { id: 'confident', label: tl.toneConfident },
  ];

  const languages: Array<{ id: LanguageCode; label: string }> = [
    { id: 'en', label: 'English' },
    { id: 'om', label: 'Afaan Oromoo' },
    { id: 'am', label: 'አማርኛ' },
  ];

  const addRequirement = () => {
    const value = newRequirement.trim();
    if (!value) return;
    onChange({ requirements: [...form.requirements, value] });
    setNewRequirement('');
  };

  return (
    <aside className="ls-editor">
      <div className="ls-tabs" role="tablist" aria-label="Letter form sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'details'}
          className={`ls-tab${tab === 'details' ? ' is-active' : ''}`}
          onClick={() => setTab('details')}
        >
          {tl.stepBrief}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'job'}
          className={`ls-tab${tab === 'job' ? ' is-active' : ''}`}
          onClick={() => setTab('job')}
        >
          {tl.stepTarget}
        </button>
      </div>

      {tab === 'details' ? (
        <div className="ls-editor-scroll">
          <section className="ls-card">
            <div className="ls-card-head">
              <span className="ls-card-index">01</span>
              <div>
                <h2>{tl.formatAndTone}</h2>
                <p>{tl.generateHint}</p>
              </div>
            </div>

            <div className="ls-card-body">
              <div className="ls-field">
                <span className="ls-label">{tl.documentType}</span>
                <div className="ls-choice-grid">
                  {kinds.map((kind) => (
                    <button
                      type="button"
                      key={kind.id}
                      className={`ls-choice${form.kind === kind.id ? ' is-active' : ''}`}
                      onClick={() => onChange({ kind: kind.id })}
                      aria-pressed={form.kind === kind.id}
                    >
                      <kind.icon size={18} strokeWidth={1.8} aria-hidden />
                      <span>{kind.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ls-field">
                <span className="ls-label">{tl.writingTone}</span>
                <div className="ls-choice-grid ls-choice-grid--tones">
                  {tones.map((tone) => (
                    <button
                      type="button"
                      key={tone.id}
                      className={`ls-choice ls-choice--small${form.tone === tone.id ? ' is-active' : ''}`}
                      onClick={() => onChange({ tone: tone.id })}
                      aria-pressed={form.tone === tone.id}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ls-field">
                <span className="ls-label">Language</span>
                <div className="ls-language-row">
                  {languages.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`ls-language${language === item.id ? ' is-active' : ''}`}
                      onClick={() => setLanguage(item.id)}
                      aria-pressed={language === item.id}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="ls-card">
            <div className="ls-card-head">
              <span className="ls-card-index">02</span>
              <div>
                <h2>{tl.candidateInfo}</h2>
                <button
                  type="button"
                  className="ls-inline-action"
                  onClick={onUseProfile}
                  title={profileAvailable ? tl.useProfile : tl.profileMissing}
                >
                  <UserRound size={14} strokeWidth={1.8} aria-hidden />
                  {tl.useProfile}
                  <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden />
                </button>
              </div>
            </div>
            <div className="ls-card-body ls-fields-grid">
              <Field label={tl.applicantName} value={form.applicantName} onChange={(v) => onChange({ applicantName: v })} placeholder="e.g. Your Name" required />
              <Field label={tl.email} value={form.email} onChange={(v) => onChange({ email: v })} placeholder="name@example.com" type="email" required />
              <Field label={tl.phone} value={form.phone} onChange={(v) => onChange({ phone: v })} placeholder="+251 91 234 5678" />
              <Field label={tl.location} value={form.location} onChange={(v) => onChange({ location: v })} placeholder="Addis Ababa, Ethiopia" />
              <Field label={tl.linkedin} value={form.linkedin} onChange={(v) => onChange({ linkedin: v })} placeholder="linkedin.com/in/yourname" wide />
            </div>
          </section>

          <section className="ls-card">
            <div className="ls-card-head">
              <span className="ls-card-index">03</span>
              <div>
                <h2>{tl.targetDetails}</h2>
              </div>
            </div>
            <div className="ls-card-body ls-fields-grid">
              <Field label={tl.company} value={form.company} onChange={(v) => onChange({ company: v })} placeholder="e.g. ABC Technology PLC" required />
              <Field label={tl.position} value={form.position} onChange={(v) => onChange({ position: v })} placeholder="e.g. Junior Software Engineer" required />
              <Field label={tl.recipient} value={form.recipient} onChange={(v) => onChange({ recipient: v })} placeholder="e.g. Hiring Committee" />
              <div className="ls-field">
                <span className="ls-label">{tl.includeDate}</span>
                <div className="ls-date-row">
                  <input
                    className="ls-input"
                    type="date"
                    value={form.date}
                    onChange={(event) => onChange({ date: event.target.value })}
                    disabled={!form.includeDate}
                  />
                  <button
                    type="button"
                    className={`ls-toggle${form.includeDate ? ' is-on' : ''}`}
                    onClick={() => onChange({ includeDate: !form.includeDate })}
                    aria-pressed={form.includeDate}
                  >
                    <span />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="ls-card">
            <div className="ls-card-head">
              <span className="ls-card-index">04</span>
              <div>
                <h2>{tl.qualificationDetails}</h2>
              </div>
            </div>
            <div className="ls-card-body ls-fields-grid">
              <Field label={tl.degreeUni} value={form.degree} onChange={(v) => onChange({ degree: v })} placeholder="BSc in Software Engineering" />
              <Field label={tl.degreeUni} value={form.university} onChange={(v) => onChange({ university: v })} placeholder="ABC University" />
              <Field label={tl.skills} value={form.skills} onChange={(v) => onChange({ skills: v })} placeholder="React, Node.js, SQL, Communication" wide />
              <Field label={tl.experience} value={form.experience} onChange={(v) => onChange({ experience: v })} placeholder="Software development intern at ABC Company" wide />
              <Field label={tl.projects} value={form.projects} onChange={(v) => onChange({ projects: v })} placeholder="Hiring system, rental platform" wide />
            </div>
          </section>
        </div>
      ) : (
        <div className="ls-editor-scroll">
          <section className="ls-card">
            <div className="ls-card-head">
              <span className="ls-card-index">05</span>
              <div>
                <h2>{tl.jobBrief}</h2>
                <p>{tl.requirementsPlaceholder}</p>
              </div>
            </div>
            <div className="ls-card-body">
              <div className="ls-field">
                <span className="ls-label">{tl.pastePosting}</span>
                <textarea
                  className="ls-input"
                  rows={8}
                  value={form.jobPosting}
                  onChange={(event) => onChange({ jobPosting: event.target.value })}
                  placeholder="- Bachelor's degree in CS&#10;- React and Node.js&#10;- Strong communication skills"
                />
                <button
                  type="button"
                  className="ls-inline-action ls-inline-action--solid"
                  onClick={onExtract}
                  disabled={extracting}
                >
                  {extracting ? <Sparkles size={14} strokeWidth={1.8} aria-hidden /> : <Download size={14} strokeWidth={1.8} aria-hidden />}
                  {extracting ? tl.extractingRequirements : tl.extractRequirements}
                </button>
              </div>

              <div className="ls-field">
                <span className="ls-label">{tl.requirementsLabel}</span>
                <div className="ls-chips">
                  {form.requirements.length === 0 && <span className="ls-chips-empty">{tl.requirementHint}</span>}
                  {form.requirements.map((requirement, index) => (
                    <span className="ls-chip" key={`${requirement}-${index}`}>
                      <span>{requirement}</span>
                      <button
                        type="button"
                        aria-label={`${tl.deleteDraft}: ${requirement}`}
                        onClick={() => onChange({ requirements: form.requirements.filter((_, i) => i !== index) })}
                      >
                        <X size={12} strokeWidth={2} aria-hidden />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="ls-add-row">
                  <input
                    className="ls-input"
                    value={newRequirement}
                    onChange={(event) => setNewRequirement(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addRequirement();
                      }
                    }}
                    placeholder={tl.addRequirement}
                  />
                  <button type="button" className="ls-add-btn" onClick={addRequirement} aria-label={tl.addRequirement}>
                    <Plus size={15} strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <p className="ls-hint">{tl.requirementHint}</p>
              </div>

              <div className="ls-field">
                <span className="ls-label">{tl.sampleProfiles}</span>
                <div className="ls-language-row">
                  <button type="button" className="ls-language" onClick={() => onSample('software')}>
                    <GraduationCap size={14} strokeWidth={1.8} aria-hidden />
                    {tl.techGrad}
                  </button>
                  <button type="button" className="ls-language" onClick={() => onSample('marketing')}>
                    <BriefcaseBusiness size={14} strokeWidth={1.8} aria-hidden />
                    {tl.businessPro}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="ls-editor-footer">
        <button type="button" className="ls-generate" onClick={onGenerate} disabled={Boolean(busy)}>
          <Sparkles size={16} strokeWidth={1.8} aria-hidden />
          <span>{busy === 'generate' ? tl.generatingBtn : tl.generateBtn}</span>
        </button>
        <p className="ls-hint">{tl.generateHint}</p>
      </div>
    </aside>
  );
}
