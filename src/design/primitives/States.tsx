/**
 * Empty and error states.
 *
 * Both are actionable and factual. DESIGN.md tell #5 and #7: no illustrations, no
 * emoji, no "exciting things are coming". An empty state names the constraint that
 * produced it and offers the control that relaxes it — "Nothing within 5 miles today"
 * with a button to widen the radius, not "No events found".
 */

import { StyleSheet, View } from 'react-native';

import { space } from '../tokens';
import { Button } from './Button';
import { Text } from './Text';

export type StateAction = {
  label: string;
  onPress: () => void;
};

export type EmptyStateProps = {
  /** State the fact, including the number and the place. Never a slogan. */
  title: string;
  detail?: string;
  actions?: readonly StateAction[];
};

export function EmptyState({ title, detail, actions = [] }: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <Text variant="title">{title}</Text>
      {detail ? (
        <Text variant="body" color="textSecondary">
          {detail}
        </Text>
      ) : null}
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Button
              key={action.label}
              label={action.label}
              variant="secondary"
              onPress={action.onPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export type ErrorStateProps = {
  title: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({ title, onRetry, retryLabel = 'Retry' }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text variant="title" color="danger">
        {title}
      </Text>
      {onRetry ? (
        <View style={styles.actions}>
          <Button label={retryLabel} variant="secondary" icon="retry" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

/** End of a paginated list. Present so the feed never just stops with no explanation. */
export function EndOfList({ label }: { label: string }) {
  return (
    <View style={styles.end}>
      <Text variant="meta" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  end: {
    paddingVertical: space.xl,
    alignItems: 'center',
  },
});
