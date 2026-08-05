/**
 * A one-dimensional value slider, built on the gesture and animation stack this project
 * already uses rather than pulled in as a dependency.
 *
 * `@react-native-community/slider` would have been one line, and would have rendered a
 * platform control on iOS, a different platform control on Android, and an `<input
 * type=range>` on web — three appearances, none of them this design system's, and no
 * way to make the thumb match the rest of the app. This is about sixty lines and looks
 * the same everywhere.
 *
 * The thumb tracks the finger on the UI thread. Only the committed value crosses back to
 * JS, so dragging never queues a re-render per frame — which matters here because the
 * value drives a network count.
 */

import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { haptics } from '../motion';
import { useTheme } from '../theme';
import { border, radius, size, space } from '../tokens';

const THUMB = 28;
const TRACK_HEIGHT = 4;

export type SliderProps = {
  value: number;
  min: number;
  max: number;
  /** Values snap to this grid. Whole miles, so the label never reads "13.4 mi". */
  step?: number;
  onChange: (next: number) => void;
  accessibilityLabel: string;
  /** Spoken value, e.g. "13 miles". Falls back to the bare number. */
  formatValue?: (value: number) => string;
};

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  accessibilityLabel,
  formatValue,
}: SliderProps) {
  const theme = useTheme();

  const trackWidth = useSharedValue(0);
  /**
   * Where the finger last put the thumb, 0..1, or -1 before anything has been dragged.
   *
   * The thumb's real position is resolved inside the worklet from this and the `value`
   * prop, rather than being kept in sync by an effect. That is not a style preference:
   * a `useEffect` writing `progress.value` makes the React Compiler treat every shared
   * value in the component as immutable, and the gesture callbacks stop being allowed
   * to write to them at all. Resolving instead of syncing keeps one source of truth and
   * costs nothing.
   */
  const drag = useSharedValue(-1);
  /** The progress matching the last value this slider itself sent up. */
  const committed = useSharedValue(-1);

  // Props win whenever the user is not actively dragging, so tapping a preset above
  // moves the thumb. Writing during a drag would fight the finger, and writing during
  // render would be a side effect in the render pass.

  const commit = (next: number) => {
    if (next !== value) {
      haptics.select();
      onChange(next);
    }
  };

  const settle = (raw: number) => {
    'worklet';
    const snapped = snap(raw, min, max, step);
    const snappedProgress = toProgress(snapped, min, max);
    // Park the thumb exactly where the value it just sent up will put it, so there is no
    // frame where it springs back to the old position while the parent re-renders.
    drag.value = snappedProgress;
    committed.value = snappedProgress;
    runOnJS(commit)(snapped);
  };

  const pan = Gesture.Pan()
    .onBegin((event) => {
      drag.value = clamp01(event.x / Math.max(1, trackWidth.value));
    })
    .onUpdate((event) => {
      drag.value = clamp01(event.x / Math.max(1, trackWidth.value));
    })
    .onFinalize(() => {
      settle(drag.value);
    });

  // A tap anywhere on the track jumps there. Making the thumb the only target turns a
  // one-second adjustment into a hunt for a 28pt circle.
  const tap = Gesture.Tap().onEnd((event) => {
    settle(clamp01(event.x / Math.max(1, trackWidth.value)));
  });

  /**
   * Resolve the thumb: the finger wins until something outside changes the value —
   * tapping a preset row above, say — at which point the prop wins again.
   */
  const position = (): number => {
    'worklet';
    const fromProp = toProgress(value, min, max);
    const externalChange = Math.abs(fromProp - committed.value) > 1e-6;
    return drag.value < 0 || externalChange ? fromProp : drag.value;
  };

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position() * Math.max(0, trackWidth.value - THUMB) }],
    // Hidden until the track has been measured, so it never flashes at the left edge
    // one frame before it knows where it belongs.
    opacity: trackWidth.value > 0 ? 1 : 0,
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: position() * trackWidth.value,
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    // onLayout is a plain JS callback, and the React Compiler will not let one write a
    // shared value — only worklets may. Hopping to the UI thread is both what satisfies
    // it and where the write actually belongs, since every reader of this is a worklet.
    runOnUI((next: number) => {
      trackWidth.value = next;
    })(measured);
  };

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View
        onLayout={onLayout}
        style={styles.hit}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min,
          max,
          now: value,
          text: formatValue ? formatValue(value) : String(value),
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const delta = event.nativeEvent.actionName === 'increment' ? step : -step;
          commit(Math.min(max, Math.max(min, value + delta)));
        }}
      >
        <View style={[styles.track, { backgroundColor: theme.color.surfaceSunken }]}>
          <Animated.View style={[styles.fill, fillStyle, { backgroundColor: theme.color.brand }]} />
        </View>

        <Animated.View
          style={[
            styles.thumb,
            thumbStyle,
            { backgroundColor: theme.color.surface, borderColor: theme.color.brand },
          ]}
        />
      </View>
    </GestureDetector>
  );
}

function toProgress(value: number, min: number, max: number): number {
  'worklet';
  if (max === min) return 0;
  return clamp01((value - min) / (max - min));
}

function snap(progress: number, min: number, max: number, step: number): number {
  const raw = min + progress * (max - min);
  return Math.min(max, Math.max(min, Math.round(raw / step) * step));
}

function clamp01(value: number): number {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

const styles = StyleSheet.create({
  hit: {
    height: size.minTapTarget,
    justifyContent: 'center',
    marginVertical: space.xs,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.base,
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: border.strong,
  },
});
