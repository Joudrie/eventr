/**
 * The icon set. Hand-drawn paths on a 24px grid at a consistent 2px stroke, round
 * caps and joins throughout.
 *
 * Deliberately small. DESIGN.md tell #10: icons only where they replace a word, never
 * where they decorate one — so a glyph gets added here when a label genuinely cannot
 * do the job, not to brighten up a row. And per tell #1, emoji are never icons.
 */

import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../theme';
import type { TextColor } from './Text';

export type IconName =
  'check' | 'chevronDown' | 'close' | 'retry' | 'location' | 'search' | 'back' | 'filter';

export type IconProps = {
  name: IconName;
  /** Matches the type scale: 14 sits inline with body, 20 in a control, 24 standalone. */
  size?: number;
  color?: TextColor;
};

export function Icon({ name, size = 20, color = 'textPrimary' }: IconProps) {
  const theme = useTheme();
  const stroke = theme.color[color];
  const common = {
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  /**
   * Icons never carry meaning on their own — the control they sit in owns the
   * accessible label — so they are hidden from assistive tech. The props live on a
   * wrapping View rather than on Svg: react-native-svg forwards unrecognized props
   * straight to the DOM node on web, which React then warns about.
   */
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {name === 'check' && <Path d="M4 12.5 L9.5 18 L20 6" {...common} />}
        {name === 'chevronDown' && <Path d="M6 9.5 L12 15.5 L18 9.5" {...common} />}
        {name === 'close' && (
          <>
            <Path d="M6 6 L18 18" {...common} />
            <Path d="M18 6 L6 18" {...common} />
          </>
        )}
        {name === 'retry' && (
          <>
            <Path d="M20 12a8 8 0 1 1-2.6-5.9" {...common} />
            <Path d="M20 3.5 V7.5 H16" {...common} />
          </>
        )}
        {name === 'location' && (
          <>
            <Path
              d="M12 21.5c4.4-4.6 6.5-8 6.5-10.8a6.5 6.5 0 1 0-13 0c0 2.8 2.1 6.2 6.5 10.8z"
              {...common}
            />
            <Circle cx={12} cy={10.5} r={2.4} {...common} />
          </>
        )}
        {name === 'search' && (
          <>
            <Circle cx={11} cy={11} r={6.5} {...common} />
            <Path d="M16 16 L21 21" {...common} />
          </>
        )}
        {name === 'back' && (
          <>
            <Path d="M20 12 H4.5" {...common} />
            <Path d="M11 5.5 L4.5 12 L11 18.5" {...common} />
          </>
        )}
        {name === 'filter' && (
          <>
            <Path d="M3 7.5 H21" {...common} />
            <Path d="M3 16.5 H21" {...common} />
            <Circle cx={9} cy={7.5} r={2.6} {...common} fill={theme.color.surface} />
            <Circle cx={16} cy={16.5} r={2.6} {...common} fill={theme.color.surface} />
          </>
        )}
      </Svg>
    </View>
  );
}
