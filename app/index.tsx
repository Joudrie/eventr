/**
 * Phase 0 rails check.
 *
 * Proves the foundation works end to end: tokens resolve in both schemes, Reanimated
 * runs on the UI thread, gestures and haptics fire, and reduced motion is honored.
 * Phase 2 replaces this with the real primitive gallery; Phase 3 replaces the route
 * with the feed.
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design/theme';
import { DURATION, EASING, PRESS_SCALE, haptics, timing } from '@/design/motion';
import { border, labelTransform, radius, size, space, type } from '@/design/tokens';
import { Text } from '@/design/primitives/Text';

const TYPE_VARIANTS = ['displayXl', 'displayL', 'title', 'body', 'meta', 'label'] as const;

export default function RailsCheck() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const pressed = useSharedValue(0);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - PRESS_SCALE) }],
    opacity: 1 - pressed.value * 0.15,
  }));

  const colorRoles = [
    ['page', theme.color.page],
    ['surface', theme.color.surface],
    ['brand', theme.color.brand],
    ['accent', theme.color.accent],
    ['danger', theme.color.danger],
    ['textSecondary', theme.color.textSecondary],
  ] as const;

  return (
    <ScrollView
      style={{ backgroundColor: theme.color.page }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl },
      ]}
    >
      <Text variant="label" color="textSecondary">
        Phase 0
      </Text>
      <Text variant="displayL" style={styles.heading}>
        Rails check
      </Text>

      <Section title="Type scale">
        {TYPE_VARIANTS.map((variant) => (
          <Text key={variant} variant={variant} style={styles.typeRow}>
            {variant === 'label' ? 'Label · 11' : `${variant} · ${type[variant].fontSize}`}
          </Text>
        ))}
      </Section>

      <Section title={`Color roles · ${theme.scheme}`}>
        <View style={styles.swatchRow}>
          {colorRoles.map(([name, value]) => (
            <View key={name} style={styles.swatch}>
              <View
                style={[
                  styles.swatchChip,
                  { backgroundColor: value, borderColor: theme.color.borderStrong },
                ]}
              />
              <Text variant="meta" color="textSecondary">
                {name}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Motion">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rails check target. Press to run a token-driven animation."
          onPressIn={() => {
            haptics.commit();
            pressed.value = withTiming(1, timing('tap'));
          }}
          onPressOut={() => {
            pressed.value = withTiming(0, timing('snap', EASING.exit));
          }}
        >
          <Animated.View
            style={[
              styles.target,
              boxStyle,
              { backgroundColor: theme.color.brand, borderColor: theme.color.borderStrong },
            ]}
          >
            <Text variant="title" color="textOnBrand">
              Press and hold
            </Text>
            <Text variant="meta" color="textOnBrand">
              {DURATION.tap}ms in · {DURATION.snap}ms out
            </Text>
          </Animated.View>
        </Pressable>

        <Text variant="meta" color="textSecondary" style={styles.note}>
          {reduced
            ? 'Reduced motion is on. Transitions resolve instantly.'
            : 'Reduced motion is off. Transitions run at full duration.'}
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: theme.color.border }]}>
      <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
  },
  heading: {
    marginBottom: space.lg,
  },
  section: {
    borderTopWidth: border.hairline,
    paddingTop: space.md,
    marginTop: space.lg,
  },
  sectionTitle: {
    textTransform: labelTransform,
    marginBottom: space.md,
  },
  typeRow: {
    marginBottom: space.sm,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  swatch: {
    gap: space.xs,
  },
  swatchChip: {
    width: size.minTapTarget,
    height: size.minTapTarget,
    borderRadius: radius.base,
    borderWidth: border.hairline,
  },
  target: {
    minHeight: size.minTapTarget * 2,
    borderRadius: radius.base,
    borderWidth: border.hairline,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    justifyContent: 'center',
    gap: space.xs,
  },
  note: {
    marginTop: space.md,
  },
});
