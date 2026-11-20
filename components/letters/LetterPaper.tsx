'use client';

import { useMemo, type CSSProperties } from 'react';
import { PenLine } from 'lucide-react';
import type { LanguageCode } from '@/types';
import type { LetterFont, LetterPaper as PaperStyle } from '@/types/letters';
import { parseLetter } from '@/lib/letter-engine';

interface LetterPaperProps {
  content: string;
  editing: boolean;
  onChange: (value: string) => void;
  paper: PaperStyle;
  font: LetterFont;
  accent: string;
  fontSize: number;
  align: 'left' | 'justify';
  zoom: number;
  language: LanguageCode;
  emptyLabel: string;
}

export default function LetterPaper({
  content,
  editing,
  onChange,
  paper,
  font,
  accent,
  fontSize,
  align,
  zoom,
  language,
  emptyLabel,
}: LetterPaperProps) {
  const blocks = useMemo(() => parseLetter(content), [content]);
  const paragraphs = blocks.paragraphs.length
    ? blocks.paragraphs
    : content.split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean);

  const paperStyle = {
    '--ls-paper-accent': accent,
    padding: `${(19 * zoom).toFixed(1)}mm ${(21 * zoom).toFixed(1)}mm`,
    fontSize: `${(fontSize * zoom).toFixed(1)}pt`,
    width: `min(100%, ${(210 * zoom).toFixed(0)}mm)`,
    minHeight: `${(297 * zoom).toFixed(0)}mm`,
    textAlign: align,
  } as CSSProperties;

  return (
    <div id="letter-print-root" className={`ls-paperwrap${editing ? ' is-editing' : ''}`}>
      {!content && !editing && (
        <div className="ls-paper-empty">
          <span className="ls-paper-empty-mark"><PenLine size={30} strokeWidth={1.5} aria-hidden /></span>
          <p>{emptyLabel}</p>
        </div>
      )}

      <article
        className={`ls-paper ls-paper--${paper} ls-font--${font}${editing ? ' ls-paper--hidden' : ''}`}
        style={paperStyle}
        lang={language}
      >
        {(blocks.sender || blocks.contact) && (
          <header className="ls-paper-head">
            {blocks.sender && <div className="ls-paper-name">{blocks.sender}</div>}
            {blocks.contact && <div className="ls-paper-contact">{blocks.contact}</div>}
          </header>
        )}

        {blocks.meta.length > 0 && (
          <div className="ls-paper-meta">
            {blocks.meta.map((line, index) => (
              <div key={`${line}-${index}`} className={index === 0 ? 'ls-paper-date' : 'ls-paper-recipient'}>
                {line}
              </div>
            ))}
          </div>
        )}

        {blocks.subject && <div className="ls-paper-subject">{blocks.subject}</div>}
        {blocks.salutation && <div className="ls-paper-salutation">{blocks.salutation}</div>}

        {paragraphs.length > 0 && (
          <div className="ls-paper-body">
            {paragraphs.map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
            ))}
          </div>
        )}

        {blocks.closing && <div className="ls-paper-closing">{blocks.closing}</div>}
        {blocks.signature && <div className="ls-paper-signature">{blocks.signature}</div>}
      </article>

      {editing && (
        <textarea
          className={`ls-paper-editor ls-font--${font}`}
          style={paperStyle}
          value={content}
          onChange={(event) => onChange(event.target.value)}
          spellCheck
          aria-label="Letter text editor"
          placeholder={emptyLabel}
        />
      )}
    </div>
  );
}
