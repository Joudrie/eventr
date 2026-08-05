import { View } from 'react-native';

import { useTheme } from '../theme';
import { border } from '../tokens';

/** A hairline rule. Decorative — it always pairs with a surface change, never carries meaning alone. */
export function Divider() {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      style={{ height: border.hairline, backgroundColor: theme.color.border }}
    />
  );
}
