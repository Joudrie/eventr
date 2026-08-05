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
 * WCAG AA, so a candidate that cannot clear it is not a candidate.
 */

import type { Theme } from './tokens';

export type PaletteCandidate = {
  readonly key: string;
  readonly name: string;
  readonly tagline: string;
  readonly light: Theme;
};

/* --------------------------------------------------------------- A. Almanac */

const almanacLight: Theme = {
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

/* ------------------------------------------------------------------ B. Dusk */

const duskLight: Theme = {
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

/* ----------------------------------------------------------------- C. Ember */

const emberLight: Theme = {
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

const butterLight: Theme = {
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

const skyLight: Theme = {
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

export const PALETTE_CANDIDATES: readonly PaletteCandidate[] = [
  {
    key: 'almanac',
    name: 'Almanac',
    tagline: 'Warm paper, near-monochrome, one clay accent doing all the work.',
    light: almanacLight,
  },
  {
    key: 'dusk',
    name: 'Dusk',
    tagline: 'The incumbent purple, pulled warm toward plum and confined to chrome.',
    light: duskLight,
  },
  {
    key: 'ember',
    name: 'Ember',
    tagline: 'Warm orange lead. The most personality, and the most risk of reading loud.',
    light: emberLight,
  },
  {
    key: 'lilac',
    name: 'Lilac',
    tagline: 'Pastel purple page, white cards, soft yellow accent. The closest to the brief.',
    light: lilacLight,
  },
  {
    key: 'butter',
    name: 'Butter',
    tagline: 'Pastel yellow page with purple accents — the mock inverted.',
    light: butterLight,
  },
  {
    key: 'sky',
    name: 'Sky',
    tagline: 'Pastel blue page, purple and yellow accents. Calmest, and the most generic.',
    light: skyLight,
  },
];
