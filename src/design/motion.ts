/**
 * Eventr motion tokens — durations, easings, springs, and haptics.
 *
 * Nothing outside `src/design/` may define a duration, easing curve, or haptic call.
 * See INTERACTIONS.md for the reasoning; §0 is the governing rule:
 * animation is feedback, never decoration.
 */

import {
  Easing,
  ReduceMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/* ----------------------------------------------------------------- duration */

/**
 * The complete duration ladder. Pick from this set — never invent a duration.
 * Nothing interactive is slower than `settle`; `slow` is ambient only.
 */
export const DURATION = {
  /** Optimistic state changes. Never wait on a network call. */
  instant: 0,
  /** Press-in / press-out. */
  tap: 90,
  /** Toggles, chips, tab underline, odometer count rolls. */
  snap: 140,
  /** Sheets, shared-element transitions, page pushes. */
  move: 220,
  /** Dismissals, undo reversals. Undo is slower than commit, deliberately. */
  settle: 320,
  /** Ambient only — the live-now dot. Nothing interactive may use this. */
  slow: 900,
} as const;

export type DurationToken = keyof typeof DURATION;

/* ------------------------------------------------------------------- easing */

export const EASING = {
  /** Almost everything. */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** Things leaving the screen. */
  exit: Easing.bezier(0.4, 0, 1, 1),
} as const;

/**
 * Sheets and shared elements only. No bounce, no elastic — this config is
 * critically damped enough that overshoot stays under 1.03.
 */
export const SPRING: WithSpringConfig = {
  damping: 18,
  stiffness: 220,
  mass: 1,
  overshootClamping: false,
  // Reanimated 4 replaced the rest displacement/speed pair with a single energy threshold.
  energyThreshold: 6e-9,
};

/** The one scale value permitted to exceed 1.0. Above this, "playful" becomes "template". */
export const MAX_OVERSHOOT_SCALE = 1.03;

export const PRESS_SCALE = 0.96;

/* ------------------------------------------------------------ reduced motion */

/**
 * Reanimated resolves `ReduceMotion.System` per-animation against the OS setting,
 * so honoring the preference is structural rather than something to retrofit.
 */
export const REDUCE_MOTION = ReduceMotion.System;

export function timing(duration: DurationToken, easing = EASING.standard): WithTimingConfig {
  return {
    duration: DURATION[duration],
    easing,
    reduceMotion: REDUCE_MOTION,
  };
}

export function spring(): WithSpringConfig {
  return { ...SPRING, reduceMotion: REDUCE_MOTION };
}

/* ------------------------------------------------------------------ haptics */

/**
 * The complete haptic map from INTERACTIONS.md §8. Haptics on scroll or on every
 * tap is worse than none at all — restraint is the whole skill.
 *
 * Silently no-ops on web, where the API does not exist.
 */
const canVibrate = Platform.OS === 'ios' || Platform.OS === 'android';

function safely(run: () => Promise<void>): void {
  if (!canVibrate) return;
  void run().catch(() => {
    /* haptics are non-essential; a failure must never surface to the user */
  });
}

export const haptics = {
  /** Going — fires on press-IN, not release. On release it feels laggy even when it isn't. */
  commit: () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Interested, undo, chip toggle, tab change. */
  select: () => safely(() => Haptics.selectionAsync()),
  /** Pull-to-refresh threshold. */
  threshold: () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Post submitted. */
  success: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Action failed. */
  error: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
} as const;

/* -------------------------------------------------------------------- shake */

/** Failure shake: 4px horizontal, 2 cycles, 180ms total. */
export const SHAKE = {
  distance: 4,
  cycles: 2,
  totalDuration: 180,
} as const;
