'use client';

import React, { useMemo } from 'react';
import { analyzeQuality, bulletOpenerAdvice, tightenBullet } from '@/lib/studio/quality';
import { blocksToText } from '@/lib/studio/blocks';
import { copyText, exportText, printResume } from '@/lib/studio/export';
import { Icon, type IconName } from './Icon';
import { useStudio } from './StudioProvider';

const statusIcon: Record<'pass' | 'warn' | 'fail', IconName> = {
  pass: 'check',
  warn: 'alert',
  fail: 'x',
};

export function InsightsPanel() {
  const {
    doc,
    pageCount,
    setSelection,
    setTab,
    setMobilePanel,
    updateItem,
    pushToast,
  } = useStudio();

  const report = useMemo(() => analyzeQuality(doc, pageCount), [doc, pageCount]);
  const scoreColor =
    report.score >= 80 ? 'var(--s-green)' : report.score >= 55 ? 'var(--s-amber)' : 'var(--s-red)';

  const coachItems = useMemo(() => {
    const rows: Array<{
      sectionId: string;
      sectionTitle: string;
      itemId: string;
      bulletIndex: number;
      text: string;
      advice: string;
    }> = [];
    doc.sections
      .filter((section) => section.visible && section.kind === 'experience')
      .forEach((section) => {
        section.items.forEach((entry) => {
          entry.bullets.forEach((bullet, bulletIndex) => {
            const advice = bulletOpenerAdvice(bullet);
            if (advice) {
              rows.push({
                sectionId: section.id,
                sectionTitle: section.title,
                itemId: entry.id,
                bulletIndex,
                text: bullet,
                advice,
              });
            }
          });
        });
      });
    return rows.slice(0, 4);
  }, [doc.sections]);

  const focusCheck = (sectionId?: string) => {
    if (!sectionId) return;
    setSelection(sectionId);
    setTab(sectionId === 'basics' ? 'content' : 'content');
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      setMobilePanel('inspector');
    }
  };

  const copyPlain = async () => {
    const ok = await copyText(blocksToText(doc));
    pushToast(ok ? 'Plain text copied for ATS forms' : 'Copy failed', ok ? 'success' : 'error');
  };

  return (
    <>
      <div className="inspector-section-head">
        <div>
          <div className="inspector-eyebrow">Intelligence</div>
          <div className="inspector-title">Resume quality</div>
          <div className="inspector-sub">
            An evidence-led review of clarity, impact and ATS readiness.
          </div>
        </div>
      </div>

      <div className="score-card">
        <div
          className="score-ring"
          style={
            {
              '--score': `${report.score}%`,
              '--score-color': scoreColor,
            } as React.CSSProperties
          }
        >
          <span className="score-ring-value">
            {report.score}
            <span>/100</span>
          </span>
        </div>
        <div className="score-copy">
          <h3>
            {report.score >= 80
              ? 'Ready to send'
              : report.score >= 55
                ? 'Strong bones'
                : 'Needs work'}
          </h3>
          <p>
            {report.checks.filter((check) => check.status !== 'pass').length} checks to review.
            Hover a row to see why it matters.
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <strong>{report.stats.words}</strong>
          <span>Words</span>
        </div>
        <div className="stat-cell">
          <strong>{report.stats.bullets}</strong>
          <span>Bullets</span>
        </div>
        <div className="stat-cell">
          <strong>{report.stats.quantifiedBullets}</strong>
          <span>Metrics</span>
        </div>
        <div className="stat-cell">
          <strong>{report.stats.sections}</strong>
          <span>Sections</span>
        </div>
        <div className="stat-cell">
          <strong>{report.stats.pages}</strong>
          <span>Pages</span>
        </div>
        <div className="stat-cell">
          <strong>{report.stats.readingMinutes}m</strong>
          <span>Read time</span>
        </div>
      </div>

      <div className="design-section-head">
        <Icon name="target" size={13} />
        <h3>Checks</h3>
        <span className="design-section-hint">
          {report.checks.filter((check) => check.status === 'pass').length}/{report.checks.length}
        </span>
      </div>

      <div className="check-list">
        {report.checks.map((check) => (
          <button
            key={check.id}
            type="button"
            className="check-item"
            onClick={() => focusCheck(check.sectionId)}
            title={check.sectionId ? 'Jump to the relevant section' : undefined}
          >
            <span className={`check-icon ${check.status}`}>
              <Icon name={statusIcon[check.status]} size={10} strokeWidth={2.2} />
            </span>
            <span className="check-copy">
              <span className="check-label">{check.label}</span>
              <span className="check-detail">{check.detail}</span>
            </span>
          </button>
        ))}
      </div>

      {coachItems.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="design-section-head">
            <Icon name="wand" size={13} />
            <h3>Writing coach</h3>
            <span className="design-section-hint">{coachItems.length}</span>
          </div>
          {coachItems.map((row) => (
            <div className="item-card" key={`${row.itemId}-${row.bulletIndex}`}>
              <div className="inspector-eyebrow" style={{ marginBottom: 5 }}>
                {row.sectionTitle}
              </div>
              <p className="check-detail" style={{ marginTop: 0 }}>
                “{row.text.length > 118 ? `${row.text.slice(0, 118)}…` : row.text}”
              </p>
              <p className="check-detail" style={{ color: 'var(--s-amber)' }}>
                {row.advice}
              </p>
              <button
                type="button"
                className="mini-btn mini-btn--accent"
                style={{ marginTop: 8 }}
                onClick={() => {
                  const section = doc.sections.find((entry) => entry.id === row.sectionId);
                  const item = section?.items.find((entry) => entry.id === row.itemId);
                  if (!section || !item) return;
                  const bullets = item.bullets.map((bullet, index) =>
                    index === row.bulletIndex ? tightenBullet(bullet) : bullet,
                  );
                  updateItem(section.id, item.id, { bullets });
                  pushToast('Bullet tightened', 'success');
                }}
              >
                <Icon name="wand" size={11} />
                Tighten bullet
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="insight-note">
        <Icon name="lock" size={14} />
        <span>
          ATS parsers read plain text. Keep headings conventional, avoid text in images, and export
          the .docx or .txt version when a portal asks for machine-readable files.
        </span>
      </div>

      <div className="design-actions" style={{ marginTop: 12 }}>
        <button type="button" className="mini-btn" onClick={copyPlain}>
          <Icon name="copy" size={11} />
          Copy text
        </button>
        <button type="button" className="mini-btn" onClick={() => exportText(doc)}>
          <Icon name="download" size={11} />
          .txt
        </button>
        <button type="button" className="mini-btn" onClick={() => printResume(doc)}>
          <Icon name="printer" size={11} />
          Print
        </button>
      </div>
    </>
  );
}
