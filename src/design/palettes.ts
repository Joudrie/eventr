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

/* ------------------------------------------------- pastel candidates ------ */
/**
 * The pastel family.
 *
 * One structural rule makes these work: **the pastel is the page, the cards stay
 * white.** A pastel cannot carry body text (too light against white) and cannot be
 * text on white (fails contrast outright), so the only honest job for it is a tinted
 * field behind white cards. That also keeps every description on plain white, which is
 * where long text is easiest to read.
 *
 * `brand` therefore stays a deeper member of the same hue family — it has to clear
 * 4.5:1 as text — and the pastel does the mood work in the background and in fills.
 */

const lilacLight: Theme = {
  scheme: 'light',
  color: {
    page: '#F2EDFB',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#E6DCF6',
    textPrimary: '#191428',
    textSecondary: '#5B5270',
    textOnBrand: '#FFFFFF',
    textOnAccent: '#191428',
    border: 'rgba(25, 20, 40, 0.12)',
    borderStrong: 'rgba(25, 20, 40, 0.50)',
    brand: '#6035B8',
    brandPressed: '#42217F',
    accent: '#FFDE7A',
    accentPressed: '#E5BE45',
    danger: '#B02D26',
    overlay: 'rgba(25, 20, 40, 0.40)',
    skeleton: '#E6DCF6',
  },
};

const lilacDark: Theme = {
  scheme: 'dark',
  color: {
    page: '#141020',
    surface: '#1E1830',
    surfaceRaised: '#28203D',
    surfaceSunken: '#141020',
    textPrimary: '#EFEAFA',
    textSecondary: '#A79CC2',
    textOnBrand: '#191428',
    textOnAccent: '#191428',
    border: 'rgba(239, 234, 250, 0.14)',
    borderStrong: 'rgba(239, 234, 250, 0.38)',
    brand: '#C4AAF5',
    brandPressed: '#A98BE8',
    accent: '#FFDE7A',
    accentPressed: '#E5BE45',
    danger: '#EE7268',
    overlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: '#28203D',
  },
};

const butterLight: Theme = {
  scheme: 'light',
  color: {
    page: '#FDF6E0',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#F3E8C8',
    textPrimary: '#1E1A12',
    textSecondary: '#5E553F',
    textOnBrand: '#FFFFFF',
    textOnAccent: '#1E1A12',
    border: 'rgba(30, 26, 18, 0.12)',
    borderStrong: 'rgba(30, 26, 18, 0.50)',
    brand: '#6B3FB5',
    brandPressed: '#4A277F',
    accent: '#FFD35C',
    accentPressed: '#E0B233',
    danger: '#A8342A',
    overlay: 'rgba(30, 26, 18, 0.40)',
    skeleton: '#F3E8C8',
  },
};

const butterDark: Theme = {
  scheme: 'dark',
  color: {
    page: '#17140D',
    surface: '#221E14',
    surfaceRaised: '#2D281B',
    surfaceSunken: '#17140D',
    textPrimary: '#F6EFDC',
    textSecondary: '#AEA184',
    textOnBrand: '#1E1A12',
    textOnAccent: '#1E1A12',
    border: 'rgba(246, 239, 220, 0.14)',
    borderStrong: 'rgba(246, 239, 220, 0.38)',
    brand: '#C9A8F5',
    brandPressed: '#AE89E5',
    accent: '#FFD35C',
    accentPressed: '#E0B233',
    danger: '#EE7268',
    overlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: '#2D281B',
  },
};

const skyLight: Theme = {
  scheme: 'light',
  color: {
    page: '#EAF1FA',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#D9E5F4',
    textPrimary: '#141A24',
    textSecondary: '#4F5866',
    textOnBrand: '#FFFFFF',
    textOnAccent: '#141A24',
    border: 'rgba(20, 26, 36, 0.12)',
    borderStrong: 'rgba(20, 26, 36, 0.50)',
    brand: '#6338B4',
    brandPressed: '#43217D',
    accent: '#FFD966',
    accentPressed: '#E0B733',
    danger: '#A8342A',
    overlay: 'rgba(20, 26, 36, 0.40)',
    skeleton: '#D9E5F4',
  },
};

const skyDark: Theme = {
  scheme: 'dark',
  color: {
    page: '#0E131B',
    surface: '#181F2A',
    surfaceRaised: '#212936',
    surfaceSunken: '#0E131B',
    textPrimary: '#E9EFF7',
    textSecondary: '#95A1B2',
    textOnBrand: '#141A24',
    textOnAccent: '#141A24',
    border: 'rgba(233, 239, 247, 0.14)',
    borderStrong: 'rgba(233, 239, 247, 0.38)',
    brand: '#B79CF2',
    brandPressed: '#9B7DE5',
    accent: '#FFD966',
    accentPressed: '#E0B733',
    danger: '#EE7268',
    overlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: '#212936',
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
  {
    key: 'lilac',
    name: 'Lilac',
    tagline: 'Pastel purple page, white cards, soft yellow accent. The closest to the brief.',
    light: lilacLight,
    dark: lilacDark,
  },
  {
    key: 'butter',
    name: 'Butter',
    tagline: 'Pastel yellow page with purple accents — the mock inverted.',
    light: butterLight,
    dark: butterDark,
  },
  {
    key: 'sky',
    name: 'Sky',
    tagline: 'Pastel blue page, purple and yellow accents. Calmest, and the most generic.',
    light: skyLight,
    dark: skyDark,
  },
];
