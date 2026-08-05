/**
 * WCAG AA contrast audit over every text/surface pairing the app can actually produce.
 *
 * BUILD-PLAN.md §5 requires contrast be verified with a tool rather than by eye, and
 * reported rather than asserted. This runs in `npm run verify`, so a token change that
 * breaks contrast fails the build instead of shipping.
 *
 * Run: npm run audit:contrast
 */

import { darkTheme, lightTheme, type Theme } from '../src/design/tokens.ts';

const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

/**
 * - `normal`   body text, 4.5:1
 * - `large`    >=24px, or >=18.66px bold, and non-text UI that identifies a control, 3:1
 * - `decorative` exempt under WCAG 1.4.11, which covers only the parts *required* to
 *   identify a component. Our hairline `border` always pairs with a surface-color change,
 *   so it is never the sole boundary cue; pushing it to 3:1 would produce a heavy outline
 *   that reads as unstyled. `borderStrong`, which does delineate controls, is held to 3:1.
 */
type Weight = 'normal' | 'large' | 'decorative';

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function parse(color: string): [number, number, number, number] {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba?.[1]) {
    const parts = rgba[1].split(',').map((p) => Number(p.trim()));
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
  }
  throw new Error(`Unparseable color: ${color}`);
}

/** Flattens a translucent foreground over its backdrop before measuring. */
function flatten(fg: string, bg: string): [number, number, number] {
  const [fr, fg_, fb, fa] = parse(fg);
  const [br, bg_, bb] = parse(bg);
  return [fr * fa + br * (1 - fa), fg_ * fa + bg_ * (1 - fa), fb * fa + bb * (1 - fa)];
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(fg: string, bg: string): number {
  const a = luminance(flatten(fg, bg));
  const b = luminance(flatten(bg, bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

type Pair = { label: string; fg: string; bg: string; weight: Weight };

function pairsFor(theme: Theme): Pair[] {
  const c = theme.color;
  const onSurfaces: [string, string][] = [
    ['page', c.page],
    ['surface', c.surface],
    ['surfaceRaised', c.surfaceRaised],
  ];

  const pairs: Pair[] = [];

  for (const [surfaceName, surface] of onSurfaces) {
    pairs.push(
      { label: `textPrimary on ${surfaceName}`, fg: c.textPrimary, bg: surface, weight: 'normal' },
      {
        label: `textSecondary on ${surfaceName}`,
        fg: c.textSecondary,
        bg: surface,
        weight: 'normal',
      },
      { label: `brand text on ${surfaceName}`, fg: c.brand, bg: surface, weight: 'normal' },
      { label: `danger text on ${surfaceName}`, fg: c.danger, bg: surface, weight: 'normal' },
    );
  }

  pairs.push(
    { label: 'textOnBrand on brand', fg: c.textOnBrand, bg: c.brand, weight: 'normal' },
    {
      label: 'textOnBrand on brandPressed',
      fg: c.textOnBrand,
      bg: c.brandPressed,
      weight: 'normal',
    },
    { label: 'textOnAccent on accent', fg: c.textOnAccent, bg: c.accent, weight: 'normal' },
    {
      label: 'textOnAccent on accentPressed',
      fg: c.textOnAccent,
      bg: c.accentPressed,
      weight: 'normal',
    },
    { label: 'border on surface', fg: c.border, bg: c.surface, weight: 'decorative' },
    { label: 'border on page', fg: c.border, bg: c.page, weight: 'decorative' },
    { label: 'borderStrong on surface', fg: c.borderStrong, bg: c.surface, weight: 'large' },
    { label: 'borderStrong on page', fg: c.borderStrong, bg: c.page, weight: 'large' },
  );

  return pairs;
}

let failures = 0;
const rows: string[] = [];

for (const theme of [lightTheme, darkTheme]) {
  rows.push(`\n  ${theme.scheme.toUpperCase()}`);
  for (const pair of pairsFor(theme)) {
    const value = ratio(pair.fg, pair.bg);

    if (pair.weight === 'decorative') {
      rows.push(`  n/a   ${value.toFixed(2).padStart(5)}:1  (exempt)    ${pair.label}`);
      continue;
    }

    const threshold = pair.weight === 'large' ? AA_LARGE : AA_NORMAL;
    const ok = value >= threshold;
    if (!ok) failures += 1;
    rows.push(
      `  ${ok ? 'pass' : 'FAIL'}  ${value.toFixed(2).padStart(5)}:1  (min ${threshold})     ${pair.label}`,
    );
  }
}

console.log('WCAG AA contrast audit' + rows.join('\n'));

if (failures > 0) {
  console.error(`\n${failures} pairing(s) below WCAG AA.`);
  process.exit(1);
}
console.log('\nAll pairings pass WCAG AA.');
