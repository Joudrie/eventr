/**
 * The four time windows. `Now` is first and is the flagship — it answers "I am in the
 * car right now, what is happening", which is the whole reason this app exists.
 *
 * The underline slides between tabs rather than cutting, so the eye can follow which
 * one moved. Direction carries meaning; a crossfade would throw that away.
 *
 * Two things this has to get right, both of which it previously got wrong:
 *
 * 1. **Measure against the row.** Each tab is wrapped in a plain `View` that is a direct
 *    child of the row, because `onLayout` reports a position relative to the parent.
 *    Measuring an element nested inside `Press` yields an offset relative to the
 *    Pressable — near zero for every tab — so the underline had no idea where to go.
 *
 * 2. **Move when the selection changes, not when layout does.** `onLayout` fires when a
 *    tab's geometry changes, which after mount is never. Positioning only from there
 *    left the underline parked under whichever tab happened to be selected first, no
 *    matter what you tapped afterwards. The layouts are cached and the selection drives
 *    the animation.
 */

import { useEffect, useRef } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { strings } from '@/copy/strings';
import { Press, Text } from '@/design/primitives';
import { timing } from '@/design/motion';
import { border, space } from '@/design/tokens';
import { useTheme } from '@/design/theme';
import type { FeedWindow } from '@/types/event';

const TABS: readonly { key: FeedWindow; label: string }[] = [
  { key: 'now', label: strings.feed.tabs.now },
  { key: 'today', label: strings.feed.tabs.today },
  { key: 'weekend', label: strings.feed.tabs.weekend },
  { key: 'all', label: strings.feed.tabs.all },
];

type Measurement = { x: number; width: number };

export type TimeTabsProps = {
  value: FeedWindow;
  onChange: (next: FeedWindow) => void;
};

export function TimeTabs({ value, onChange }: TimeTabsProps) {
  const theme = useTheme();
  const underlineX = useSharedValue(0);
  const underlineWidth = useSharedValue(0);

  const layouts = useRef<Record<number, Measurement>>({});
  /** False until the underline has a real position, so the first placement cuts. */
  const placed = useRef(false);

  const activeIndex = TABS.findIndex((tab) => tab.key === value);

  const place = (index: number) => {
    const measured = layouts.current[index];
    if (!measured) return;

    // Snap on first placement, animate on every change after — otherwise the underline
    // visibly slides in from the left edge on mount, which is an entrance animation.
    if (placed.current) {
      underlineX.value = withTiming(measured.x, timing('snap'));
      underlineWidth.value = withTiming(measured.width, timing('snap'));
    } else {
      placed.current = true;
      underlineX.value = measured.x;
      underlineWidth.value = measured.width;
    }
  };

  const handleLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    layouts.current[index] = { x, width };
    // The active tab measuring for the first time is what puts the underline on screen.
    if (index === activeIndex) place(index);
  };

  useEffect(() => {
    place(activeIndex);
    // `place` closes over refs and shared values, all of which are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
    width: underlineWidth.value,
  }));

  return (
    <View style={[styles.row, { borderBottomColor: theme.color.border }]}>
      {TABS.map((tab, index) => {
        const active = tab.key === value;
        return (
          <View key={tab.key} onLayout={handleLayout(index)}>
            <Press
              onPress={() => onChange(tab.key)}
              feedback="select"
              scaleOnPress={false}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              style={styles.tab}
            >
              <Text variant="title" color={active ? 'textPrimary' : 'textSecondary'}>
                {tab.label}
              </Text>
            </Press>
          </View>
        );
      })}
      <Animated.View
        style={[styles.underline, underlineStyle, { backgroundColor: theme.color.brand }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.lg,
    paddingHorizontal: space.lg,
    borderBottomWidth: border.hairline,
  },
  tab: {
    paddingVertical: space.sm,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: space.lg,
    height: 2,
  },
});
