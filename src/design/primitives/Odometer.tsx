/**
 * A number that rolls when it changes.
 *
 * INTERACTIONS.md §1: digits slide up, clipped, at `snap`. **Only the digits that
 * actually changed move** — rolling the whole number when 23 becomes 24 draws the eye
 * to the wrong place and reads as a slot machine.
 *
 * Each place is a column holding 0–9 that translates to its target. That makes the
 * "only changed digits move" property fall out of the structure rather than needing to
 * be computed, and it keeps the component free of state and effects entirely.
 *
 * This is the feedback that makes tapping Going feel like it registered somewhere
 * rather than just toggling a button.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { timing } from '../motion';
import { type as typeScale, type TypeVariant } from '../tokens';
import { Text, type TextColor } from './Text';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export type OdometerProps = {
  value: number;
  variant?: TypeVariant;
  color?: TextColor;
};

export function Odometer({ value, variant = 'meta', color = 'textSecondary' }: OdometerProps) {
  const digits = String(Math.max(0, Math.round(value))).split('');

  return (
    /**
     * The whole strip is announced as a single number. Without this every column
     * exposes all ten of its digits, so a screen reader reads "zero one two three…"
     * for each place — and the same noise shows up in any text extraction.
     */
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={String(value)}>
      {digits.map((digit, index) => (
        <Digit
          // Keyed by place from the right, so 9 → 10 adds a column instead of
          // remounting every digit and losing the animation.
          key={digits.length - index}
          digit={digit}
          variant={variant}
          color={color}
        />
      ))}
    </View>
  );
}

function Digit({
  digit,
  variant,
  color,
}: {
  digit: string;
  variant: TypeVariant;
  color: TextColor;
}) {
  const { lineHeight } = typeScale[variant];
  const target = Number(digit);

  // Recomputes and animates whenever `target` changes; holds still when it doesn't,
  // which is exactly the "only changed digits move" behavior.
  const offset = useDerivedValue(() => withTiming(-target * lineHeight, timing('snap')));

  const columnStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View
      style={{ height: lineHeight, overflow: 'hidden' }}
      // All three: iOS, Android, and web each read a different one of these.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
      <Animated.View style={columnStyle}>
        {DIGITS.map((candidate) => (
          <Text key={candidate} variant={variant} color={color} style={{ height: lineHeight }}>
            {candidate}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
