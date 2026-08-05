/**
 * Loading skeletons.
 *
 * A gentle opacity pulse, never a diagonal shimmer sweep. The shimmer is both a
 * generated-app tell (INTERACTIONS.md §9) and a gradient, which DESIGN.md bans outright.
 *
 * Skeletons must occupy the exact dimensions of the content they stand in for — the
 * swap to real content is a crossfade in place, with no layout shift.
 */

import { useEffect } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { DURATION, EASING } from '../motion';
import { useTheme } from '../theme';
import { radius, space } from '../tokens';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 14, style }: SkeletonProps) {
  const theme = useTheme();
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: DURATION.slow / 2, easing: EASING.standard }),
        withTiming(0.6, { duration: DURATION.slow / 2, easing: EASING.standard }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        animated,
        { width, height, backgroundColor: theme.color.skeleton, borderRadius: radius.base },
        style,
      ]}
    />
  );
}

/**
 * A skeleton shaped like a real event card, including the no-photo variant's wider
 * title block. Placeholder rows that do not match the content they replace produce a
 * visible jump the moment data lands.
 */
export function SkeletonCard({ withPhoto = false }: { withPhoto?: boolean }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.color.surface, borderColor: theme.color.border },
      ]}
    >
      <View style={styles.row}>
        {withPhoto ? <Skeleton width={88} height={88} /> : null}
        <View style={styles.body}>
          <Skeleton width="72%" height={18} />
          <Skeleton width="94%" height={14} />
          <Skeleton width="46%" height={14} />
        </View>
      </View>
      <View style={styles.meta}>
        <Skeleton width={64} height={12} />
        <Skeleton width={52} height={12} />
        <Skeleton width={70} height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.base,
    padding: space.md,
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
  },
  body: {
    flex: 1,
    gap: space.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: space.md,
  },
});
