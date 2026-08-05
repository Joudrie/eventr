/**
 * The verified mark, and the small explanation behind it.
 *
 * DESIGN.md originally argued against a corner sticker — it competes with the title and
 * reads as bolted on. Sean asked for the corner anyway, and he is right about the part
 * that matters: a check mark nobody can interrogate is decoration. Nobody knows what it
 * certifies, so it certifies nothing.
 *
 * So it is a corner mark that answers for itself. Tapping it opens one sentence naming
 * the organiser and what was actually checked, and tapping again closes it. It is not a
 * modal, it does not dim the page, it does not block the card underneath, and it takes
 * itself away after a few seconds if it is ignored.
 *
 * Position is absolute rather than inline. The price sits at the right edge of the same
 * row and its width changes with every event — "Free" against "$35 / $20" — so an
 * inline mark would land at a different x on every card and a column of them would read
 * as misaligned even though each card was individually correct.
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { strings } from '@/copy/strings';
import { DURATION } from '../motion';
import { useTheme } from '../theme';
import { border, radius, space } from '../tokens';
import { Icon } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

/** Long enough to read one sentence, short enough that it never has to be dismissed. */
const AUTO_HIDE_MS = 4000;

/** Diameter of the mark. Under the 44pt tap minimum, so the hit area is padded out. */
const MARK_SIZE = 22;

export type VerifiedMarkProps = {
  organizer: string;
  /**
   * `corner` pins the mark to the top-right of its card. `inline` leaves it in the flow,
   * for the detail screen, where it sits beside the organiser's name and the surrounding
   * text already explains what it means.
   */
  placement?: 'corner' | 'inline';
};

export function VerifiedMark({ organizer, placement = 'corner' }: VerifiedMarkProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    timer.current = setTimeout(() => setOpen(false), AUTO_HIDE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open]);

  return (
    <View style={placement === 'corner' ? styles.anchor : styles.inline}>
      <Press
        onPress={() => setOpen((wasOpen) => !wasOpen)}
        feedback="select"
        scaleOnPress={false}
        accessibilityRole="button"
        accessibilityLabel={strings.verified.label(organizer)}
        accessibilityHint={strings.verified.hint}
        accessibilityState={{ selected: open }}
        style={styles.target}
      >
        <View
          style={[
            styles.mark,
            { borderColor: theme.color.brand, backgroundColor: theme.color.surface },
          ]}
        >
          <Icon name="check" size={13} color="brand" />
        </View>
      </Press>

      {open ? (
        <Animated.View
          entering={FadeIn.duration(DURATION.tap)}
          exiting={FadeOut.duration(DURATION.tap)}
          style={[
            styles.popover,
            { backgroundColor: theme.color.surface, borderColor: theme.color.borderStrong },
          ]}
          // The card already announces the organiser is verified; this is the same fact
          // twice to a screen reader, which only slows it down.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text variant="meta">{strings.verified.explainer(organizer)}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    // Offset by the card's padding, because the mark is painted over the card from
    // outside it rather than laid out within its content box.
    top: space.md,
    right: space.md,
    // Above the card's own content so the popover is not painted under the next row.
    zIndex: 2,
  },
  inline: {
    zIndex: 2,
  },
  target: {
    // Pads a 22pt mark out to a 44pt target without moving the mark itself.
    padding: (44 - MARK_SIZE) / 2,
    margin: -((44 - MARK_SIZE) / 2),
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    borderWidth: border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popover: {
    position: 'absolute',
    top: MARK_SIZE + space.sm,
    right: 0,
    // Right-anchored: the mark sits near the right edge in both placements, so opening
    // leftward is the only direction with room.
    width: 232,
    padding: space.sm,
    borderWidth: border.hairline,
    borderRadius: radius.base,
  },
});
