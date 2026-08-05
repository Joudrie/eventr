/**
 * Bottom toast. The recovery affordance for anything that failed.
 *
 * INTERACTIONS.md §1: a failed action reverts and shows a toast with a retry — never a
 * blocking dialog. A modal for something recoverable stops the user to tell them
 * something they could have fixed with one tap.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DURATION } from '../motion';
import { useTheme } from '../theme';
import { border, elevation, radius, space } from '../tokens';
import { Button } from './Button';
import { Text } from './Text';

export type ToastProps = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  action?: { label: string; onPress: () => void };
  tone?: 'neutral' | 'danger';
  /** Auto-dismiss delay. Longer when there is an action to read and act on. */
  durationMs?: number;
};

export function Toast({
  message,
  visible,
  onDismiss,
  action,
  tone = 'neutral',
  durationMs,
}: ToastProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const timeout = durationMs ?? (action ? 6000 : 3500);

  useEffect(() => {
    if (!visible) return;
    const handle = setTimeout(onDismiss, timeout);
    return () => clearTimeout(handle);
  }, [visible, timeout, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      // The one exception to "nothing animates on entry": a toast has no other way to
      // announce itself, and its arrival IS the feedback.
      entering={SlideInDown.duration(DURATION.move)}
      exiting={SlideOutDown.duration(DURATION.settle)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        elevation.floating,
        {
          bottom: insets.bottom + space.lg,
          backgroundColor: theme.color.surfaceRaised,
          borderColor: tone === 'danger' ? theme.color.danger : theme.color.borderStrong,
        },
      ]}
    >
      <View style={styles.message}>
        <Text variant="body">{message}</Text>
      </View>
      {action ? <Button label={action.label} variant="ghost" onPress={action.onPress} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderWidth: border.hairline,
    borderRadius: radius.base,
  },
  message: {
    flex: 1,
  },
});
