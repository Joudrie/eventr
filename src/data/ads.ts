/**
 * Ad inventory.
 *
 * House ads only for now — Eventr advertising Eventr's author's other projects. That is
 * deliberate as a starting point: it lets the whole surface be built, measured and
 * argued about before a single dollar is taken from a stranger, and if the format turns
 * out to be obnoxious the only person annoyed is the one who shipped it.
 *
 * Copy is taken from each product's own description rather than written fresh. An ad
 * that overstates what it is selling is the fastest way to make the rest of the feed
 * look untrustworthy, and this feed's entire pitch is that its listings are checked.
 *
 * Rules that hold for anything added here:
 *
 * - It occupies the same footprint as an event card. An ad that is taller than the
 *   content around it is an interstitial wearing a disguise.
 * - It says "Ad" in words. The blue edge is reinforcement, not disclosure.
 * - It is skippable by scrolling and never blocks, expands, animates on its own, or
 *   follows the reader down the page.
 * - It links out. Nothing in this app ever takes a payment.
 */

export type Ad = {
  readonly id: string;
  /** Who is advertising. Shown small, above the headline. */
  readonly advertiser: string;
  readonly headline: string;
  readonly body: string;
  readonly cta: string;
  readonly url: string;
  /** Square mark, rendered at the same size as an event card's thumbnail. */
  readonly image: number | null;
  /** True for the author's own products, which must be labelled as such. */
  readonly house: boolean;
};

export const ADS: readonly Ad[] = [
  {
    id: 'ad-globalio',
    advertiser: 'Globalio',
    headline: 'Learn every flag in the world',
    // Straight from globalio.app's own description — 50+ modes, daily challenges, a
    // 2,000-flag codex, free, no account.
    body: 'Fifty ways to play, a daily challenge, and a codex of 2,000 flags. Free, no sign-up.',
    cta: 'Play Globalio',
    url: 'https://globalio.app',
    image: require('../../assets/ads/globalio.png') as number,
    house: true,
  },
];

/**
 * What the feed can currently show. A single-entry inventory is honest about where this
 * is: one ad, cycled, rather than a rotation pretending to be a marketplace.
 */
export function availableAds(): readonly Ad[] {
  return ADS;
}
