/**
 * The card surface. Flat, bordered, 4px radius — no shadow.
 *
 * DESIGN.md tell #3: shadows are reserved for things that genuinely float (sheets, the
 * post button). A feed of soft-shadowed rounded rectangles is the single most common
 * generated-app silhouette, and a border does the same job without it.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import { border, radius, space } from '../tokens';
import { Press } from './Press';

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Dims the card and drops it down-sort — used for `full` events, which stay visible. */
  muted?: boolean;
  /**
   * Paid-placement marking. `promoted` is an event someone paid to lift, `ad` is an
   * outright advertisement. Organic cards pass nothing and keep the hairline, which is
   * the point: the default costs nobody anything and looks like it.
   */
  edge?: 'none' | 'promoted' | 'ad';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Card({
  children,
  onPress,
  onLongPress,
  muted = false,
  edge = 'none',
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const theme = useTheme();

  const edgeColor =
    edge === 'promoted'
      ? theme.color.edgePromoted
      : edge === 'ad'
        ? theme.color.edgeAd
        : theme.color.border;

  const surface = [
    styles.card,
    {
      backgroundColor: theme.color.surface,
      borderColor: edgeColor,
      // A paid edge has to survive being glanced at; the hairline is structural only.
      borderWidth: edge === 'none' ? border.hairline : border.strong,
      opacity: muted ? 0.6 : 1,
    },
    style,
  ];

  if (!onPress && !onLongPress) {
    return <View style={surface}>{children}</View>;
  }

  return (
    <Press
      onPress={onPress}
      onLongPress={onLongPress}
      feedback="select"
      // A full-width card that scales on press reads as a wobble rather than a press.
      scaleOnPress={false}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={surface}
    >
      {children}
    </Press>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: border.hairline,
    borderRadius: radius.base,
    padding: space.md,
  },
});
