/**
 * The filter sheets behind the chip row.
 *
 * The radius sheet shows a live match count against every option — "31 events within
 * 15 miles" — rather than making you pick a number, apply it, and count what came
 * back. INTERACTIONS.md §4 calls this the best small feature in the app, and the
 * reason is that it turns an abstract setting into a direct answer.
 */

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQueries, useQuery } from '@tanstack/react-query';

import { getDataSource } from '@/data';
import { strings } from '@/copy/strings';
import { Button, Chip, Icon, Press, Sheet, Slider, Text } from '@/design/primitives';
import { space } from '@/design/tokens';
import {
  CATEGORY_LABELS,
  EVENT_CATEGORIES,
  METERS_PER_MILE,
  RADIUS_MAX_MI,
  RADIUS_MIN_MI,
  RADIUS_OPTIONS_MI,
  type EventCategory,
  type FeedFilters,
} from '@/types/event';

export type FilterState = Pick<
  FeedFilters,
  'origin' | 'radiusM' | 'window' | 'sort' | 'categories' | 'freeOnly' | 'maxPrice' | 'verifiedOnly'
>;

/* ----------------------------------------------------------------- radius */

export function RadiusSheet({
  visible,
  onClose,
  filters,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onPick: (radiusM: number) => void;
}) {
  // One count per option, fetched only while the sheet is open.
  const counts = useQueries({
    queries: RADIUS_OPTIONS_MI.map((miles) => ({
      queryKey: ['events', 'count', { ...filters, radiusM: miles * METERS_PER_MILE }],
      queryFn: () =>
        getDataSource().countEvents({
          ...filters,
          radiusM: miles * METERS_PER_MILE,
          limit: 1,
          offset: 0,
        }),
      enabled: visible,
      staleTime: 60_000,
    })),
  });

  const currentMiles = Math.round(filters.radiusM / METERS_PER_MILE);

  /**
   * The slider can land anywhere, so its count cannot come from the preset queries.
   * Same shape, same cache — a value that happens to match a preset costs nothing extra.
   */
  const exactCount = useQuery({
    queryKey: ['events', 'count', { ...filters, radiusM: currentMiles * METERS_PER_MILE }],
    queryFn: () =>
      getDataSource().countEvents({
        ...filters,
        radiusM: currentMiles * METERS_PER_MILE,
        limit: 1,
        offset: 0,
      }),
    enabled: visible,
    staleTime: 60_000,
  });

  return (
    <Sheet visible={visible} onClose={onClose} title="Distance">
      <View style={styles.rows}>
        {RADIUS_OPTIONS_MI.map((miles, index) => {
          const count = counts[index]?.data;
          const selected = miles === currentMiles;
          return (
            <Press
              key={miles}
              onPress={() => onPick(miles * METERS_PER_MILE)}
              feedback="select"
              scaleOnPress={false}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={
                count === undefined
                  ? `Within ${miles} miles`
                  : strings.filters.matchCount(count, miles)
              }
              style={styles.row}
            >
              <Text variant="title" color={selected ? 'brand' : 'textPrimary'}>
                {strings.filters.radius(miles)}
              </Text>
              <View style={styles.rowRight}>
                <Text variant="meta" color="textSecondary">
                  {count === undefined ? '—' : `${count}`}
                </Text>
                {selected ? <Icon name="check" size={18} color="brand" /> : null}
              </View>
            </Press>
          );
        })}
      </View>

      {/*
        The presets cover the common answers; this covers the real one. Somebody who
        will drive thirty minutes and not forty is not served by a list that jumps from
        25 to 50, and making them pick the wrong one silently changes what they see.
      */}
      <View style={styles.sliderBlock}>
        <View style={styles.sliderHeading}>
          <Text variant="label" color="textSecondary">
            {strings.filters.radiusSlider}
          </Text>
          <Text variant="meta" color="textSecondary">
            {exactCount.data === undefined
              ? strings.filters.radius(currentMiles)
              : strings.filters.matchCount(exactCount.data, currentMiles)}
          </Text>
        </View>
        <Slider
          value={currentMiles}
          min={RADIUS_MIN_MI}
          max={RADIUS_MAX_MI}
          onChange={(miles) => onPick(miles * METERS_PER_MILE)}
          accessibilityLabel={strings.filters.radiusSlider}
          formatValue={strings.filters.radiusExact}
        />
      </View>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ price */

export function PriceSheet({
  visible,
  onClose,
  filters,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (next: { freeOnly: boolean; maxPrice: number | null }) => void;
}) {
  const options: { label: string; freeOnly: boolean; maxPrice: number | null }[] = [
    { label: strings.filters.anyPrice, freeOnly: false, maxPrice: null },
    { label: 'Free only', freeOnly: true, maxPrice: null },
    { label: 'Under $10', freeOnly: false, maxPrice: 10 },
    { label: 'Under $25', freeOnly: false, maxPrice: 25 },
  ];

  const isSelected = (option: (typeof options)[number]) =>
    option.freeOnly === filters.freeOnly && option.maxPrice === filters.maxPrice;

  return (
    <Sheet visible={visible} onClose={onClose} title="Price">
      <View style={styles.rows}>
        {options.map((option) => {
          const selected = isSelected(option);
          return (
            <Press
              key={option.label}
              onPress={() => onApply({ freeOnly: option.freeOnly, maxPrice: option.maxPrice })}
              feedback="select"
              scaleOnPress={false}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={option.label}
              style={styles.row}
            >
              <Text variant="title" color={selected ? 'brand' : 'textPrimary'}>
                {option.label}
              </Text>
              {selected ? <Icon name="check" size={18} color="brand" /> : null}
            </Press>
          );
        })}
      </View>
    </Sheet>
  );
}

/* --------------------------------------------------------------- category */

export function CategorySheet({
  visible,
  onClose,
  filters,
  onToggle,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onToggle: (category: EventCategory) => void;
  onClear: () => void;
}) {
  const selected = useMemo(() => new Set(filters.categories ?? []), [filters.categories]);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Categories"
      footer={
        <>
          <Button label={strings.filters.clear} variant="ghost" onPress={onClear} />
          <Button label="Done" variant="primary" block onPress={onClose} />
        </>
      }
    >
      <View style={styles.chips}>
        {EVENT_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={CATEGORY_LABELS[category]}
            selected={selected.has(category)}
            onPress={() => onToggle(category)}
          />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sliderBlock: {
    marginTop: space.lg,
    gap: space.xs,
  },
  sliderHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rows: {
    paddingBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingBottom: space.sm,
  },
});
