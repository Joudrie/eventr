/**
 * Candidate palettes for the color study.
 *
 * Three directions, all warm, differing mainly in **how much** color they spend
 * rather than which hue they pick. That ordering is deliberate: Labrecque & Milne
 * (2012) found saturation and value do more work amplifying brand personality than
 * hue selection does, which means "how loud" is the real decision and "which color"
 * is downstream of it.
 *
 * See docs/COLOR-STUDY.md. `npm run audit:contrast` checks every one of these against
 * WCAG AA in both schemes, so a candidate that cannot clear it is not a candidate.
 */

import type { Theme } from './tokens';

export type PaletteCandidate = {
  readonly key: string;
  readonly name: string;
  readonly tagline: string;
  readonly light: Theme;
  readonly dark: Theme;
};

/* --------------------------------------------------------------- A. Almanac */

const almanacLight: Theme = {
  scheme: 'light',
  color: {
    page: '#F6F2EA',
    surface: '#FFFDF9',
    surfaceRaised: '#FFFDF9',
    surfaceSunken: '#E9E3D7',
    textPrimary: '#191512',
    textSecondary: '#5A5248',
    textOnBrand: '#FFFDF9',
    textOnAccent: '#191512',
    border: 'rgba(25, 21, 18, 0.12)',
    borderStrong: 'rgba(25, 21, 18, 0.50)',
    brand: '#A03C1B',
    brandPressed: '#732A11',
    accent: '#E8A33D',
    accentPressed: '#C4831F',
    danger: '#A82820',
    overlay: 'rgba(25, 21, 18, 0.40)',
    skeleton: '#E9E3D7',
  },
};

const almanacDark: Theme = {
  scheme: 'dark',
  color: {
    page: '#14110E',
    surface: '#201B17',
    surfaceRaised: '#2A241F',
    surfaceSunken: '#14110E',
    textPrimary: '#F2ECE2',
    textSecondary: '#A79C8C',
    textOnBrand: '#191512',
    textOnAccent: '#191512',
    border: 'rgba(242, 236, 226, 0.14)',
    borderStrong: 'rgba(242, 236, 226, 0.38)',
    brand: '#F08A5C',
    brandPressed: '#D8703F',
    accent: '#E8A33D',
    accentPressed: '#C4831F',
    danger: '#EE7268',
    overlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: '#2A241F',
  },
};

/* ------------------------------------------------------------------ B. Dusk */

const duskLight: Theme = {
  scheme: 'light',
  color: {
    page: '#F5F1F0',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#E7E0E2',
    textPrimary: '#1A141B',
    textSecondary: '#5B5060',
    textOnBrand: '#FFFFFF',
    textOnAccent: '#1A141B',
    border: 'rgba(26, 20, 27, 0.12)',
    borderStrong: 'rgba(26, 20, 27, 0.50)',
    brand: '#6B2A5B',
    brandPressed: '#48193C',
    accent: '#E8A33D',
    accentPressed: '#C4831F',
    danger: '#B02D26',
    overlay: 'rgba(26, 20, 27, 0.40)',
    skeleton: '#E7E0E2',
  },
};

const duskDark: Theme = {
  scheme: 'dark',
  color: {
    page: '#120F13',
    surface: '#1D181F',
    surfaceRaised: '#272029',
    surfaceSunken: '#120F13',
    textPrimary: '#F2EBEF',
    textSecondary: '#A899AA',
    textOnBrand: '#1A141B',
    textOnAccent: '#1A141B',
    border: 'rgba(242, 235, 239, 0.14)',
    borderStrong: 'rgba(242, 235, 239, 0.38)',
    brand: '#D693C6',
    brandPressed: '#BC77AC',
    accent: '#E8A33D',
    accentPressed: '#C4831F',
    danger: '#EE7268',
    overlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: '#272029',
  },
};

/* ----------------------------------------------------------------- C. Ember */

const emberLight: Theme = {
  scheme: 'light',
  color: {
    page: '#FAF5F0',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#EDE3DA',
    textPrimary: '#1C1512',
    textSecondary: '#5F544C',
    textOnBrand: '#FFFFFF',
    textOnAccent: '#1C1512',
    border: 'rgba(28, 21, 18, 0.12)',
    borderStrong: 'rgba(28, 21, 18, 0.50)',
    brand: '#AC3A0A',
    brandPressed: '#802A05',
    accent: '#F2B705',
    accentPressed: '#CC9700',
    danger: '#A82820',
    overlay: 'rgba(28, 21, 18, 0.40)',
    skeleton: '#EDE3DA',
  },
};

const emberDark: Theme = {
  scheme: 'dark',
  color: {
    page: '#16110D',
    surface: '#221A15',
    surfaceRaised: '#2D231C',
    surfaceSunken: '#16110D',
    textPrimary: '#F5EDE5',
    textSecondary: '#AC9C8D',
    textOnBrand: '#1C1512',
    textOnAccent: '#1C1512',
    border: 'rgba(245, 237, 229, 0.14)',
    borderStrong: 'rgba(245, 237, 229, 0.38)',
    brand: '#FF9455',
    brandPressed: '#E87A38',
    accent: '#F2B705',
    accentPressed: '#CC9700',
    danger: '#EE7268',
    overlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: '#2D231C',
  },
};

export const PALETTE_CANDIDATES: readonly PaletteCandidate[] = [
  {
    key: 'almanac',
    name: 'Almanac',
    tagline: 'Warm paper, near-monochrome, one clay accent doing all the work.',
    light: almanacLight,
    dark: almanacDark,
  },
  {
    key: 'dusk',
    name: 'Dusk',
    tagline: 'The incumbent purple, pulled warm toward plum and confined to chrome.',
    light: duskLight,
    dark: duskDark,
  },
  {
    key: 'ember',
    name: 'Ember',
    tagline: 'Warm orange lead. The most personality, and the most risk of reading loud.',
    light: emberLight,
    dark: emberDark,
  },
];
