/**
 * Domain types. These mirror `supabase/migrations/0001_init.sql` exactly.
 *
 * Once a Supabase project exists these get replaced by generated types
 * (`supabase gen types typescript`) and this file becomes the place where
 * hand-written view models live instead.
 */

export const EVENT_CATEGORIES = [
  'music',
  'food_drink',
  'sports_rec',
  'running',
  'arts',
  'nightlife',
  'family',
  'market',
  'community',
  'fundraiser',
  'class_workshop',
  'other',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** Display names live here so the filter row and the card never drift apart. */
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: 'Music',
  food_drink: 'Food & Drink',
  sports_rec: 'Sports & Rec',
  running: 'Running',
  arts: 'Arts',
  nightlife: 'Nightlife',
  family: 'Family',
  market: 'Market',
  community: 'Community',
  fundraiser: 'Fundraiser',
  class_workshop: 'Class or Workshop',
  other: 'Other',
};

export type PriceTier = 'free' | 'paid';

/**
 * Derived from `capacity` and the going count — never set by hand. See `capacityState()`
 * in `src/lib/capacity.ts` for the thresholds and for why `over` is worded carefully.
 */
export type CapacityState = 'open' | 'filling' | 'full' | 'over';
export type EventStatus = 'pending' | 'live' | 'hidden' | 'cancelled' | 'archived';
export type RsvpKind = 'going' | 'interested';

export type FeedWindow = 'now' | 'today' | 'weekend' | 'all';
export type FeedSort = 'ranked' | 'nearest' | 'soonest';

export type Coordinates = {
  readonly latitude: number;
  readonly longitude: number;
};

/** One row of the feed. Matches the `public_events` view plus the computed columns. */
export type FeedEvent = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string | null;
  readonly photoPath: string | null;
  readonly category: EventCategory;
  /** Free-form, max 6. The category is the closed set; tags are the poster's own words. */
  readonly tags: readonly string[];

  readonly priceTier: PriceTier;
  /** What the user reads: "Free", "$5+", "$10 adults / $5 students". Never a bare number. */
  readonly priceLabel: string | null;
  /** Drives the "under $X" filter only. Never rendered. */
  readonly priceFrom: number | null;

  readonly venueName: string | null;
  readonly addressLine: string | null;
  readonly town: string;
  readonly latitude: number;
  readonly longitude: number;

  readonly startsAt: string;
  readonly endsAt: string;
  /**
   * How many people fit, when the poster knows. Most events have no meaningful limit —
   * a farmers market does not fill up — so this is null far more often than not, and a
   * null capacity can never produce a capacity badge.
   */
  readonly capacity: number | null;
  /** Derived from `capacity` and `goingCount`. Never stored, never hand-set. */
  readonly capacityState: CapacityState;

  readonly ticketUrl: string | null;
  readonly contactUrl: string | null;
  readonly contactEmail: string | null;
  readonly contactPhone: string | null;
  readonly commentsLocked: boolean;

  readonly posterName: string;
  readonly verified: boolean;
  readonly boosted: boolean;

  /**
   * Posted from this device and awaiting review, so visible only to its author.
   * Never set on anything that came from the feed.
   */
  readonly pendingReview?: boolean;

  readonly goingCount: number;
  readonly interestedCount: number;
  readonly commentCount: number;

  /** Computed per query against the viewer's location. */
  readonly distanceM: number;
  readonly score: number;
};

/** Matches the `tags_bounded` constraint in the schema. */
export const MAX_TAGS = 6;
export const MAX_TAG_LENGTH = 24;

export type FeedFilters = {
  readonly origin: Coordinates;
  readonly radiusM: number;
  readonly window: FeedWindow;
  readonly sort: FeedSort;
  readonly categories: readonly EventCategory[] | null;
  readonly freeOnly: boolean;
  readonly maxPrice: number | null;
  readonly verifiedOnly: boolean;
  readonly limit: number;
  readonly offset: number;
};

export const RADIUS_OPTIONS_MI = [1, 5, 10, 25, 50] as const;
export const METERS_PER_MILE = 1609.344;

export const DEFAULT_FILTERS: Omit<FeedFilters, 'origin'> = {
  radiusM: 10 * METERS_PER_MILE,
  window: 'all',
  sort: 'ranked',
  categories: null,
  freeOnly: false,
  maxPrice: null,
  verifiedOnly: false,
  limit: 20,
  offset: 0,
};
