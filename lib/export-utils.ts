"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ImageRun,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";
import { TemplateAnalysis, TemplateStyle } from "@/types";
import type { LetterExportOptions } from "@/types/letters";
import { resolveLayout } from "@/lib/layout-engine";
import { parseLetter } from "@/lib/letter-engine";

/**
 * Robust, self-contained client-side file download.
 *
 * Uses an object URL + a real <a download="filename"> click instead of
 * relying on external helpers (file-saver / jsPDF.save). This guarantees the
 * file keeps its full extension and correct name regardless of OS extension
 * hiding / MIME sniffing, so downloads open in the intended application.
 */
function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the browser has had a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function ensureExtension(filename: string, ext: string): string {
  const exts = ext.split("|");
  const has = exts.some((e) => filename.toLowerCase().endsWith(`.${e}`));
  return has ? filename : `${filename}.${exts[0]}`;
}

export function cleanBulletText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^[\s\-\*\•\–\—\.\·\›\>\o\u2022\u2023\u25E6\u2043\u2219]+[\s\.\-]*/, '')
    .trim();
}

/**
 * Renders the on-screen CV page to a <canvas>, neutralizing the zoom transform
 * first. html2canvas does not support `transform: scale()` on the target's own
 * ancestry correctly, which produced blank/empty captures. We temporarily
 * flatten the `.cv-page` transform to `none` (and shrink its container), capture,
 * then restore the original styles so the on-screen preview is unchanged.
 */
async function captureCvPage(elementId = "cv-print-root") {
  const rootEl = document.getElementById(elementId);
  if (!rootEl) throw new Error(`Element with id "${elementId}" not found.`);
  const pageEl = (rootEl.querySelector(".cv-page") as HTMLElement) || rootEl;

  // Neutralize the scale transform on the captured page so html2canvas draws
  // the full layout instead of a blank/clipped frame.
  const prevTransform = pageEl.style.transform;
  const prevOrigin = pageEl.style.transformOrigin;
  pageEl.style.transform = "none";
  pageEl.style.transformOrigin = "top left";

  const scaleWrap = rootEl.querySelector(".cv-scale") as HTMLElement | null;
  const prevWrapW = scaleWrap?.style.width;
  const prevWrapH = scaleWrap?.style.height;
  if (scaleWrap) {
    scaleWrap.style.width = `${pageEl.offsetWidth || 794}px`;
    scaleWrap.style.height = `${pageEl.offsetHeight || 1123}px`;
  }

  try {
    // Use the page's intrinsic (unscaled) pixel size for a crisp, non-blank capture.
    return await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      // width/height must match the real, unscaled layout or the capture clips.
    });
  } finally {
    pageEl.style.transform = prevTransform;
    pageEl.style.transformOrigin = prevOrigin;
    if (scaleWrap) {
      scaleWrap.style.width = prevWrapW || "";
      scaleWrap.style.height = prevWrapH || "";
    }
  }
}

async function captureToBlob(
  elementId: string,
  mime: string,
  quality?: number,
): Promise<Blob> {
  const canvas = await captureCvPage(elementId);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality),
  );
  if (!blob) throw new Error(`Could not render the CV as ${mime}.`);
  return blob;
}

/**
 * Downloads a pixel-perfect, crisp, 1-page A4 PDF directly to the user's computer.
 */
export async function exportToPdfDownload(
  elementId = "cv-print-root",
  filename = "My_CV.pdf",
): Promise<void> {
  const canvas = await captureCvPage(elementId);
  const imgData = canvas.toDataURL("image/jpeg", 0.98);

  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
  const outName = ensureExtension(
    filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
    "pdf",
  );
  downloadBlob(pdf.output("blob"), outName);
}

/**
 * Opens the native browser print/save dialog.
 */
export function exportToPdf() {
  window.print();
}

/**
 * Captures the rendered CV as a high-resolution PNG image.
 */
export async function exportToImage(
  elementId = "cv-print-root",
  filename = "My_CV.png",
): Promise<void> {
  const blob = await captureToBlob(elementId, "image/png");
  const outName = ensureExtension(
    filename.endsWith(".png") ? filename : `${filename}.png`,
    "png",
  );
  downloadBlob(new Blob([blob], { type: "image/png" }), outName);
}

function cleanFontName(fontStr?: string): string {
  if (!fontStr) return "Arial";
  const first = fontStr.split(",")[0].replace(/['"]/g, "").trim();
  return first || "Arial";
}

function cleanHex(colorStr?: string): string {
  if (!colorStr) return "1E293B";
  return colorStr.replace("#", "").trim() || "1E293B";
}

/**
 * Builds a native Word (.docx) document that embeds a faithful, full-bleed
 * image of the rendered CV, preserving the exact template design — including
 * the sidebar column and margins (the text-based export can't mirror a
 * two-column layout, which is why the left side appeared cut off before).
 */
async function buildVisualDocx(): Promise<Document | null> {
  try {
    const canvas = await captureCvPage("cv-print-root");
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return null;
    const data = new Uint8Array(await blob.arrayBuffer());

    // Full-bleed on an A4 page with zero margins so nothing is clipped.
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // twips: exactly A4
              margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  type: "png",
                  data,
                  transformation: {
                    width: Math.round((11906 / 20) * 0.99),
                    height: Math.round((16838 / 20) * 0.99),
                  },
                }),
              ],
            }),
          ],
        },
      ],
    });
    return doc;
  } catch {
    return null;
  }
}

/**
 * Builds an editable Word document that mirrors the template's two-column
 * layout: a full-width header, then a 2-column table holding the sidebar
 * sections in the left cell and the main sections in the right cell. All text
 * stays selectable/editable in Word (unlike the image-embedded export).
 */
function buildTwoColumnDocx(
  analysis: TemplateAnalysis,
  singletonValues: Record<string, string>,
  entries: Record<string, Array<Record<string, string>>>,
  styleOverrides?: Partial<TemplateStyle>,
): Document {
  const rawPrimary =
    styleOverrides?.primaryColor ||
    styleOverrides?.theme?.headingColor ||
    analysis.style.theme?.headingColor ||
    analysis.style.primaryColor ||
    "#1e293b";
  const primaryHex = cleanHex(rawPrimary);
  const fontName = cleanFontName(
    styleOverrides?.fontFamily || analysis.style.fontFamily || "Arial",
  );

  const name =
    singletonValues.fullName ||
    singletonValues.name ||
    singletonValues.full_name ||
    "Candidate Name";
  const jobTitle = singletonValues.jobTitle || singletonValues.title || "";

  const sectionHeading = (
    title: string,
    color?: string,
    size = 24,
    before = 200,
  ): Paragraph =>
    new Paragraph({
      spacing: { before, after: 100 },
      border: {
        bottom: {
          color: primaryHex,
          space: 4,
          style: BorderStyle.SINGLE,
          size: 8,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size,
          font: fontName,
          color: color || primaryHex,
        }),
      ],
    });

  const bodyRuns = (label: string, value: string, bodyColor = "374151") => [
    new TextRun({
      text: `${label}: `,
      bold: true,
      size: 20,
      font: fontName,
      color: bodyColor,
    }),
    new TextRun({ text: value, size: 20, font: fontName, color: "4B5563" }),
  ];

  const renderSection = (
    sectionId: string,
    asSidebar: boolean,
  ): Paragraph[] => {
    const section = analysis.sections.find((s) => s.id === sectionId);
    if (!section) return [];
    const fields = analysis.fields.filter((f) => f.section === sectionId);
    const out: Paragraph[] = [];

    if (section.repeatable) {
      const sectionEntries = entries[sectionId] || [];
      if (sectionEntries.length === 0) return [];
      out.push(
        sectionHeading(
          section.name,
          asSidebar ? primaryHex : undefined,
          asSidebar ? 21 : 24,
        ),
      );
      for (const entry of sectionEntries) {
        const firstField = fields.find((f) => (entry[f.id] || "").trim());
        if (!firstField) continue;
        const title = entry[firstField.id].trim() || "Role / Entry";
        const dateField = fields.find(
          (f) =>
            f.id !== firstField.id &&
            /date|year|duration|period|time/i.test(`${f.id} ${f.label}`) &&
            (entry[f.id] || "").trim(),
        );
        const orgField = fields.find(
          (f) =>
            f.id !== firstField.id &&
            f.id !== dateField?.id &&
            /company|organization|institution|school|university|employer|location/i.test(
              `${f.id} ${f.label}`,
            ) &&
            (entry[f.id] || "").trim(),
        );
        const headerRuns: TextRun[] = [
          new TextRun({
            text: title,
            bold: true,
            size: 21,
            font: fontName,
            color: "111827",
          }),
        ];
        const orgVal = orgField ? entry[orgField.id].trim() : "";
        const dateVal = dateField ? entry[dateField.id].trim() : "";
        if (orgVal)
          headerRuns.push(
            new TextRun({
              text: `  —  ${orgVal}`,
              bold: true,
              size: 20,
              font: fontName,
              color: "374151",
            }),
          );
        if (dateVal)
          headerRuns.push(
            new TextRun({
              text: `  (${dateVal})`,
              italics: true,
              size: 19,
              font: fontName,
              color: "6B7280",
            }),
          );
        out.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: headerRuns,
          }),
        );

        for (const f of fields) {
          if (
            f.id === firstField.id ||
            f.id === dateField?.id ||
            f.id === orgField?.id
          )
            continue;
          const val = (entry[f.id] || "").trim();
          if (!val) continue;
          if (f.type === "textarea") {
            for (const line of val.split(/\s*\|\s*|\r?\n/).filter(Boolean)) {
              out.push(
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 20, after: 30 },
                  children: [
                    new TextRun({
                      text: cleanBulletText(line),
                      size: 20,
                      font: fontName,
                      color: "374151",
                    }),
                  ],
                }),
              );
            }
          } else {
            out.push(
              new Paragraph({
                spacing: { before: 20, after: 30 },
                children: bodyRuns(f.label, val),
              }),
            );
          }
        }
      }
    } else {
      if (sectionId === "personal" || sectionId === "contact") return [];
      const hasData = fields.some((f) => (singletonValues[f.id] || "").trim());
      if (!hasData) return [];
      out.push(
        sectionHeading(
          section.name,
          asSidebar ? primaryHex : undefined,
          asSidebar ? 21 : 24,
        ),
      );
      for (const f of fields) {
        const val = (singletonValues[f.id] || "").trim();
        if (!val) continue;
        if (f.type === "textarea") {
          const lines = val.split(/\s*\|\s*|\r?\n/).filter(Boolean);
          if (lines.length > 1) {
            for (const line of lines)
              out.push(
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 20, after: 30 },
                  children: [
                    new TextRun({
                      text: cleanBulletText(line),
                      size: 20,
                      font: fontName,
                      color: "374151",
                    }),
                  ],
                }),
              );
          } else {
            out.push(
              new Paragraph({
                spacing: { before: 30, after: 60 },
                children: [
                  new TextRun({
                    text: val,
                    size: 20,
                    font: fontName,
                    color: "374151",
                  }),
                ],
              }),
            );
          }
        } else {
          out.push(
            new Paragraph({
              spacing: { before: 20, after: 40 },
              children: bodyRuns(f.label, val),
            }),
          );
        }
      }
    }
    return out;
  };

  // Full-width header block.
  const header: Paragraph[] = [];
  header.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: name.toUpperCase(),
          bold: true,
          size: 44,
          font: fontName,
          color: primaryHex,
        }),
      ],
    }),
  );
  if (jobTitle)
    header.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: jobTitle.toUpperCase(),
            bold: true,
            size: 24,
            font: fontName,
            color: "4B5563",
          }),
        ],
      }),
    );
  const contactFields = analysis.fields.filter(
    (f) =>
      (f.section === "personal" || f.section === "contact") &&
      !/name|title|photo/i.test(`${f.id} ${f.label}`) &&
      (singletonValues[f.id] || "").trim(),
  );
  if (contactFields.length > 0) {
    const runs: TextRun[] = [];
    contactFields.forEach((f, idx) => {
      runs.push(
        new TextRun({
          text: `${f.label}: `,
          bold: true,
          size: 19,
          font: fontName,
          color: "374151",
        }),
      );
      runs.push(
        new TextRun({
          text: singletonValues[f.id] || "",
          size: 19,
          font: fontName,
          color: "4B5563",
        }),
      );
      if (idx < contactFields.length - 1)
        runs.push(
          new TextRun({
            text: "   |   ",
            size: 19,
            font: fontName,
            color: "9CA3AF",
          }),
        );
    });
    header.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 180 },
        border: {
          bottom: {
            color: primaryHex,
            space: 8,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: runs,
      }),
    );
  }

  // Split sections into sidebar (left) and main (right) using the layout engine.
  const placement = resolveLayout(analysis, undefined);
  const sidebarSections =
    placement.sidebar.length > 0 ? placement.sidebar : placement.left;
  const mainSections =
    placement.main.length > 0 ? placement.main : placement.right;
  const leftCells: Paragraph[] = [];
  sidebarSections.forEach((id) => leftCells.push(...renderSection(id, true)));
  const rightCells: Paragraph[] = [];
  mainSections.forEach((id) => rightCells.push(...renderSection(id, false)));

  const sidebarBg = cleanHex(
    styleOverrides?.theme?.sidebarBackground ||
      analysis.style.theme?.sidebarBackground ||
      "#eeeff2",
  );
  const leftWidth = Math.round(11906 * 0.32);
  const rightWidth = Math.round(11906 * 0.68);

  const leftCell = new TableCell({
    width: { size: leftWidth, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: sidebarBg },
    verticalAlign: "top",
    children: leftCells,
  });
  const rightCell = new TableCell({
    width: { size: rightWidth, type: WidthType.DXA },
    verticalAlign: "top",
    children: rightCells,
  });
  const bodyTable = new Table({
    width: { size: 11906, type: WidthType.DXA },
    rows: [new TableRow({ children: [leftCell, rightCell] })],
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: [...header, bodyTable],
      },
    ],
  });
}

/**
 * Generates and downloads a native Microsoft Word (.docx) document.
 *
 * Produces a fully editable, two-column document that mirrors the template's
 * layout (sidebar in the left column, main content on the right). Falls back to
 * the image-accurate render and then the server text export if needed.
 */
export async function exportToWord(
  analysis: TemplateAnalysis,
  singletonValues: Record<string, string>,
  entries: Record<string, Array<Record<string, string>>>,
  filename = "My_CV.docx",
  styleOverrides?: Partial<TemplateStyle>,
): Promise<void> {
  const outName = filename.endsWith(".docx")
    ? filename
    : `${filename.replace(/\.[^/.]+$/, "")}.docx`;

  // 1. Editable two-column Word document (keeps sidebar + full layout).
  try {
    const doc = buildTwoColumnDocx(
      analysis,
      singletonValues,
      entries,
      styleOverrides,
    );
    const rawBlob = await Packer.toBlob(doc);
    const docxBlob = new Blob([rawBlob], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    downloadBlob(docxBlob, outName);
    return;
  } catch (err) {
    console.warn(
      "Editable two-column docx failed, falling back to image docx:",
      err,
    );
  }

  // 2. Visual, image-accurate Word document (keeps sidebar + full design).
  try {
    const visual = await buildVisualDocx();
    if (visual) {
      const rawBlob = await Packer.toBlob(visual);
      const docxBlob = new Blob([rawBlob], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      downloadBlob(docxBlob, outName);
      return;
    }
  } catch (err) {
    console.warn("Visual docx failed, falling back to text docx:", err);
  }

  // 2. Server-side text export for 100% native HTTP header download
  try {
    const res = await fetch("/api/export-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "cv",
        analysis,
        singletonValues,
        entries,
        styleOverrides,
        filename: outName,
      }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const docxBlob = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      downloadBlob(docxBlob, outName);
      return;
    }
  } catch (err) {
    console.warn("Server docx export fallback to client:", err);
  }

  // 2. Client-side fallback with docx Packer
  const rawPrimary =
    styleOverrides?.primaryColor ||
    styleOverrides?.theme?.headingColor ||
    analysis.style.theme?.headingColor ||
    analysis.style.primaryColor ||
    "#1e293b";
  const primaryHex = cleanHex(rawPrimary);
  const fontName = cleanFontName(
    styleOverrides?.fontFamily || analysis.style.fontFamily || "Arial",
  );

  const name =
    singletonValues.fullName ||
    singletonValues.name ||
    singletonValues.full_name ||
    "Candidate Name";
  const jobTitle = singletonValues.jobTitle || singletonValues.title || "";

  const sections = analysis.sections || [];
  const docParagraphs: Paragraph[] = [];

  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: name.toUpperCase(),
          bold: true,
          size: 44,
          font: fontName,
          color: primaryHex,
        }),
      ],
    }),
  );

  if (jobTitle) {
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: jobTitle.toUpperCase(),
            bold: true,
            size: 24,
            font: fontName,
            color: "4B5563",
          }),
        ],
      }),
    );
  }

  const contactFields = analysis.fields.filter(
    (f) =>
      (f.section === "personal" || f.section === "contact") &&
      !/name|title|photo/i.test(`${f.id} ${f.label}`) &&
      (singletonValues[f.id] || "").trim(),
  );

  if (contactFields.length > 0) {
    const contactRuns: TextRun[] = [];
    contactFields.forEach((f, idx) => {
      contactRuns.push(
        new TextRun({
          text: `${f.label}: `,
          bold: true,
          size: 19,
          font: fontName,
          color: "374151",
        }),
        new TextRun({
          text: singletonValues[f.id] || "",
          size: 19,
          font: fontName,
          color: "4B5563",
        }),
      );
      if (idx < contactFields.length - 1) {
        contactRuns.push(
          new TextRun({
            text: "   |   ",
            size: 19,
            font: fontName,
            color: "9CA3AF",
          }),
        );
      }
    });

    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 180 },
        border: {
          bottom: {
            color: primaryHex,
            space: 8,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: contactRuns,
      }),
    );
  }

  for (const section of sections) {
    if (section.id === "personal" && !section.repeatable) continue;

    const isRepeatable = section.repeatable;
    const sectionEntries = entries[section.id] || [];
    const fields = analysis.fields.filter((f) => f.section === section.id);

    if (isRepeatable && sectionEntries.length === 0) continue;
    if (
      !isRepeatable &&
      !fields.some((f) => (singletonValues[f.id] || "").trim())
    )
      continue;

    docParagraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: primaryHex,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 8,
          },
        },
        children: [
          new TextRun({
            text: section.name.toUpperCase(),
            bold: true,
            size: 24,
            font: fontName,
            color: primaryHex,
          }),
        ],
      }),
    );

    if (isRepeatable) {
      for (const entry of sectionEntries) {
        const firstField = fields.find((f) => (entry[f.id] || "").trim());
        const title = firstField ? entry[firstField.id].trim() : "Role / Entry";
        const dateField = fields.find(
          (f) =>
            f.id !== firstField?.id &&
            /date|year|duration|period|time/i.test(`${f.id} ${f.label}`) &&
            (entry[f.id] || "").trim(),
        );
        const dateVal = dateField ? entry[dateField.id].trim() : "";

        const orgField = fields.find(
          (f) =>
            f.id !== firstField?.id &&
            f.id !== dateField?.id &&
            /company|organization|institution|school|university|employer|location/i.test(
              `${f.id} ${f.label}`,
            ) &&
            (entry[f.id] || "").trim(),
        );
        const orgVal = orgField ? entry[orgField.id].trim() : "";

        const entryHeaderRuns: TextRun[] = [
          new TextRun({
            text: title,
            bold: true,
            size: 21,
            font: fontName,
            color: "111827",
          }),
        ];

        if (orgVal) {
          entryHeaderRuns.push(
            new TextRun({
              text: `  —  ${orgVal}`,
              bold: true,
              size: 20,
              font: fontName,
              color: "374151",
            }),
          );
        }

        if (dateVal) {
          entryHeaderRuns.push(
            new TextRun({
              text: `  (${dateVal})`,
              italics: true,
              size: 19,
              font: fontName,
              color: "6B7280",
            }),
          );
        }

        docParagraphs.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: entryHeaderRuns,
          }),
        );

        for (const f of fields) {
          if (
            f.id === firstField?.id ||
            f.id === dateField?.id ||
            f.id === orgField?.id
          )
            continue;
          const val = (entry[f.id] || "").trim();
          if (!val) continue;

          if (f.type === "textarea") {
            const lines = val.split(/\s*\|\s*|\r?\n/).filter(Boolean);
            for (const line of lines) {
              docParagraphs.push(
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 20, after: 30 },
                  children: [
                    new TextRun({
                      text: line.trim(),
                      size: 20,
                      font: fontName,
                      color: "374151",
                    }),
                  ],
                }),
              );
            }
          } else {
            docParagraphs.push(
              new Paragraph({
                spacing: { before: 20, after: 30 },
                children: [
                  new TextRun({
                    text: `${f.label}: `,
                    bold: true,
                    size: 20,
                    font: fontName,
                    color: "374151",
                  }),
                  new TextRun({
                    text: val,
                    size: 20,
                    font: fontName,
                    color: "4B5563",
                  }),
                ],
              }),
            );
          }
        }
      }
    } else {
      for (const f of fields) {
        const val = (singletonValues[f.id] || "").trim();
        if (!val) continue;

        if (f.type === "textarea") {
          const lines = val.split(/\s*\|\s*|\r?\n/).filter(Boolean);
          if (lines.length > 1) {
            for (const line of lines) {
              docParagraphs.push(
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { before: 20, after: 30 },
                  children: [
                    new TextRun({
                      text: line.trim(),
                      size: 20,
                      font: fontName,
                      color: "374151",
                    }),
                  ],
                }),
              );
            }
          } else {
            docParagraphs.push(
              new Paragraph({
                spacing: { before: 30, after: 60 },
                children: [
                  new TextRun({
                    text: val,
                    size: 20,
                    font: fontName,
                    color: "374151",
                  }),
                ],
              }),
            );
          }
        } else {
          docParagraphs.push(
            new Paragraph({
              spacing: { before: 20, after: 40 },
              children: [
                new TextRun({
                  text: `${f.label}: `,
                  bold: true,
                  size: 20,
                  font: fontName,
                  color: "374151",
                }),
                new TextRun({
                  text: val,
                  size: 20,
                  font: fontName,
                  color: "4B5563",
                }),
              ],
            }),
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: docParagraphs,
      },
    ],
  });

  const rawBlob = await Packer.toBlob(doc);
  const docxBlob = new Blob([rawBlob], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  downloadBlob(docxBlob, outName);
}

/**
 * Exports a cover/application/follow-up letter to a native, editable Word
 * document. The letter is parsed into its structural parts so the sender
 * block, date, subject, body and signature keep their visual hierarchy.
 */
export async function exportLetterToWord(
  content: string,
  applicantName: string,
  jobTitle = "Application",
  filename = "Cover_Letter.docx",
  options: LetterExportOptions = {},
): Promise<void> {
  const outName = filename.endsWith(".docx")
    ? filename
    : `${filename.replace(/\.[^/.]+$/, "")}.docx`;

  const blocks = parseLetter(content);
  const bodyParagraphs = blocks.paragraphs.length
    ? blocks.paragraphs
    : content.split(/\r?\n\r?\n/).map((part) => part.trim()).filter(Boolean);
  const fontName = options.font === "sans" ? "Calibri" : "Georgia";
  const accent = cleanHex(options.accent || "#0c3b74");
  const bodySize = Math.round((options.fontSize || 11) * 2);
  const bodyAlign = options.align === "left" ? AlignmentType.LEFT : AlignmentType.JUSTIFIED;
  const children: Paragraph[] = [];

  const addParagraph = (
    text: string,
    config: {
      size?: number;
      bold?: boolean;
      color?: string;
      align?: (typeof AlignmentType)[keyof typeof AlignmentType];
      before?: number;
      after?: number;
      italic?: boolean;
      rule?: boolean;
    } = {},
  ) => {
    if (!text.trim()) return;
    children.push(
      new Paragraph({
        alignment: config.align || AlignmentType.LEFT,
        spacing: {
          before: config.before ?? 0,
          after: config.after ?? 120,
          line: 320,
        },
        border: config.rule
          ? {
              bottom: {
                color: accent,
                space: 6,
                style: BorderStyle.SINGLE,
                size: 8,
              },
            }
          : undefined,
        children: [
          new TextRun({
            text: text.trim(),
            size: config.size || bodySize,
            bold: config.bold || false,
            italics: config.italic || false,
            font: fontName,
            color: config.color || "1F2937",
          }),
        ],
      }),
    );
  };

  if (blocks.sender) {
    addParagraph(blocks.sender, {
      size: bodySize + 8,
      bold: true,
      color: accent,
      align: AlignmentType.RIGHT,
      after: 40,
    });
  }
  if (blocks.contact) {
    addParagraph(blocks.contact, {
      size: bodySize - 2,
      color: "6B7280",
      align: AlignmentType.RIGHT,
      after: 240,
      rule: options.paper === "modern" || options.paper === "executive",
    });
  }

  blocks.meta.forEach((line, index) => {
    const isDate = /(?:20\d{2}|Guyyaa:|ቀን:|Date:)/i.test(line) || index === 0;
    addParagraph(line, {
      align: isDate ? AlignmentType.RIGHT : AlignmentType.LEFT,
      after: isDate ? 220 : 40,
      color: isDate ? "6B7280" : "1F2937",
    });
  });

  if (blocks.subject) {
    addParagraph(blocks.subject, { bold: true, color: accent, after: 220 });
  }
  if (blocks.salutation) {
    addParagraph(blocks.salutation, { after: 200 });
  }
  bodyParagraphs.forEach((paragraph) => {
    addParagraph(paragraph, { align: bodyAlign, after: 180 });
  });
  if (blocks.closing) addParagraph(blocks.closing, { before: 120, after: 200 });
  if (blocks.signature) addParagraph(blocks.signature, { bold: true, after: 0 });

  if (children.length === 0) {
    addParagraph(applicantName || jobTitle, { bold: true, size: bodySize + 6, color: accent });
    content.split(/\r?\n/).filter(Boolean).forEach((line) => addParagraph(line));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
              bottom: convertInchesToTwip(0.9),
              left: convertInchesToTwip(0.9),
            },
          },
        },
        children,
      },
    ],
  });

  const rawBlob = await Packer.toBlob(doc);
  const docxBlob = new Blob([rawBlob], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  downloadBlob(docxBlob, outName);
}

/**
 * Downloads a real, text-selectable PDF. Built-in PDF fonts cannot render
 * Ethiopic script, so Amharic letters fall back to the browser print flow.
 * Afaan Oromo uses Latin script and can use the same PDF renderer as English.
 */
export function exportLetterToPdf(
  content: string,
  filename = "Letter.pdf",
  options: LetterExportOptions = {},
): boolean {
  if (options.language === "am") return false;
  // WinAnsi covers Latin-1 plus common typographic punctuation (dashes, curly
  // quotes, bullets). Anything outside that range needs the print fallback.
  if (/[^\u0000-\u00FF\u2000-\u206F\u20AC\u2122]/u.test(content)) return false;

  const outName = ensureExtension(
    filename.endsWith(".pdf") ? filename : `${filename.replace(/\.[^/.]+$/, "")}.pdf`,
    "pdf",
  );
  const blocks = parseLetter(content);
  const bodyParagraphs = blocks.paragraphs.length
    ? blocks.paragraphs
    : content.split(/\r?\n\r?\n/).map((part) => part.trim()).filter(Boolean);
  const accent = (options.accent || "#0c3b74").replace("#", "").slice(0, 6);
  const rgb = [0, 2, 4].map((offset) => parseInt(accent.slice(offset, offset + 2), 16) / 255);
  const bodySize = options.fontSize || 11;
  const font = options.font === "sans" ? "helvetica" : "times";
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;
  const right = 190;
  let cursorY = 20;

  const write = (
    text: string,
    size = bodySize,
    bold = false,
    align: "left" | "right" = "left",
    gap = 2,
    color: [number, number, number] = [0.12, 0.18, 0.26],
  ) => {
    if (!text.trim()) return;
    doc.setFont(font, bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(Math.round(color[0] * 255), Math.round(color[1] * 255), Math.round(color[2] * 255));
    const lines = doc.splitTextToSize(text.trim(), right - left) as string[];
    const lineHeight = size * 0.42;
    lines.forEach((line) => {
      if (cursorY > 268) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, align === "right" ? right : left, cursorY, {
        align: align === "right" ? "right" : "left",
      });
      cursorY += lineHeight;
    });
    cursorY += gap;
  };

  if (blocks.sender) write(blocks.sender, bodySize + 8, true, "right", 0, [rgb[0], rgb[1], rgb[2]]);
  if (blocks.contact) write(blocks.contact, bodySize - 2, false, "right", 5);
  blocks.meta.forEach((line, index) => write(line, bodySize - 1, false, index === 0 ? "right" : "left", 2));
  if (blocks.subject) write(blocks.subject, bodySize, true, "left", 5, [rgb[0], rgb[1], rgb[2]]);
  if (blocks.salutation) write(blocks.salutation, bodySize, false, "left", 5);
  bodyParagraphs.forEach((paragraph) => write(paragraph, bodySize, false, "left", 4));
  if (blocks.closing) write(blocks.closing, bodySize, false, "left", 5);
  if (blocks.signature) write(blocks.signature, bodySize, true, "left", 0);

  downloadBlob(doc.output("blob"), outName);
  return true;
}
