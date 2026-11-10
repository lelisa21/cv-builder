'use client';

import type { ResumeDocument } from './types';
import { blocksToText } from './blocks';
import { pageMillimetres } from './page';

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1600);
}

export function fileStem(doc: ResumeDocument): string {
  const base = doc.basics.name || doc.title || 'resume';
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'resume'
  );
}

/** Native print dialogue — the highest fidelity route to a vector PDF. */
export function printResume(doc?: ResumeDocument): void {
  if (!doc || typeof document === 'undefined') {
    window.print();
    return;
  }
  const page = pageMillimetres(doc.design.page.format, doc.design.page.orientation);
  const style = document.createElement('style');
  style.setAttribute('data-studio-print-page', 'true');
  style.textContent = `@page { size: ${page.width}mm ${page.height}mm; margin: 0; }`;
  document.head.appendChild(style);
  const cleanup = () => {
    window.setTimeout(() => style.remove(), 400);
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

function getSheets(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.studio-page .rs-sheet'));
}

async function captureSheet(sheet: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas');
  const scaler = sheet.closest<HTMLElement>('.studio-scale-inner');
  const previousTransform = scaler?.style.transform ?? '';
  const previousOrigin = scaler?.style.transformOrigin ?? '';
  if (scaler) {
    scaler.style.transform = 'none';
    scaler.style.transformOrigin = 'top left';
  }
  try {
    return await html2canvas(sheet, {
      scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: sheet.offsetWidth,
      height: sheet.offsetHeight,
    });
  } finally {
    if (scaler) {
      scaler.style.transform = previousTransform;
      scaler.style.transformOrigin = previousOrigin;
    }
  }
}

export async function exportPng(doc: ResumeDocument): Promise<number> {
  const sheets = getSheets();
  if (!sheets.length) throw new Error('The document is still rendering.');
  const canvases: HTMLCanvasElement[] = [];
  for (const sheet of sheets) {
    // Capture sequentially so the layout stays stable between pages.
    // eslint-disable-next-line no-await-in-loop
    canvases.push(await captureSheet(sheet));
  }
  const width = Math.max(...canvases.map((canvas) => canvas.width));
  const height = canvases.reduce((total, canvas) => total + canvas.height, 0);
  const stacked = document.createElement('canvas');
  stacked.width = width;
  stacked.height = height;
  const ctx = stacked.getContext('2d');
  if (!ctx) throw new Error('Could not create the image canvas.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  let y = 0;
  canvases.forEach((canvas) => {
    ctx.drawImage(canvas, 0, y);
    y += canvas.height;
  });
  const blob = await new Promise<Blob | null>((resolve) => stacked.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not encode the image.');
  downloadBlob(blob, `${fileStem(doc)}-resume.png`);
  return canvases.length;
}

export function exportJson(doc: ResumeDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${fileStem(doc)}-studio.json`);
}

export function exportText(doc: ResumeDocument): void {
  const blob = new Blob([blocksToText(doc)], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${fileStem(doc)}-resume.txt`);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export async function exportDocx(doc: ResumeDocument): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    BorderStyle,
    convertMillimetersToTwip,
  } = await import('docx');

  const accent = doc.design.color.accent.replace('#', '');
  const ink = doc.design.color.ink.replace('#', '');
  const muted = doc.design.color.muted.replace('#', '');
  const display = (doc.design.type.displayFont || 'serif').toUpperCase();
  const body = (doc.design.type.bodyFont || 'sans').toUpperCase();
  const page = pageMillimetres(doc.design.page.format, doc.design.page.orientation);
  const margin = Math.max(12.7, Math.round((doc.design.layout.marginX / 3.7795) * 10) / 10);

  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: doc.basics.name || 'Your Name',
          bold: true,
          size: 48,
          color: ink,
          font: display,
        }),
      ],
    }),
  );

  if (doc.basics.headline) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: doc.basics.headline,
            size: 22,
            color: accent,
            font: body,
          }),
        ],
      }),
    );
  }

  const contact = [
    doc.basics.email,
    doc.basics.phone,
    doc.basics.location,
    doc.basics.website,
    doc.basics.linkedin,
  ]
    .filter(Boolean)
    .join('  ·  ');

  if (contact) {
    children.push(
      new Paragraph({
        spacing: { after: 220 },
        border: { bottom: { color: accent, space: 8, style: BorderStyle.SINGLE, size: 8 } },
        children: [new TextRun({ text: contact, size: 18, color: muted, font: body })],
      }),
    );
  }

  doc.sections
    .filter((section) => section.visible)
    .forEach((section) => {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 100 },
          border: { bottom: { color: accent, space: 4, style: BorderStyle.SINGLE, size: 6 } },
          children: [
            new TextRun({
              text: section.title.toUpperCase(),
              bold: true,
              size: 22,
              color: accent,
              font: body,
              characterSpacing: 20,
            }),
          ],
        }),
      );

      section.items.forEach((entry) => {
        if (section.kind === 'summary') {
          if (entry.description) {
            children.push(
              new Paragraph({
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: entry.description, size: 20, color: ink, font: body }),
                ],
              }),
            );
          }
          return;
        }

        if (section.kind === 'skills' || section.variant === 'tags') {
          const label = entry.title ? `${entry.title}: ` : '';
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({ text: label, bold: true, size: 19, color: ink, font: body }),
                new TextRun({
                  text: entry.tags.join(' · '),
                  size: 19,
                  color: muted,
                  font: body,
                }),
              ],
            }),
          );
          return;
        }

        if (section.kind === 'languages') {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: entry.title || '', bold: true, size: 20, color: ink, font: body }),
                new TextRun({
                  text: `${entry.subtitle ? ` — ${entry.subtitle}` : ''}`,
                  size: 20,
                  color: muted,
                  font: body,
                }),
              ],
            }),
          );
          return;
        }

        const title = [entry.title, entry.subtitle].filter(Boolean).join(' — ');
        if (title || entry.period) {
          children.push(
            new Paragraph({
              spacing: { before: 80, after: 30 },
              children: [
                new TextRun({ text: title || 'Entry', bold: true, size: 21, color: ink, font: body }),
                ...(entry.period
                  ? [
                      new TextRun({
                        text: `   ${entry.period}`,
                        size: 18,
                        color: muted,
                        font: body,
                      }),
                    ]
                  : []),
                ...(entry.location
                  ? [
                      new TextRun({
                        text: `   ·   ${entry.location}`,
                        size: 18,
                        color: muted,
                        font: body,
                      }),
                    ]
                  : []),
              ],
            }),
          );
        }
        if (entry.description) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: entry.description, size: 19, color: ink, font: body })],
            }),
          );
        }
        entry.bullets
          .filter((bullet) => bullet.trim())
          .forEach((bullet) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 20 },
                children: [new TextRun({ text: bullet, size: 19, color: ink, font: body })],
              }),
            );
          });
        if (entry.tags.length) {
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: entry.tags.join(' · '),
                  italics: true,
                  size: 18,
                  color: muted,
                  font: body,
                }),
              ],
            }),
          );
        }
        if (entry.link) {
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: entry.link, size: 18, color: accent, font: body })],
            }),
          );
        }
      });
    });

  const file = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(page.width),
              height: convertMillimetersToTwip(page.height),
            },
            margin: {
              top: convertMillimetersToTwip(margin),
              right: convertMillimetersToTwip(margin),
              bottom: convertMillimetersToTwip(margin),
              left: convertMillimetersToTwip(margin),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(file);
  downloadBlob(
    new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    `${fileStem(doc)}-resume.docx`,
  );
}
