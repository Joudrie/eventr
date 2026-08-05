/**
 * Where you were in the feed.
 *
 * Losing your scroll position on the way back from an event is the single most
 * enraging bug in any feed app — you scrolled past forty events to find that one, and
 * now you get to do it again. Relying on the navigator to keep the screen mounted is
 * not enough: expo-router unmounts inactive screens on web, so the offset has to be
 * remembered explicitly and restored on the next mount.
 *
 * A module-level value rather than state: it is written on scroll and read once during
 * layout, and neither should cause a render.
 */

let offset = 0;

export function rememberFeedOffset(value: number): void {
  offset = Math.max(0, value);
}

export function recallFeedOffset(): number {
  return offset;
}

/**
 * Changing the tab, radius, or town replaces the list's contents, which makes the
 * remembered offset meaningless — restoring it would drop you into an arbitrary spot
 * in a different set of events.
 */
export function forgetFeedOffset(): void {
  offset = 0;
}
