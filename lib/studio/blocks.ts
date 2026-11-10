import type { ResumeDocument, ResumeItem, ResumeSection } from './types';

export interface RenderBlock {
  key: string;
  section: ResumeSection;
  sectionIndex: number;
  items: ResumeItem[];
  firstInSection: boolean;
}

export interface PagePlan {
  main: RenderBlock[][];
  aside: RenderBlock[][];
}

/** Flattens sections into measurable blocks that can flow across pages. */
export function buildBlocks(doc: ResumeDocument): { main: RenderBlock[]; aside: RenderBlock[]; visibleCount: number } {
  const visibleSections = doc.sections.filter((section) => section.visible);
  const singleColumn = doc.design.layout.columns === 'single';
  const main: RenderBlock[] = [];
  const aside: RenderBlock[] = [];

  visibleSections.forEach((section, sectionIndex) => {
    if (section.items.length === 0) return;
    // A single-column layout has no rail, so any section assigned to the
    // sidebar must flow into the main column instead of disappearing.
    const target = !singleColumn && section.column === 'aside' ? aside : main;
    const keepTogether =
      section.variant === 'tags' || section.kind === 'summary' || section.kind === 'skills';

    if (keepTogether) {
      target.push({
        key: `${section.id}::all`,
        section,
        sectionIndex,
        items: section.items,
        firstInSection: true,
      });
      return;
    }

    section.items.forEach((entry, index) => {
      target.push({
        key: `${section.id}::${entry.id}`,
        section,
        sectionIndex,
        items: [entry],
        firstInSection: index === 0,
      });
    });
  });

  return { main, aside, visibleCount: visibleSections.length };
}

export function packBlocks(
  blocks: RenderBlock[],
  heights: Record<string, number>,
  firstPageMax: number,
  laterPageMax: number,
): RenderBlock[][] {
  if (blocks.length === 0) return [];
  const pages: RenderBlock[][] = [];
  let current: RenderBlock[] = [];
  let used = 0;
  let capacity = Math.max(120, firstPageMax);

  for (const block of blocks) {
    const height = Math.max(12, heights[block.key] ?? 44);
    if (current.length > 0 && used + height > capacity) {
      pages.push(current);
      current = [];
      used = 0;
      capacity = Math.max(120, laterPageMax);
    }
    current.push(block);
    used += height;
  }
  if (current.length) pages.push(current);
  return pages.length ? pages : [[]];
}

export function planPages(
  blocks: { main: RenderBlock[]; aside: RenderBlock[] },
  heights: Record<string, number>,
  firstPageMax: number,
  laterPageMax: number,
  asideFirstMax = firstPageMax,
  asideLaterMax = laterPageMax,
): PagePlan {
  const main = packBlocks(blocks.main, heights, firstPageMax, laterPageMax);
  const aside = packBlocks(blocks.aside, heights, asideFirstMax, asideLaterMax);
  return { main: main.length ? main : [[]], aside };
}

export function blocksToText(doc: ResumeDocument): string {
  const lines: string[] = [];
  lines.push(doc.basics.name);
  lines.push(doc.basics.headline);
  lines.push(
    [doc.basics.email, doc.basics.phone, doc.basics.location, doc.basics.website, doc.basics.linkedin]
      .filter(Boolean)
      .join(' · '),
  );
  doc.sections
    .filter((section) => section.visible)
    .forEach((section) => {
      lines.push('', section.title.toUpperCase());
      section.items.forEach((entry) => {
        const header = [entry.title, entry.subtitle, entry.period].filter(Boolean).join(' — ');
        if (header) lines.push(header);
        if (entry.description) lines.push(entry.description);
        entry.bullets.forEach((bullet) => lines.push(`• ${bullet}`));
        if (entry.tags.length) lines.push(entry.tags.join(' · '));
      });
    });
  return lines.filter((line) => line !== undefined).join('\n');
}
