/**
 * The feed. Everything else in the app is in service of this screen.
 *
 * Scroll behavior per INTERACTIONS.md §2:
 *  - the location row collapses on scroll *direction*, not absolute offset, because a
 *    position-based header feels broken when you are near the top
 *  - the filter row never collapses — it is the primary control and hiding it costs
 *    more than the space it takes
 *  - pull-to-refresh is a brand progress line, not the platform spinner
 *  - the next page is fetched well before the user reaches the bottom, so the list
 *    never visibly loads
 */

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type FlatList } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/copy/strings';
import { timing, haptics } from '@/design/motion';
import {
  Button,
  Chip,
  EmptyState,
  EndOfList,
  ErrorState,
  Icon,
  Press,
  SkeletonCard,
  Text,
} from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, size as sizeTokens, space } from '@/design/tokens';
import { metersToMiles } from '@/lib/geo';
import { usePreferences } from '@/lib/preferences';
import { useEventsQuery } from '@/lib/queries/events';
import {
  CATEGORY_LABELS,
  METERS_PER_MILE,
  RADIUS_OPTIONS_MI,
  type EventCategory,
  type FeedEvent,
  type FeedWindow,
} from '@/types/event';
import { CategorySheet, PriceSheet, RadiusSheet } from './FilterSheets';
import { availableAds } from '@/data/ads';
import { AdCard } from './AdCard';
import { EventCard } from './EventCard';
import { composeFeed, feedItemKey, type FeedItem } from './feedItems';
import { forgetFeedOffset, recallFeedOffset, rememberFeedOffset } from './scrollMemory';
import { TimeTabs } from './TimeTabs';

/** How far you must overscroll before a release triggers a refresh. */
const PULL_THRESHOLD = 72;
/** Per-frame scroll delta that counts as a deliberate direction change. */
const DIRECTION_DELTA = 4;
/** Offset below which the header always reopens, so the top never feels stuck. */
const HEADER_REOPEN_OFFSET = 8;
/** Refresh the relative clock often enough that "Starts in 40 min" stays honest. */
const CLOCK_TICK_MS = 30_000;

export function FeedScreen({ onOpenEvent }: { onOpenEvent?: (event: FeedEvent) => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { preferences, setRadius, setPrice, setCategories } = usePreferences();

  const [window, setWindow] = useState<FeedWindow>('all');
  const [now, setNow] = useState(() => new Date());

  // Price and category come from persisted preferences, not screen state — screen
  // state was silently wiped whenever this component remounted, which is what changing
  // your town does.
  const { freeOnly, maxPrice, categories } = preferences;
  const [openSheet, setOpenSheet] = useState<'radius' | 'price' | 'category' | null>(null);

  const listRef = useAnimatedRef<FlatList<FeedEvent>>();
  /**
   * The authoritative scroll offset. `useAnimatedScrollHandler` reports a different
   * number on web than the list actually scrolled — trusting it silently restored
   * people to the wrong place. `useScrollViewOffset` is the API built for reading a
   * scroller's position and it agrees with reality on every platform.
   */
  const scrollOffset = useScrollViewOffset(listRef);
  /** Restoration happens once per mount, on the first layout that has content. */
  const restoredScroll = useRef(false);

  useEffect(() => {
    const handle = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(handle);
  }, []);

  const queryInput = useMemo(
    () => ({
      origin: { latitude: preferences.town.latitude, longitude: preferences.town.longitude },
      radiusM: preferences.radiusM,
      window,
      sort: 'ranked' as const,
      categories,
      freeOnly,
      maxPrice,
      verifiedOnly: false,
    }),
    [preferences.town, preferences.radiusM, window, categories, freeOnly, maxPrice],
  );

  const query = useEventsQuery(queryInput);
  const events = useMemo(
    () => query.data?.pages.flatMap((page) => page.events) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  /**
   * Paid placement is applied once, over the whole loaded list, rather than per page —
   * otherwise the ad cadence would restart at every page boundary and cluster.
   */
  const items = useMemo(
    () => composeFeed({ events, ads: availableAds(), complete: !query.hasNextPage }),
    [events, query.hasNextPage],
  );
  const miles = Math.round(metersToMiles(preferences.radiusM));

  /* --------------------------------------------------------------- scroll */

  const lastY = useSharedValue(0);
  const headerOpen = useSharedValue(1);
  const pullProgress = useSharedValue(0);
  const pullArmed = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;

      const pulled = Math.min(1, Math.max(0, -y / PULL_THRESHOLD));
      pullProgress.value = pulled;
      // Fire the haptic once, at the moment the gesture becomes a refresh — so you
      // feel the commit point without having to look at the indicator.
      if (pulled >= 1 && pullArmed.value === 0) {
        pullArmed.value = 1;
        runOnJS(haptics.threshold)();
      } else if (pulled < 1) {
        pullArmed.value = 0;
      }

      const delta = y - lastY.value;
      lastY.value = y;

      if (y <= HEADER_REOPEN_OFFSET) {
        headerOpen.value = withTiming(1, timing('snap'));
      } else if (delta > DIRECTION_DELTA) {
        headerOpen.value = withTiming(0, timing('snap'));
      } else if (delta < -DIRECTION_DELTA) {
        headerOpen.value = withTiming(1, timing('snap'));
      }
    },
  });

  const locationRowStyle = useAnimatedStyle(() => ({
    opacity: headerOpen.value,
    height: headerOpen.value * sizeTokens.minTapTarget,
  }));

  const pullStyle = useAnimatedStyle(() => ({
    width: `${pullProgress.value * 100}%`,
    opacity: pullProgress.value,
  }));

  const handleRelease = useCallback(
    (offsetY: number) => {
      rememberFeedOffset(offsetY);
      if (-offsetY >= PULL_THRESHOLD) void query.refetch();
    },
    [query],
  );

  /**
   * Capture the offset at the moment of navigation, read straight off the shared value
   * the scroll handler already maintains. Recording only at drag end would miss a
   * programmatic scroll and costs a frame-by-frame `runOnJS` to do properly; reading
   * once, here, is both cheaper and harder to get wrong.
   */
  const openEvent = (event: FeedEvent) => {
    rememberFeedOffset(scrollOffset.value);
    onOpenEvent?.(event);
  };

  /**
   * Restore on the first content layout rather than on mount: on mount the list has
   * no measured content yet, so a scroll request would be clamped to zero.
   */
  const restoreScroll = () => {
    if (restoredScroll.current) return;
    // The first content-size change fires while the query is still pending and the
    // list is empty. Scrolling then is clamped to zero and, worse, would burn the
    // one restoration attempt before there was anything to scroll to.
    if (events.length === 0) return;

    restoredScroll.current = true;
    const saved = recallFeedOffset();
    if (saved > 0) listRef.current?.scrollToOffset({ offset: saved, animated: false });
  };

  /** Any change that replaces the list contents invalidates the remembered offset. */
  const changeWindow = (next: FeedWindow) => {
    forgetFeedOffset();
    restoredScroll.current = true;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    setWindow(next);
  };

  /** Every filter change replaces the list, so the remembered offset stops meaning anything. */
  const resetScroll = () => {
    forgetFeedOffset();
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const changeRadius = (nextMiles: number) => {
    resetScroll();
    setRadius(nextMiles * METERS_PER_MILE);
  };

  const widen = () => {
    const larger = RADIUS_OPTIONS_MI.find((option) => option > miles);
    if (larger) changeRadius(larger);
  };

  const toggleCategory = (category: EventCategory) => {
    resetScroll();
    const next = new Set(categories ?? []);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    // Null rather than an empty set: "none selected" and "all categories" are the
    // same query, and null is the one the data layer already understands.
    setCategories(next.size === 0 ? null : [...next]);
  };

  const priceLabel = freeOnly
    ? strings.filters.freeOnly
    : maxPrice !== null
      ? `Under $${maxPrice}`
      : strings.filters.anyPrice;

  const categoryLabel =
    categories && categories.length === 1
      ? CATEGORY_LABELS[categories[0]!]
      : strings.filters.allCategories;

  /* ---------------------------------------------------------------- render */

  const listEmpty = () => {
    if (query.isPending) {
      return (
        <View style={styles.skeletons}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }
    if (query.isError) {
      return <ErrorState title={strings.error.loadFailed} onRetry={() => void query.refetch()} />;
    }
    const larger = RADIUS_OPTIONS_MI.find((option) => option > miles);
    const town = preferences.town.name;
    const title =
      window === 'now'
        ? strings.empty.noneNow(town)
        : window === 'today'
          ? strings.empty.noneToday(town)
          : window === 'weekend'
            ? strings.empty.noneWeekend(town)
            : strings.empty.noneNearby(miles);

    return (
      <EmptyState
        title={title}
        detail={strings.empty.searchedWithin(miles, town)}
        actions={[
          ...(larger ? [{ label: strings.empty.widen(larger), onPress: widen }] : []),
          ...(window === 'now'
            ? [{ label: strings.feed.tabs.today, onPress: () => changeWindow('today') }]
            : window !== 'all'
              ? [{ label: strings.feed.tabs.all, onPress: () => changeWindow('all') }]
              : []),
        ]}
      />
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.color.page, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="displayL">{strings.app.name}</Text>

        <Animated.View style={[styles.locationRow, locationRowStyle]}>
          <Press
            onPress={() => router.push('/location')}
            feedback="select"
            scaleOnPress={false}
            accessibilityLabel={`Location: ${preferences.town.name}. Change`}
            style={styles.location}
          >
            <Icon name="location" size={16} color="textSecondary" />
            <Text variant="meta" color="textSecondary">
              {preferences.town.name}
            </Text>
          </Press>
          <Text variant="meta" color="textSecondary">
            {total} {total === 1 ? 'event' : 'events'}
          </Text>
        </Animated.View>
      </View>

      <View style={[styles.pullTrack, { top: insets.top }]}>
        <Animated.View
          style={[styles.pullBar, pullStyle, { backgroundColor: theme.color.accent }]}
        />
      </View>

      <TimeTabs value={window} onChange={changeWindow} />

      <View style={[styles.filters, { borderBottomColor: theme.color.border }]}>
        <Chip
          label={strings.filters.radius(miles)}
          opensSheet
          onPress={() => setOpenSheet('radius')}
          accessibilityHint="Choose how far to search"
        />
        <Chip
          label={priceLabel}
          opensSheet
          selected={freeOnly || maxPrice !== null}
          onPress={() => setOpenSheet('price')}
        />
        <Chip
          label={categoryLabel}
          opensSheet
          selected={categories !== null}
          count={categories && categories.length > 1 ? categories.length : undefined}
          onPress={() => setOpenSheet('category')}
        />
      </View>

      <Animated.FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => feedItemKey(item as FeedItem)}
        renderItem={({ item }) => {
          const entry = item as FeedItem;
          if (entry.kind === 'ad') return <AdCard ad={entry.ad} />;
          return (
            <EventCard
              event={entry.event}
              now={now}
              promoted={entry.kind === 'promoted'}
              onPress={onOpenEvent ? () => openEvent(entry.event) : undefined}
            />
          );
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollEndDrag={(event) => handleRelease(event.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(event) => rememberFeedOffset(event.nativeEvent.contentOffset.y)}
        onContentSizeChange={restoreScroll}
        // Fetch the next page around 70% scroll depth so the list never visibly loads.
        onEndReachedThreshold={1}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + space.xxl },
          events.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          events.length > 0 && !query.hasNextPage ? (
            <EndOfList label={strings.feed.endOfList} />
          ) : query.isFetchingNextPage ? (
            <View style={styles.skeletons}>
              <SkeletonCard />
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
        showsVerticalScrollIndicator={false}
      />

      {/* The one pill in the app, and the only floating element — DESIGN.md reserves
          both for exactly this control. */}
      <View style={[styles.postButton, { bottom: insets.bottom + space.lg }]}>
        <Button
          label="Post an event"
          variant="accent"
          pill
          onPress={() => router.push('/post')}
          accessibilityHint="Free, no account needed"
        />
      </View>

      <RadiusSheet
        visible={openSheet === 'radius'}
        onClose={() => setOpenSheet(null)}
        filters={queryInput}
        onPick={(radiusM) => {
          changeRadius(Math.round(radiusM / METERS_PER_MILE));
          setOpenSheet(null);
        }}
      />
      <PriceSheet
        visible={openSheet === 'price'}
        onClose={() => setOpenSheet(null)}
        filters={queryInput}
        onApply={(next) => {
          resetScroll();
          setPrice(next);
          setOpenSheet(null);
        }}
      />
      <CategorySheet
        visible={openSheet === 'category'}
        onClose={() => setOpenSheet(null)}
        filters={queryInput}
        onToggle={toggleCategory}
        onClear={() => {
          resetScroll();
          setCategories(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  pullTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  pullBar: {
    height: 2,
  },
  filters: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: border.hairline,
  },
  list: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  listEmpty: {
    flexGrow: 1,
  },
  skeletons: {
    gap: space.sm,
  },
  postButton: {
    position: 'absolute',
    right: space.lg,
  },
});
