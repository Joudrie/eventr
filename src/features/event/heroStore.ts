/**
 * Where the card was on screen when you tapped it.
 *
 * Reanimated's `sharedTransitionTag` is native-only and has no web implementation, so
 * relying on it would mean shipping a transition that silently does nothing on the
 * platform this app launches on. Instead the card measures itself on press and hands
 * the rect to the detail screen, which animates its header from there. Same idea,
 * works everywhere, and every value is one we control — which is what makes the
 * transition interruptible and reversible rather than a black box.
 *
 * Deliberately a plain module rather than context: it is written during a press
 * handler and read during the next screen's first layout, and neither wants a re-render.
 */

export type HeroRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

type HeroSource = {
  readonly id: string;
  readonly rect: HeroRect;
  /** Wall-clock stamp so a stale rect from a previous session is never reused. */
  readonly at: number;
};

let current: HeroSource | null = null;

/** Rects older than this are treated as stale — the layout has almost certainly moved. */
const MAX_AGE_MS = 2000;

export function setHeroSource(id: string, rect: HeroRect): void {
  current = { id, rect, at: Date.now() };
}

export function takeHeroSource(id: string): HeroRect | null {
  if (!current || current.id !== id) return null;
  if (Date.now() - current.at > MAX_AGE_MS) return null;
  return current.rect;
}

export function clearHeroSource(): void {
  current = null;
}
