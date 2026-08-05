/**
 * Distance and price display.
 *
 * Distance carries one decimal under ten miles and none above it, because "2.3 mi" is
 * a decision-changing difference and "27.4 mi" is not.
 */

import { METERS_PER_MILE, type FeedEvent } from '@/types/event';

export function formatDistance(meters: number): string {
  const miles = meters / METERS_PER_MILE;
  if (miles < 0.1) return 'Right here';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

/**
 * The short price shown on a card. Prices vary by tier — a high school game can be
 * $5 general and $20 for the sideline — so the card shows a floor and the detail view
 * shows the real breakdown. `Free` is rendered at display weight alongside real prices
 * rather than being hidden, because a free event is a first-class citizen of this feed.
 */
export function shortPrice(
  event: Pick<FeedEvent, 'priceTier' | 'priceLabel' | 'priceFrom'>,
): string {
  if (event.priceTier === 'free') return 'Free';
  if (event.priceFrom === null) return 'Paid';

  const amount = Number.isInteger(event.priceFrom)
    ? String(event.priceFrom)
    : event.priceFrom.toFixed(2);

  // A label listing more than one tier means the number on the card is a floor.
  const hasTiers = (event.priceLabel ?? '').includes('/');
  return hasTiers ? `$${amount}+` : `$${amount}`;
}
