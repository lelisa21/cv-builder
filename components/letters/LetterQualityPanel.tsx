'use client';

import type { CSSProperties } from 'react';
import { ArrowRight, Check, Circle } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { qualityTone } from '@/lib/letter-quality';
import type { LetterQuality, QualityFix } from '@/types/letters';

interface LetterQualityPanelProps {
  quality: LetterQuality;
  onFix: (fix: QualityFix) => void;
}

export default function LetterQualityPanel({ quality, onFix }: LetterQualityPanelProps) {
  const { t } = useApp();
  const tl = t.letters as unknown as Record<string, string>;
  const tone = qualityTone(quality.score);
  const circumference = 2 * Math.PI * 32;
  const dash = (quality.score / 100) * circumference;

  const subscores: Array<{ key: string; label: string; value: number }> = [
    { key: 'structure', label: tl.subStructure, value: quality.subscores.structure },
    { key: 'personal', label: tl.subPersonal, value: quality.subscores.personal },
    { key: 'coverage', label: tl.subCoverage, value: quality.subscores.coverage },
    { key: 'clarity', label: tl.subClarity, value: quality.subscores.clarity },
    { key: 'length', label: tl.subLength, value: quality.subscores.length },
  ];

  return (
    <section className="ls-quality" aria-label={tl.qualityTitle}>
      <div className="ls-quality-head">
        <div className={`ls-score-ring is-${tone}`} style={{ '--ls-score-dash': dash } as CSSProperties}>
          <svg viewBox="0 0 76 76" aria-hidden>
            <circle className="ls-score-track" cx="38" cy="38" r="32" />
            <circle className="ls-score-value" cx="38" cy="38" r="32" />
          </svg>
          <span>{quality.score}</span>
        </div>
        <div className="ls-quality-summary">
          <h3>{tl.qualityTitle}</h3>
          <p>{tl.qualityHint}</p>
          <div className="ls-quality-stats">
            <span>{quality.wordCount} {tl.wordCount}</span>
            <span>·</span>
            <span>{quality.pageEstimate} page{quality.pageEstimate === 1 ? '' : 's'}</span>
            <span>·</span>
            <span>{quality.readingMinutes} {tl.readTime}</span>
          </div>
        </div>
      </div>

      <div className="ls-subscores">
        {subscores.map((item) => (
          <div className="ls-subscore" key={item.key}>
            <div className="ls-subscore-label">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="ls-meter"><span style={{ width: `${item.value}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="ls-checks">
        {quality.checks.map((check) => (
          <div className={`ls-check${check.passed ? ' is-passed' : ''}`} key={check.key}>
            <span className="ls-check-icon" aria-hidden>
              {check.passed ? <Check size={13} strokeWidth={2.4} /> : <Circle size={12} strokeWidth={2} />}
            </span>
            <span className="ls-check-label">{tl[check.key] || check.key}</span>
            {!check.passed && check.fix && (
              <button type="button" className="ls-check-fix" onClick={() => onFix(check.fix as QualityFix)}>
                {tl.qualityFix}
              </button>
            )}
          </div>
        ))}
      </div>

      {quality.matchedKeywords.length > 0 && (
        <div className="ls-keywords">
          <span className="ls-keywords-label">{tl.matchedKeywords}</span>
          <div className="ls-keyword-list">
            {quality.matchedKeywords.slice(0, 6).map((keyword, index) => (
              <span className="ls-keyword is-matched" key={`${keyword}-${index}`}>{keyword}</span>
            ))}
          </div>
        </div>
      )}

      {quality.missingKeywords.length > 0 && (
        <div className="ls-keywords">
          <span className="ls-keywords-label">{tl.missingKeywords}</span>
          <div className="ls-keyword-list">
            {quality.missingKeywords.slice(0, 6).map((keyword, index) => (
              <span className="ls-keyword" key={`${keyword}-${index}`}>{keyword}</span>
            ))}
          </div>
        </div>
      )}

      {quality.suggestions.length > 0 && (
        <ul className="ls-suggestions">
          {quality.suggestions.map((suggestion, index) => (
            <li key={`${suggestion.key}-${index}`}>
              <ArrowRight size={13} strokeWidth={1.8} aria-hidden />
              <span>
                {tl[suggestion.key] || suggestion.key}
                {suggestion.value ? ` ${suggestion.value}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
