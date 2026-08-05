/**
 * Eventr design tokens — the single source of truth for color, type, space, and shape.
 *
 * Nothing outside `src/design/` may define a color, size, radius, or spacing value.
 * See DESIGN.md for the reasoning behind each choice.
 */

/* ------------------------------------------------------------------ palette */

/**
 * Raw palette. Never referenced directly by components — components consume the
 * semantic `theme` below, so dark mode and future retheming stay a one-file change.
 */
export const palette = {
  ink: '#14121A',
  inkSoft: '#2A2733',
  paper: '#FFFFFF',
  bone: '#F4F2ED',
  boneDeep: '#E7E3DA',

  grape: '#6B2FD6',
  grapeDeep: '#3E1A80',
  grapeLight: '#A87DFF',
  /** Dark-mode pressed state. Stays light so `ink` remains legible on it. */
  grapeMid: '#9A6DF5',

  sun: '#FFC72C',
  sunDeep: '#D9A312',

  /**
   * Darkened from the #6A6675 in DESIGN.md: the original measured 4.52:1 on `bone`,
   * which clears WCAG AA by 0.02 and fails the moment anything shifts. 5.3:1 here.
   */
  slate: '#5F5B6B',
  slateLight: '#9A96A6',

  flag: '#C4342B',
  flagLight: '#E8635A',

  night: '#0E0D12',
  nightSurface: '#1A1820',
  nightRaised: '#232029',
} as const;

/* -------------------------------------------------------------------- theme */

/**
 * Semantic roles. Components reference these, never `palette`.
 *
 * `sun` is accent-only and never carries text on a light surface — it measures
 * 1.56:1 on white. It is legible only as a fill behind `ink`, or as type on `ink`.
 */
export type Theme = {
  readonly scheme: 'light' | 'dark';
  readonly color: {
    readonly page: string;
    readonly surface: string;
    readonly surfaceRaised: string;
    readonly surfaceSunken: string;

    readonly textPrimary: string;
    readonly textSecondary: string;
    readonly textOnBrand: string;
    readonly textOnAccent: string;

    readonly border: string;
    readonly borderStrong: string;

    readonly brand: string;
    readonly brandPressed: string;
    readonly accent: string;
    readonly accentPressed: string;
    readonly danger: string;

    readonly overlay: string;
    readonly skeleton: string;
  };
};

export const lightTheme: Theme = {
  scheme: 'light',
  color: {
    page: palette.bone,
    surface: palette.paper,
    surfaceRaised: palette.paper,
    surfaceSunken: palette.boneDeep,

    textPrimary: palette.ink,
    textSecondary: palette.slate,
    textOnBrand: palette.paper,
    textOnAccent: palette.ink,

    border: 'rgba(20, 18, 26, 0.12)',
    borderStrong: 'rgba(20, 18, 26, 0.50)',

    brand: palette.grape,
    brandPressed: palette.grapeDeep,
    accent: palette.sun,
    accentPressed: palette.sunDeep,
    danger: palette.flag,

    overlay: 'rgba(20, 18, 26, 0.40)',
    skeleton: palette.boneDeep,
  },
};

export const darkTheme: Theme = {
  scheme: 'dark',
  color: {
    page: palette.night,
    surface: palette.nightSurface,
    surfaceRaised: palette.nightRaised,
    surfaceSunken: palette.night,

    textPrimary: palette.bone,
    textSecondary: palette.slateLight,
    /**
     * Ink, not paper. The dark-scheme brand is a *light* purple, so white-on-brand
     * measures 2.98:1 — the contrast audit catches this if it ever regresses.
     */
    textOnBrand: palette.ink,
    textOnAccent: palette.ink,

    border: 'rgba(244, 242, 237, 0.14)',
    borderStrong: 'rgba(244, 242, 237, 0.38)',

    brand: palette.grapeLight,
    /** Deeper, but still light — a pressed state that inverts lightness breaks its label. */
    brandPressed: palette.grapeMid,
    accent: palette.sun,
    accentPressed: palette.sunDeep,
    danger: palette.flagLight,

    overlay: 'rgba(0, 0, 0, 0.60)',
    skeleton: palette.nightRaised,
  },
};

/* --------------------------------------------------------------------- type */

/**
 * Sizes jump decisively rather than by 2px increments — even steps read as
 * generated. Display weights are heavy; body is a workhorse regular.
 */
export const type = {
  displayXl: { fontSize: 32, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  displayL: { fontSize: 24, lineHeight: 26, fontWeight: '800', letterSpacing: -0.4 },
  title: { fontSize: 18, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400', letterSpacing: 0 },
  meta: { fontSize: 13, lineHeight: 16, fontWeight: '500', letterSpacing: 0 },
  label: { fontSize: 11, lineHeight: 12, fontWeight: '700', letterSpacing: 0.88 },
} as const;

export type TypeVariant = keyof typeof type;

/** Applied to `label` only. Kept separate because RN has no `text-transform` token. */
export const labelTransform = 'uppercase' as const;

/* -------------------------------------------------------------- space/shape */

/** 4px base grid. Card padding lives at 12–16, never 24 — density is the house style. */
export const space = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** 4px everywhere. Pill is reserved for the post button. Nothing is 16px-rounded. */
export const radius = {
  none: 0,
  base: 4,
  pill: 999,
} as const;

export const border = {
  hairline: 1,
  strong: 2,
} as const;

/** Elevation is used only where something genuinely floats. Cards use borders instead. */
export const elevation = {
  sheet: {
    shadowColor: palette.ink,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
  },
  floating: {
    shadowColor: palette.ink,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
} as const;

/* ------------------------------------------------------------------ metrics */

export const size = {
  /** iOS HIG / WCAG minimum. Every interactive element must clear this. */
  minTapTarget: 44,
  cardThumb: 88,
  liveDot: 6,
  progressBar: 2,
} as const;
