/**
 * Eventr design tokens — the single source of truth for color, type, space, and shape.
 *
 * Nothing outside `src/design/` may define a color, size, radius, or spacing value.
 * See DESIGN.md for the reasoning behind each choice.
 */

/* ------------------------------------------------------------------ palette */

/**
 * Raw palette. Never referenced directly by components — components consume the
 * semantic `theme` below, so retheming stays a one-file change.
 *
 * There is one scheme. A dark ramp existed through Phase 4 and was removed: the dark
 * purple surface read as a generated default rather than a decision, which is the exact
 * impression this project is built to avoid. Light is the design, not the fallback.
 */
export const palette = {
  ink: '#191428',
  paper: '#FFFFFF',

  /**
   * The pastel field. This is the page, and cards stay `paper` on top of it.
   * A pastel cannot carry body text and cannot be text on white, so a tinted field
   * behind white cards is its only honest job — which also keeps every description
   * on plain white, where long text is easiest to read. See docs/COLOR-STUDY.md.
   */
  lilac: '#F2EDFB',
  lilacDeep: '#E6DCF6',

  /** Deeper members of the same family, because these have to clear 4.5:1 as text. */
  grape: '#6035B8',
  grapeDeep: '#42217F',

  /** Accent only, and only ever as a fill behind `ink`. Never text on white. */
  sun: '#FFDE7A',
  sunDeep: '#E5BE45',

  slate: '#5B5270',

  flag: '#B02D26',

  /**
   * The two paid-placement edges. Both are borders only — the disclosure a reader
   * relies on is the word on the badge, never the colour. See `edgePromoted` below.
   */
  gold: '#C99400',
  tide: '#1D5FBF',
} as const;

/* -------------------------------------------------------------------- theme */

/**
 * Semantic roles. Components reference these, never `palette`.
 *
 * `sun` is accent-only and never carries text on a light surface — it measures
 * 1.56:1 on white. It is legible only as a fill behind `ink`, or as type on `ink`.
 */
export type Theme = {
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

    /**
     * Edges that mark paid placement: gold for an event someone paid to lift, blue for
     * an outright advertisement. Organic cards get neither and keep the hairline.
     *
     * These are deliberately *not* the accessible disclosure. A gold that clears 3:1 on
     * white is no longer gold, and a colour alone cannot tell a colourblind reader that
     * money changed hands. Every promoted card and every ad carries a text label saying
     * so; the edge is reinforcement for people who can see it. WCAG 1.4.11 exempts
     * exactly this case — information conveyed in text elsewhere.
     */
    readonly edgePromoted: string;
    readonly edgeAd: string;

    readonly overlay: string;
    readonly skeleton: string;
  };
};

export const lightTheme: Theme = {
  color: {
    page: palette.lilac,
    surface: palette.paper,
    surfaceRaised: palette.paper,
    surfaceSunken: palette.lilacDeep,

    textPrimary: palette.ink,
    textSecondary: palette.slate,
    textOnBrand: palette.paper,
    textOnAccent: palette.ink,

    border: 'rgba(25, 20, 40, 0.12)',
    borderStrong: 'rgba(25, 20, 40, 0.50)',

    brand: palette.grape,
    brandPressed: palette.grapeDeep,
    accent: palette.sun,
    accentPressed: palette.sunDeep,
    danger: palette.flag,

    edgePromoted: palette.gold,
    edgeAd: palette.tide,

    overlay: 'rgba(25, 20, 40, 0.40)',
    skeleton: palette.lilacDeep,
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
