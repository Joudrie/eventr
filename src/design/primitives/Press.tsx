/**
 * The press behavior every interactive primitive shares.
 *
 * Centralizing it means the press-in scale, the haptic timing, and the reduced-motion
 * path are decided once. In particular the haptic fires on press-IN, not release
 * (INTERACTIONS.md §1) — on release it feels laggy even when it isn't, and that is
 * exactly the kind of detail that gets lost if every component re-implements it.
 */

import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASING, PRESS_SCALE, haptics, timing } from '../motion';
import { size as sizeTokens } from '../tokens';

export type PressFeedback = 'commit' | 'select' | 'none';

export type PressProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** Which haptic fires on press-in. `commit` is reserved for Going. */
  feedback?: PressFeedback;
  /** Set false for large surfaces like cards, where a scale reads as a wobble. */
  scaleOnPress?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'checkbox';
  accessibilityState?: { selected?: boolean; disabled?: boolean; checked?: boolean };
};

export function Press({
  children,
  onPress,
  onLongPress,
  disabled = false,
  feedback = 'select',
  scaleOnPress = true,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
}: PressProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: scaleOnPress ? [{ scale: 1 - pressed.value * (1 - PRESS_SCALE) }] : [{ scale: 1 }],
    opacity: 1 - pressed.value * (scaleOnPress ? 0 : 0.12),
  }));

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        if (feedback === 'commit') haptics.commit();
        else if (feedback === 'select') haptics.select();
        pressed.value = withTiming(1, timing('tap'));
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, timing('snap', EASING.exit));
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
      // Every control clears the 44px minimum, whatever its visual size.
      hitSlop={sizeTokens.minTapTarget / 4}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
