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
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Card({
  children,
  onPress,
  onLongPress,
  muted = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const theme = useTheme();

  const surface = [
    styles.card,
    {
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
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
