/**
 * Theme access. Components call `useTheme()` and never import `palette` directly.
 *
 * There is exactly one scheme. A dark ramp shipped through Phase 4 and was removed —
 * the dark purple surface read as a generated default rather than a chosen one.
 *
 * Losing it also removed a whole class of bug. The theme used to be resolved from
 * `Appearance` through `useSyncExternalStore`, because the web build is statically
 * rendered (app.json → web.output: "static") and the server cannot know the visitor's
 * scheme: it had to render light and swap after hydration, and getting that wrong
 * produced React #418 mismatches. A constant theme cannot diverge between server and
 * client, so that seam is simply gone.
 */

import { createContext, use, type ReactNode } from 'react';

import { lightTheme, type Theme } from './tokens';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext value={lightTheme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  return use(ThemeContext);
}

/**
 * Renders a subtree under an explicit theme instead of the default one.
 *
 * Exists for the palette comparison in `app/palettes.tsx`: judging a palette on a
 * swatch grid tells you almost nothing, and judging it behind forty real event cards
 * tells you everything. This is the seam that lets the real feed be rendered several
 * times over, once per candidate.
 */
export function ThemeOverride({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
