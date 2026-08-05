/**
 * The four time windows. `Now` is first and is the flagship — it answers "I am in the
 * car right now, what is happening", which is the whole reason this app exists.
 *
 * The underline slides between tabs rather than cutting, so the eye can follow which
 * one moved. Direction carries meaning; a crossfade would throw that away.
 */

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

export type TimeTabsProps = {
  value: FeedWindow;
  onChange: (next: FeedWindow) => void;
};

export function TimeTabs({ value, onChange }: TimeTabsProps) {
  const theme = useTheme();
  const underlineX = useSharedValue(0);
  const underlineWidth = useSharedValue(0);

  const handleLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    if (TABS[index]?.key !== value) return;
    // Snap on first measure, animate on every change after — otherwise the underline
    // visibly slides in from the left edge on mount, which is an entrance animation.
    if (underlineWidth.value === 0) {
      underlineX.value = x;
      underlineWidth.value = width;
      return;
    }
    underlineX.value = withTiming(x, timing('snap'));
    underlineWidth.value = withTiming(width, timing('snap'));
  };

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
    width: underlineWidth.value,
  }));

  return (
    <View style={[styles.row, { borderBottomColor: theme.color.border }]}>
      {TABS.map((tab, index) => {
        const active = tab.key === value;
        return (
          <Press
            key={tab.key}
            onPress={() => onChange(tab.key)}
            feedback="select"
            scaleOnPress={false}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            style={styles.tab}
          >
            <View onLayout={handleLayout(index)}>
              <Text variant="title" color={active ? 'textPrimary' : 'textSecondary'}>
                {tab.label}
              </Text>
            </View>
          </Press>
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
