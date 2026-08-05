/**
 * Filter chips — the Facebook Marketplace pattern. A horizontal row of controls that
 * either toggle directly or open a sheet.
 *
 * Font weight is identical in both states and only the fill changes. Bolding on select
 * would reflow the row and make neighbouring chips jump, which INTERACTIONS.md §4 calls
 * out; matching the weight avoids the problem rather than compensating for it.
 */

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { border, radius, size, space } from '../tokens';
import { Icon } from './Icon';
import { Press } from './Press';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  onPress?: () => void;
  /** Filled state. For sheet-opening chips this means "not the default value". */
  selected?: boolean;
  /** Shown after the label, e.g. the number of categories currently picked. */
  count?: number;
  /** Renders a chevron, marking this as a chip that opens a sheet rather than toggles. */
  opensSheet?: boolean;
  /** Renders a close mark, for chips that represent something you can take off. */
  removable?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function Chip({
  label,
  onPress,
  selected = false,
  count,
  opensSheet = false,
  removable = false,
  disabled = false,
  accessibilityHint,
}: ChipProps) {
  const theme = useTheme();
  const textColor = selected ? 'textOnBrand' : 'textPrimary';

  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      feedback="select"
      accessibilityRole={opensSheet ? 'button' : 'checkbox'}
      accessibilityLabel={count === undefined ? label : `${label}, ${count} selected`}
      accessibilityHint={accessibilityHint}
      accessibilityState={opensSheet ? { selected } : { checked: selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.color.brand : theme.color.surface,
          borderColor: selected ? theme.color.brand : theme.color.borderStrong,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <Text variant="meta" color={textColor}>
          {label}
        </Text>
        {count !== undefined && count > 0 ? (
          <View
            style={[
              styles.count,
              {
                backgroundColor: selected ? theme.color.textOnBrand : theme.color.brand,
              },
            ]}
          >
            <Text variant="label" color={selected ? 'brand' : 'textOnBrand'}>
              {String(count)}
            </Text>
          </View>
        ) : null}
        {opensSheet ? <Icon name="chevronDown" size={14} color={textColor} /> : null}
        {removable ? <Icon name="close" size={13} color={textColor} /> : null}
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: size.minTapTarget - space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: border.hairline,
    borderRadius: radius.base,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  count: {
    minWidth: space.lg,
    paddingHorizontal: space.xs,
    paddingVertical: 2,
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
