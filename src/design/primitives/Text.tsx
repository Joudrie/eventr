/**
 * The only text component in the app. Nothing else sets fontSize, fontWeight,
 * lineHeight, or a text color — that guarantees the type scale in DESIGN.md is the
 * scale actually shipped, and makes the voice and contrast audits a single-file review.
 */

import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '../theme';
import { labelTransform, type as typeScale, type TypeVariant } from '../tokens';

/** Text-bearing roles only. `page`/`surface`/`border` are surfaces and excluded by design. */
export type TextColor =
  'textPrimary' | 'textSecondary' | 'textOnBrand' | 'textOnAccent' | 'brand' | 'danger';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: TextColor;
};

export function Text({ variant = 'body', color = 'textPrimary', style, ...rest }: TextProps) {
  const theme = useTheme();
  const scale = typeScale[variant] as TextStyle;

  return (
    <RNText
      {...rest}
      style={[
        scale,
        // The label variant is always uppercase. Leaving that to call sites means the
        // day someone forgets, the type scale quietly has two looks.
        variant === 'label' && { textTransform: labelTransform },
        { color: theme.color[color] },
        style,
      ]}
    />
  );
}
