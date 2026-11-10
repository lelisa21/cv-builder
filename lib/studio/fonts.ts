import type { FontKey } from './types';

export interface FontDefinition {
  key: FontKey;
  label: string;
  stack: string;
  category: 'Serif' | 'Sans' | 'Mono';
  note: string;
}

export const STUDIO_FONTS: Record<FontKey, FontDefinition> = {
  instrument: {
    key: 'instrument',
    label: 'Instrument Serif',
    stack: '"Instrument Serif", "Iowan Old Style", Georgia, serif',
    category: 'Serif',
    note: 'Editorial display',
  },
  newsreader: {
    key: 'newsreader',
    label: 'Newsreader',
    stack: '"Newsreader", "Iowan Old Style", Georgia, serif',
    category: 'Serif',
    note: 'Literary body',
  },
  playfair: {
    key: 'playfair',
    label: 'Playfair Display',
    stack: '"Playfair Display", "Times New Roman", serif',
    category: 'Serif',
    note: 'High contrast',
  },
  manrope: {
    key: 'manrope',
    label: 'Manrope',
    stack: '"Manrope", "Segoe UI", system-ui, sans-serif',
    category: 'Sans',
    note: 'Quiet grotesk',
  },
  grotesk: {
    key: 'grotesk',
    label: 'Space Grotesk',
    stack: '"Space Grotesk", "Segoe UI", system-ui, sans-serif',
    category: 'Sans',
    note: 'Swiss precision',
  },
  sora: {
    key: 'sora',
    label: 'Sora',
    stack: '"Sora", "Segoe UI", system-ui, sans-serif',
    category: 'Sans',
    note: 'Geometric warmth',
  },
  dmsans: {
    key: 'dmsans',
    label: 'DM Sans',
    stack: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    category: 'Sans',
    note: 'Neutral clarity',
  },
  mono: {
    key: 'mono',
    label: 'IBM Plex Mono',
    stack: '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
    category: 'Mono',
    note: 'Technical detail',
  },
};

export const FONT_LIST = Object.values(STUDIO_FONTS);

export function fontStack(key: FontKey): string {
  return (STUDIO_FONTS[key] || STUDIO_FONTS.manrope).stack;
}

export function safeFontName(key: FontKey): string {
  const label = (STUDIO_FONTS[key] || STUDIO_FONTS.manrope).label;
  return label.split(' ')[0];
}
