/**
 * The non-React half of "events posted from this device".
 *
 * Split out from the provider deliberately: the data layer has to merge these into
 * query results, and it is not a component. Importing a `.tsx` module from there also
 * made the plain-Node test runner fail, which was a fair signal that the dependency
 * pointed the wrong way — data should not reach into React.
 */

import type { EventCategory, PriceTier } from '@/types/event';

/** What the post form collects. Everything the feed needs, nothing it doesn't. */
export type DraftEvent = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly category: EventCategory;
  readonly tags: readonly string[];
  readonly priceTier: PriceTier;
  readonly priceLabel: string;
  readonly priceFrom: number | null;
  readonly venueName: string;
  readonly addressLine: string;
  readonly town: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly contactEmail: string;
  readonly createdAt: string;
};

export const MY_EVENTS_STORAGE_KEY = 'eventr.myEvents.v1';

let mirror: readonly DraftEvent[] = [];

export function readMyEvents(): readonly DraftEvent[] {
  return mirror;
}

/** Called by the provider whenever the persisted list changes. */
export function writeMyEventsMirror(next: readonly DraftEvent[]): void {
  mirror = next;
}

/**
 * Shape-checked rather than trusted: a partial write or an older build's format would
 * otherwise crash the feed on launch, which is the worst possible place to fail.
 */
export function parseMyEvents(raw: string | null): DraftEvent[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DraftEvent =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as DraftEvent).id === 'string' &&
        typeof (item as DraftEvent).title === 'string' &&
        typeof (item as DraftEvent).startsAt === 'string',
    );
  } catch {
    return [];
  }
}
