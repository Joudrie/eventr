/**
 * Going / Interested — the hero interaction.
 *
 * INTERACTIONS.md §1. Someone deciding to spend their Saturday somewhere should feel a
 * small click of commitment, so Going gets the whole sequence: press scale, haptic on
 * press-in, a fill that sweeps in from the left, and a count that rolls.
 *
 * Interested is deliberately quieter — no sweep, no card pulse, a softer haptic. It is
 * a bookmark, not a commitment, and the hierarchy between the two should be legible
 * without reading the labels.
 *
 * Undo is the same tap, run backwards at `settle`. Commitment gets the flourish;
 * undoing should feel unremarkable.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { strings } from '@/copy/strings';
import { EASING, timing } from '@/design/motion';
import { Icon, Odometer, Press, Text } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, radius, size, space } from '@/design/tokens';
import { displayCount, useRsvps } from '@/lib/rsvp';
import type { FeedEvent } from '@/types/event';

export function RsvpButtons({ event }: { event: FeedEvent }) {
  const { stanceFor, setRsvp } = useRsvps();
  const stance = stanceFor(event.id);

  const going = stance === 'going';
  const interested = stance === 'interested';

  const goingCount = displayCount(event.goingCount, going);
  const interestedCount = displayCount(event.interestedCount, interested);

  return (
    <View>
      <View style={styles.row}>
        <GoingButton active={going} onPress={() => setRsvp(event.id, 'going')} />
        <InterestedButton active={interested} onPress={() => setRsvp(event.id, 'interested')} />
      </View>

      <View style={styles.counts}>
        <Odometer value={goingCount} />
        <Text variant="meta" color="textSecondary">
          {' going · '}
        </Text>
        <Odometer value={interestedCount} />
        <Text variant="meta" color="textSecondary">
          {' interested'}
        </Text>
      </View>

      {/* Honest about what this is until there is a backend behind it. */}
      <Text variant="meta" color="textSecondary" style={styles.note}>
        Saved on this device. No account needed.
      </Text>
    </View>
  );
}

function GoingButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const theme = useTheme();

  /**
   * Commit sweeps in at `snap`; undo retracts at `settle`. Deliberately asymmetric —
   * the decision is the moment worth marking, not the reversal.
   */
  const progress = useDerivedValue(() =>
    withTiming(active ? 1 : 0, active ? timing('snap') : timing('settle', EASING.exit)),
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Press
      onPress={onPress}
      feedback="commit"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={active ? strings.rsvp.goingActive : strings.rsvp.going}
      accessibilityHint={active ? 'Tap again to undo' : "Marks that you're going"}
      style={[
        styles.button,
        { borderColor: active ? theme.color.brand : theme.color.borderStrong },
      ]}
    >
      {/* The sweep is a solid fill growing from the left edge, never a gradient. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, fillStyle, { backgroundColor: theme.color.brand }]}
      />
      <View style={styles.label}>
        {active ? <Icon name="check" size={18} color="textOnBrand" /> : null}
        <Text variant="title" color={active ? 'textOnBrand' : 'textPrimary'}>
          {active ? strings.rsvp.goingActive : strings.rsvp.going}
        </Text>
      </View>
    </Press>
  );
}

function InterestedButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Press
      onPress={onPress}
      feedback="select"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={active ? strings.rsvp.interestedActive : strings.rsvp.interested}
      style={[
        styles.button,
        {
          borderColor: active ? theme.color.accentPressed : theme.color.borderStrong,
          backgroundColor: active ? theme.color.accent : 'transparent',
        },
      ]}
    >
      <View style={styles.label}>
        <Text variant="title" color={active ? 'textOnAccent' : 'textPrimary'}>
          {active ? strings.rsvp.interestedActive : strings.rsvp.interested}
        </Text>
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  button: {
    minHeight: size.minTapTarget,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderWidth: border.hairline,
    borderRadius: radius.base,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  counts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
  },
  note: {
    marginTop: space.xs,
  },
});
