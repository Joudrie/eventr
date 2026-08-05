/**
 * Feed data access. No component calls the data source directly — everything goes
 * through these hooks, so swapping `LocalSource` for `SupabaseSource` stays invisible
 * above this line.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getDataSource } from '@/data';
import { DEFAULT_FILTERS, type Coordinates, type FeedFilters } from '@/types/event';

const PAGE_SIZE = 12;

export type FeedQueryInput = Pick<
  FeedFilters,
  'origin' | 'radiusM' | 'window' | 'sort' | 'categories' | 'freeOnly' | 'maxPrice' | 'verifiedOnly'
>;

export const feedKeys = {
  all: ['events'] as const,
  list: (input: FeedQueryInput) => ['events', 'list', input] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
};

export function useEventsQuery(input: FeedQueryInput) {
  return useInfiniteQuery({
    queryKey: feedKeys.list(input),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getDataSource().listEvents({
        ...DEFAULT_FILTERS,
        ...input,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
    // The feed is time-sensitive: "Live now" is wrong within minutes of going stale.
    staleTime: 60_000,
  });
}

export function useEventQuery(id: string, origin: Coordinates) {
  return useQuery({
    queryKey: feedKeys.detail(id),
    queryFn: () => getDataSource().getEvent(id, origin),
    staleTime: 60_000,
  });
}
