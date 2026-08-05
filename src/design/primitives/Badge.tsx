/**
 * Small status markers: SPONSORED, FULL, FILLING UP, ORGANIZER, LIVE.
 *
 * Always the `label` type variant — 11px, bold, uppercase, tracked. Badges state a
 * fact about the thing they sit on; they are never decoration.
 */

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { border, radius, size, space } from '../tokens';
import { Icon } from './Icon';
import { Text } from './Text';
import { DURATION } from '../motion';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'accent' | 'danger';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useTheme();

  const palette = {
    neutral: {
      background: 'transparent',
      borderColor: theme.color.borderStrong,
      text: 'textSecondary',
    },
    brand: { background: theme.color.brand, borderColor: theme.color.brand, text: 'textOnBrand' },
    accent: {
      background: theme.color.accent,
      borderColor: theme.color.accent,
      text: 'textOnAccent',
    },
    danger: { background: 'transparent', borderColor: theme.color.danger, text: 'danger' },
  } as const;

  const chosen = palette[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: chosen.background, borderColor: chosen.borderColor },
      ]}
    >
      <Text variant="label" color={chosen.text}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The verified mark. Inline after a title at text size, per DESIGN.md — not a floating
 * sticker in the card corner like the reference mock, which competes with the title for
 * the eye and looks bolted on.
 */
export function VerifiedMark({ organizer }: { organizer: string }) {
  return (
    <View accessibilityLabel={`${organizer}, verified organizer`} style={styles.verified}>
      <Icon name="check" size={14} color="brand" />
    </View>
  );
}

/**
 * The live dot. The single piece of ambient motion in the entire app — which is exactly
 * what makes it read as important rather than as noise (INTERACTIONS.md §2).
 */
export function LiveDot() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: DURATION.slow / 2 }),
        withTiming(1, { duration: DURATION.slow / 2 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const theme = useTheme();

  return (
    <Animated.View
      accessibilityLabel="Happening now"
      style={[animated, styles.dot, { backgroundColor: theme.color.danger }]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderWidth: border.hairline,
    borderRadius: radius.base,
    alignSelf: 'flex-start',
  },
  verified: {
    justifyContent: 'center',
  },
  dot: {
    width: size.liveDot,
    height: size.liveDot,
    borderRadius: radius.pill,
  },
});
