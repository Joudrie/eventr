/**
 * Bottom sheet. Springs up, dims the page behind it, and follows your finger down.
 *
 * The dismissal is velocity-aware (INTERACTIONS.md §4): a fast flick closes it even if
 * you barely moved it, because intent lives in the speed, not the distance. A
 * distance-only threshold makes a sheet feel sticky in exactly the case where the user
 * was most decisive.
 *
 * The sheet owns its own exit — it plays the close animation and *then* calls
 * `onClose`, rather than being unmounted mid-animation by a parent state flip.
 */

import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spring, timing } from '../motion';
import { useTheme } from '../theme';
import { border, elevation, radius, space } from '../tokens';
import { Text } from './Text';

/** Fraction of the sheet's height you must drag before it closes on release. */
const DISTANCE_THRESHOLD = 0.28;
/** Downward velocity (px/s) that closes it regardless of distance. */
const VELOCITY_THRESHOLD = 800;
/** Off-screen resting position before the sheet has been measured. */
const UNMEASURED_OFFSET = 900;

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Pinned below the scrollable content — Apply / Clear, typically. */
  footer?: ReactNode;
};

export function Sheet({ visible, onClose, title, children, footer }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [sheetHeight, setSheetHeight] = useState(0);
  const translateY = useSharedValue(UNMEASURED_OFFSET);

  /**
   * The entrance is driven by layout rather than an effect. `Modal` unmounts its
   * children while hidden, so the first measurement after opening is a reliable
   * "we are about to appear" signal — and it is the first moment the exact travel
   * distance is known, so the spring starts from the sheet's real height instead of
   * a guess.
   */
  const handleLayout = (height: number) => {
    if (sheetHeight === 0) {
      translateY.value = height;
      translateY.value = withSpring(0, spring());
    }
    setSheetHeight(height);
  };

  /** Resets the measurement so the next open re-runs the entrance. */
  const handleClosed = () => {
    setSheetHeight(0);
    onClose();
  };

  const close = () => {
    const distance = sheetHeight > 0 ? sheetHeight : UNMEASURED_OFFSET;
    translateY.value = withTiming(distance, timing('settle'), (finished) => {
      if (finished) runOnJS(handleClosed)();
    });
  };

  const pan = Gesture.Pan()
    .onChange((event) => {
      // Downward only. Dragging up must not detach the sheet from the screen edge.
      translateY.value = Math.max(0, translateY.value + event.changeY);
    })
    .onEnd((event) => {
      const measured = sheetHeight > 0 ? sheetHeight : UNMEASURED_OFFSET;
      const draggedFarEnough = translateY.value > measured * DISTANCE_THRESHOLD;
      const flickedHardEnough = event.velocityY > VELOCITY_THRESHOLD;

      if (draggedFarEnough || flickedHardEnough) {
        translateY.value = withTiming(measured, timing('settle'), (finished) => {
          if (finished) runOnJS(handleClosed)();
        });
      } else {
        translateY.value = withSpring(0, spring());
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const measured = sheetHeight > 0 ? sheetHeight : UNMEASURED_OFFSET;
    return { opacity: interpolate(translateY.value, [0, measured], [1, 0], 'clamp') };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.color.overlay }]}
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={close}
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            onLayout={(event) => handleLayout(event.nativeEvent.layout.height)}
            style={[
              styles.sheet,
              sheetStyle,
              elevation.sheet,
              {
                backgroundColor: theme.color.surfaceRaised,
                borderColor: theme.color.border,
                maxHeight: windowHeight * 0.85,
                paddingBottom: insets.bottom + space.lg,
              },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: theme.color.borderStrong }]} />

            {title ? (
              <Text variant="label" color="textSecondary" style={styles.title}>
                {title}
              </Text>
            ) : null}

            <View style={styles.body}>{children}</View>

            {footer ? (
              <View style={[styles.footer, { borderTopColor: theme.color.border }]}>{footer}</View>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: border.hairline,
    borderTopLeftRadius: radius.base,
    borderTopRightRadius: radius.base,
    paddingTop: space.sm,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginBottom: space.md,
  },
  title: {
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  body: {
    paddingHorizontal: space.lg,
  },
  footer: {
    borderTopWidth: border.hairline,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    marginTop: space.lg,
    flexDirection: 'row',
    gap: space.sm,
  },
});
