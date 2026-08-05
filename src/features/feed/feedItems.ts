/**
 * Where paid placement goes, and how often.
 *
 * Kept as a pure function over an already-ranked list, for two reasons. It is the part
 * of the product most likely to drift toward "just one more ad", so it should be the
 * part that a test can hold a line on. And separating it from ranking is the whole
 * integrity argument: **money buys a labelled slot, never a better organic position.**
 *
 * `boostTerm` used to add a hidden 0.15 to an event's rank. That is undisclosed paid
 * placement — the reader cannot tell a bought result from an earned one, which is both
 * the thing that makes feeds feel rigged and the thing the FTC's disclosure rules exist
 * to prevent. It is gone. A boosted event now appears in one clearly marked slot at the
 * top and is otherwise ranked exactly like everything else.
 */

import type { Ad } from '@/data/ads';
import type { FeedEvent } from '@/types/event';

export type FeedItem =
  | { readonly kind: 'event'; readonly event: FeedEvent }
  /** A boosted event in the paid slot. Same card, gold edge, labelled. */
  | { readonly kind: 'promoted'; readonly event: FeedEvent }
  | { readonly kind: 'ad'; readonly ad: Ad; readonly key: string };

/**
 * One ad every eight cards.
 *
 * The number is a judgement, not a finding, so it is written down rather than tuned in
 * place: eight is roughly two to three screens on a 375px phone, which puts an ad far
 * enough apart that it reads as a break rather than as the feed's texture. Instagram
 * and its imitators run closer to one in four, and that density is exactly what makes
 * them feel like a mall. This app's whole pitch is that it is not that.
 */
export const AD_INTERVAL = 8;

/** At most one paid slot at the top, no matter how many advertisers want it. */
export const PROMOTED_SLOTS = 1;

export type ComposeOptions = {
  readonly events: readonly FeedEvent[];
  readonly ads: readonly Ad[];
  /**
   * False while more pages are loading, so an ad is not appended to the bottom of a
   * list that is about to grow. Otherwise a short first page would show its
   * end-of-list ad and then have it jump into the middle as page two arrives.
   */
  readonly complete: boolean;
};

export function composeFeed({ events, ads, complete }: ComposeOptions): readonly FeedItem[] {
  if (events.length === 0) return [];

  // The promoted slot goes to a boosted event that already matched the filters. It is
  // never an event pulled in from outside them: a paid slot may reorder what you asked
  // for, it may not answer a different question than the one you asked.
  const promotedIndex = events.findIndex((event) => event.boosted);
  const promoted = promotedIndex >= 0 ? events[promotedIndex] : undefined;
  const organic = promoted ? events.filter((_, index) => index !== promotedIndex) : events;

  const items: FeedItem[] = [];
  if (promoted) items.push({ kind: 'promoted', event: promoted });

  let adsPlaced = 0;
  organic.forEach((event, index) => {
    items.push({ kind: 'event', event });

    // Count organic cards only. If the promoted slot pushed the count, the first ad
    // would land a card early and the spacing would drift with every page.
    const shown = index + 1;
    if (ads.length > 0 && shown % AD_INTERVAL === 0) {
      items.push(nextAd(ads, adsPlaced));
      adsPlaced += 1;
    }
  });

  // A result set shorter than the interval would otherwise carry no ad at all. One at
  // the very bottom, below everything the reader asked for, is the least intrusive
  // place it can go — and only once the list is known to be finished.
  const placedAny = adsPlaced > 0;
  if (ads.length > 0 && complete && !placedAny) {
    items.push(nextAd(ads, adsPlaced));
  }

  return items;
}

/**
 * Cycles the inventory rather than picking randomly, so scrolling back up shows the
 * same ad in the same place. A feed that reshuffles its ads under you feels broken.
 */
function nextAd(ads: readonly Ad[], placed: number): FeedItem {
  const ad = ads[placed % ads.length]!;
  return { kind: 'ad', ad, key: `ad-${placed}-${ad.id}` };
}

/** Stable list key for any item. */
export function feedItemKey(item: FeedItem): string {
  switch (item.kind) {
    case 'ad':
      return item.key;
    case 'promoted':
      return `promoted-${item.event.id}`;
    case 'event':
      return item.event.id;
  }
}
