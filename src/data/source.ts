/**
 * The contract between the app and its backend.
 *
 * `LocalSource` implements this against bundled seed data today; `SupabaseSource` will
 * implement it against `events_within_radius()` later. Nothing above this layer knows
 * which one it is talking to, so swapping backends is a one-line change in `index.ts`
 * rather than a rewrite of the feature code.
 */

import type { FeedEvent, FeedFilters } from '@/types/event';

export type FeedPage = {
  readonly events: readonly FeedEvent[];
  /** Whether another page exists. Drives infinite scroll and the end-of-list state. */
  readonly hasMore: boolean;
  /** Total matching the filters, ignoring pagination. Drives the header result count. */
  readonly total: number;
};

export interface DataSource {
  readonly kind: 'local' | 'supabase';
  listEvents(filters: FeedFilters): Promise<FeedPage>;
  getEvent(id: string, origin: FeedFilters['origin']): Promise<FeedEvent | null>;
}
