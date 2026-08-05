/**
 * Theme access. Components call `useTheme()` and never import `palette` directly.
 *
 * Both ramps exist from Phase 0 so dark mode is never a retrofit — DESIGN.md
 * treats it as a shipping requirement, not a stretch goal.
 */

import { createContext, use, useSyncExternalStore, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './tokens';

type Scheme = 'light' | 'dark';

function subscribe(onChange: () => void): () => void {
  const subscription = Appearance.addChangeListener(onChange);
  return () => subscription.remove();
}

function getSnapshot(): Scheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

/**
 * Web is statically rendered (app.json → web.output: "static") so event pages are
 * crawlable — someone googling "wakefield farmers market" should be able to land on one.
 * The server cannot know the visitor's color scheme, so it always renders light and the
 * client swaps after hydration. `useSyncExternalStore` is the sanctioned way to express
 * that divergence; resolving the scheme during first render instead produces a hydration
 * mismatch (React #418).
 */
function getServerSnapshot(): Scheme {
  return 'light';
}

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  return use(ThemeContext);
}

/**
 * Renders a subtree under an explicit theme instead of the system one.
 *
 * Exists for the palette comparison in `app/palettes.tsx`: judging a palette on a
 * swatch grid tells you almost nothing, and judging it behind forty real event cards
 * tells you everything. This is the seam that lets the real feed be rendered several
 * times over, once per candidate.
 */
export function ThemeOverride({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}
