/**
 * "Filling up" has to be earned.
 *
 * A badge that appears on everything is decoration; a badge that appears on one card in
 * forty is information. So this derives entirely from two numbers the poster and the
 * crowd actually produced — a stated capacity and a going count — and returns `open`
 * whenever it cannot say something true. Most events have no meaningful limit (a
 * farmers market does not fill up), so most events never carry a capacity badge at all.
 *
 * The wording matters as much as the threshold. A going count is a show of hands, not a
 * ticket sale: forty people tapping Going at a room that seats thirty does not mean the
 * event is oversold, it means more people are planning to come than fit. `over` is
 * phrased as exactly that and nothing stronger, because the alternative is telling
 * somebody an event is full when they could have walked in.
 */

import type { CapacityState } from '@/types/event';

/**
 * Fractions of capacity at which the label changes.
 *
 * `filling` at 70% rather than 50%, because half full is the normal state of a healthy
 * event and flagging it would make the badge meaningless.
 *
 * `full` at 95% rather than exactly 100%, because "full" in the world means there is
 * effectively no room, not that a counter hit a round number. Two seats left in a room
 * of fifty is full to anyone deciding whether to drive there.
 */
export const FILLING_AT = 0.7;
export const FULL_AT = 0.95;

export function capacityState(capacity: number | null | undefined, going: number): CapacityState {
  // No stated limit, or a nonsensical one, means there is nothing honest to say.
  if (capacity == null || !Number.isFinite(capacity) || capacity <= 0) return 'open';

  const ratio = going / capacity;
  if (ratio > 1) return 'over';
  if (ratio >= FULL_AT) return 'full';
  if (ratio >= FILLING_AT) return 'filling';
  return 'open';
}

/**
 * Whether there is realistically no room left. Both `full` and `over` mean "do not
 * count on getting in", and every caller that cares about room cares about both — so
 * asking this question once is safer than two comparisons that can drift apart.
 */
export function atCapacity(event: { capacityState: CapacityState }): boolean {
  return event.capacityState === 'full' || event.capacityState === 'over';
}

/** How many places are left, or null when there is no stated limit. Never negative. */
export function spotsLeft(capacity: number | null | undefined, going: number): number | null {
  if (capacity == null || !Number.isFinite(capacity) || capacity <= 0) return null;
  return Math.max(0, capacity - going);
}
