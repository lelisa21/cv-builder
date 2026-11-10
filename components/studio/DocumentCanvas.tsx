'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildBlocks, planPages } from '@/lib/studio/blocks';
import { pageDimensions } from '@/lib/studio/page';
import { getTemplate } from '@/lib/studio/templates';
import { Icon } from './Icon';
import { MeasureSheet, ResumeSheet, type MeasureResult } from './ResumeSheet';
import { useStudio } from './StudioProvider';

const EMPTY_MEASURE: MeasureResult = {
  headerHeight: 0,
  photoHeight: 0,
  blockHeights: {},
};

function sameMeasure(a: MeasureResult, b: MeasureResult): boolean {
  if (Math.abs(a.headerHeight - b.headerHeight) > 0.5) return false;
  if (Math.abs(a.photoHeight - b.photoHeight) > 0.5) return false;
  const aKeys = Object.keys(a.blockHeights);
  const bKeys = Object.keys(b.blockHeights);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (Math.abs((a.blockHeights[key] || 0) - (b.blockHeights[key] || 0)) > 0.5) return false;
  }
  return true;
}

export function DocumentCanvas() {
  const {
    doc,
    setPageCount,
    setSelection,
    setTab,
    zoom,
    setZoom,
  } = useStudio();
  const [measure, setMeasure] = useState<MeasureResult>(EMPTY_MEASURE);
  const [revision, setRevision] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const didFit = useRef(false);
  const lastFit = useRef<number | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const { width: pageW, height: pageH } = pageDimensions(
    doc.design.page.format,
    doc.design.page.orientation,
  );
  const { marginY, gap, columns } = doc.design.layout;
  const hasAside = columns !== 'single';
  const asideLeft = columns === 'aside-left';

  const blocks = useMemo(() => buildBlocks(doc), [doc]);

  const handleMeasure = useCallback((result: MeasureResult) => {
    setMeasure((previous) => (sameMeasure(previous, result) ? previous : result));
  }, []);

  // Web fonts can land after the first measurement pass. Re-measure once they do.
  useEffect(() => {
    let alive = true;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) setRevision((value) => value + 1);
      });
    }
    return () => {
      alive = false;
    };
  }, []);

  const innerHeight = pageH - marginY * 2;
  const firstMainMax = Math.max(140, innerHeight - measure.headerHeight - gap);
  const laterMax = Math.max(140, innerHeight);
  const firstAsideMax = Math.max(
    140,
    innerHeight - (measure.photoHeight > 0 ? measure.photoHeight + gap : 0),
  );

  const plan = useMemo(
    () =>
      planPages(
        blocks,
        measure.blockHeights,
        firstMainMax,
        laterMax,
        firstAsideMax,
        laterMax,
      ),
    [blocks, measure.blockHeights, firstMainMax, laterMax, firstAsideMax],
  );

  const pageTotal = Math.max(plan.main.length, plan.aside.length, 1);

  useEffect(() => {
    setPageCount(pageTotal);
  }, [pageTotal, setPageCount]);

  const fit = useCallback(() => {
    const container = canvasRef.current;
    // While a mobile drawer is open the canvas is display:none and reports a
    // zero width. Fitting then would collapse the zoom to its floor.
    if (!container || container.clientWidth < 80) return;
    const available = container.clientWidth - (container.clientWidth < 620 ? 36 : 96);
    const next = Math.min(1.1, Math.max(0.32, available / pageW));
    lastFit.current = next;
    setZoom(next);
  }, [pageW, setZoom]);

  useEffect(() => {
    if (didFit.current) return;
    // Mark only once the timer actually fires. Strict Mode remounts run the
    // cleanup immediately, so marking too early would cancel the first fit and
    // leave the page at the default zoom forever.
    const timer = window.setTimeout(() => {
      didFit.current = true;
      fit();
    }, 260);
    return () => window.clearTimeout(timer);
  }, [fit]);

  // Keep the page comfortably in view as panels open, close or the window
  // resizes — but never fight a zoom the user chose deliberately.
  useEffect(() => {
    const container = canvasRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const auto = lastFit.current !== null
          && Math.abs(zoomRef.current - lastFit.current) < 0.005;
        if (auto) fit();
      }, 140);
    });
    observer.observe(container);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [fit]);

  const template = getTemplate(doc.design.templateId);
  const formatLabel =
    doc.design.page.format === 'a4' ? 'A4' : 'US Letter';

  const selectSection = useCallback(
    (id: string) => {
      setSelection(id);
      setTab('content');
    },
    [setSelection, setTab],
  );

  return (
    <div className="studio-canvas" ref={canvasRef}>
      <div className="studio-canvas-status">
        <strong>{template.name}</strong>
        <span>·</span>
        <span>
          {pageTotal} page{pageTotal > 1 ? 's' : ''}
        </span>
        <span>·</span>
        <span>
          {formatLabel} {doc.design.page.orientation}
        </span>
      </div>

      <div className="studio-pages">
        {Array.from({ length: pageTotal }).map((_, index) => (
          <div className="studio-page" key={`page-${index}`}>
            <div className="studio-page-label">
              Page {String(index + 1).padStart(2, '0')}
            </div>
            <div
              className="studio-scale-outer"
              style={{ width: Math.round(pageW * zoom), height: Math.round(pageH * zoom) }}
            >
              <div
                className="studio-scale-inner"
                style={{ transform: `scale(${zoom})` }}
              >
                <ResumeSheet
                  doc={doc}
                  pageW={pageW}
                  pageH={pageH}
                  pageIndex={index}
                  pageCount={pageTotal}
                  mainBlocks={plan.main[index] || []}
                  asideBlocks={plan.aside[index] || []}
                  hasAside={hasAside}
                  asideLeft={asideLeft}
                  onSelectSection={selectSection}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="studio-dock" role="toolbar" aria-label="Canvas controls">
        <button
          type="button"
          className="studio-icon-btn"
          onClick={() => setZoom(zoom - 0.1)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Icon name="zoomOut" size={15} />
        </button>
        <span className="studio-zoom-value">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="studio-icon-btn"
          onClick={() => setZoom(zoom + 0.1)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Icon name="zoomIn" size={15} />
        </button>
        <span className="studio-dock-sep" />
        <button
          type="button"
          className="studio-icon-btn"
          onClick={fit}
          aria-label="Fit page to view"
          title="Fit to view"
        >
          <Icon name="fit" size={14} />
        </button>
        <span className="studio-dock-sep" />
        <span className="studio-dock-page">
          {doc.design.page.format.toUpperCase()} · {pageTotal}p
        </span>
      </div>

      <MeasureSheet
        doc={doc}
        pageW={pageW}
        pageH={pageH}
        mainBlocks={blocks.main}
        asideBlocks={blocks.aside}
        hasAside={hasAside}
        asideLeft={asideLeft}
        onMeasure={handleMeasure}
        revision={revision}
      />
    </div>
  );
}
