/**
 * Buttons. Flat, hard-edged, bordered — no gradients, no soft shadows, 4px radius.
 *
 * `pill` exists for exactly one control, the floating Post button. Everything else is
 * square-ish, which is what keeps the app from reading as a stack of identical rounded
 * rectangles (DESIGN.md tell #3).
 */

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { border, radius, size, space } from '../tokens';
import { Icon, type IconName } from './Icon';
import { Press, type PressFeedback } from './Press';
import { Text, type TextColor } from './Text';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'default' | 'large';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  /** Full-width block button, for sheet footers and form steps. */
  block?: boolean;
  pill?: boolean;
  feedback?: PressFeedback;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size: buttonSize = 'default',
  disabled = false,
  loading = false,
  icon,
  block = false,
  pill = false,
  feedback = 'select',
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const theme = useTheme();

  const surface: Record<
    ButtonVariant,
    { background: string; borderColor: string; text: TextColor }
  > = {
    primary: {
      background: theme.color.brand,
      borderColor: theme.color.brand,
      text: 'textOnBrand',
    },
    accent: {
      background: theme.color.accent,
      borderColor: theme.color.accent,
      text: 'textOnAccent',
    },
    secondary: {
      background: 'transparent',
      borderColor: theme.color.borderStrong,
      text: 'textPrimary',
    },
    ghost: { background: 'transparent', borderColor: 'transparent', text: 'brand' },
    danger: {
      background: 'transparent',
      borderColor: theme.color.danger,
      text: 'danger',
    },
  };

  const tone = surface[variant];
  const isBusy = loading || disabled;

  return (
    <Press
      onPress={loading ? undefined : onPress}
      disabled={isBusy}
      feedback={feedback}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isBusy }}
      style={[
        styles.base,
        buttonSize === 'large' && styles.large,
        block && styles.block,
        {
          backgroundColor: tone.background,
          borderColor: tone.borderColor,
          borderRadius: pill ? radius.pill : radius.base,
          // Disabled reads as flat and faded rather than greyed to a different hue,
          // which keeps one visual language instead of introducing a "disabled color".
          opacity: isBusy ? 0.45 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.color[tone.text]} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={18} color={tone.text} /> : null}
            <Text variant="title" color={tone.text}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.minTapTarget,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderWidth: border.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  large: {
    minHeight: size.minTapTarget + space.md,
    paddingHorizontal: space.xl,
  },
  block: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
