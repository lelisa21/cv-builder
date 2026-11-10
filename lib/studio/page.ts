import type { PageFormat, PageOrientation } from './types';

/** Screen dimensions at 96 DPI. */
export const PAGE_SIZES_PX: Record<PageFormat, { width: number; height: number }> = {
  a4: { width: 794, height: 1123 },
  letter: { width: 816, height: 1056 },
};

export const PAGE_SIZES_MM: Record<PageFormat, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

export function pageDimensions(format: PageFormat, orientation: PageOrientation) {
  const base = PAGE_SIZES_PX[format];
  const width = orientation === 'landscape' ? base.height : base.width;
  const height = orientation === 'landscape' ? base.width : base.height;
  return { width, height };
}

export function pageMillimetres(format: PageFormat, orientation: PageOrientation) {
  const base = PAGE_SIZES_MM[format];
  const width = orientation === 'landscape' ? base.height : base.width;
  const height = orientation === 'landscape' ? base.width : base.height;
  return { width, height };
}

export const mm = (px: number) => Math.round((px / 3.7795275591) * 10) / 10;
export const px = (value: number) => (value * 3.7795275591);
