/**
 * The review queue.
 *
 * The product promises that a person reads every post before it goes out to a town.
 * That promise was, until now, entirely unbacked: posts went into a `pending` state and
 * there was no surface anywhere that could take them out of it. A promise nobody can
 * keep is worse than no promise.
 *
 * **What this can honestly do today.** There is no server, so this reads the same local
 * store the feed does, which holds only posts made on this device. It is a working
 * review surface over the data that exists — approve and reject really do change what
 * the feed shows — and it is not yet a way to review other people's posts, because
 * nothing is collecting them.
 *
 * **It is not access control.** The route is unlisted, and that is all. Anyone who types
 * the path reaches it. That is acceptable while the only thing behind it is your own
 * posts on your own phone, and it stops being acceptable the moment there is a server:
 * at that point the decisions have to be written by a role-checked endpoint, and this
 * screen becomes its client. The banner at the top says so rather than leaving the next
 * person to discover it.
 */

import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/copy/strings';
import { Badge, Button, Divider, Text } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, radius, space } from '@/design/tokens';
import { useMyEvents, type DraftEvent, type ReviewStatus } from '@/lib/myEvents';
import { formatEventTime } from '@/lib/time';
import { CATEGORY_LABELS } from '@/types/event';

const FILTERS: readonly { key: ReviewStatus; label: string }[] = [
  { key: 'pending', label: 'Waiting' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function Moderate() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { myEvents, ready, setReview } = useMyEvents();
  const [tab, setTab] = useState<ReviewStatus>('pending');
  const now = useMemo(() => new Date(), []);

  const shown = myEvents.filter((event) => event.review === tab);
  const waiting = myEvents.filter((event) => event.review === 'pending').length;

  return (
    <View style={[styles.screen, { backgroundColor: theme.color.page, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="label" color="textSecondary">
          {strings.moderate.eyebrow}
        </Text>
        <Text variant="displayL">{strings.moderate.title}</Text>
        <Text variant="meta" color="textSecondary">
          {strings.moderate.waiting(waiting)}
        </Text>
      </View>

      <View style={[styles.caveat, { borderColor: theme.color.borderStrong }]}>
        <Text variant="meta" color="textSecondary">
          {strings.moderate.localOnly}
        </Text>
      </View>

      <View style={styles.tabs}>
        {FILTERS.map((filter) => (
          <Button
            key={filter.key}
            label={filter.label}
            variant={tab === filter.key ? 'primary' : 'ghost'}
            onPress={() => setTab(filter.key)}
          />
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Divider}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body" color="textSecondary">
              {ready ? strings.moderate.empty[tab] : strings.moderate.loading}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <QueueRow
            draft={item}
            now={now}
            onApprove={() => setReview(item.id, 'approved')}
            onReject={() => setReview(item.id, 'rejected', strings.moderate.defaultReason)}
            onReopen={() => setReview(item.id, 'pending')}
          />
        )}
      />
    </View>
  );
}

function QueueRow({
  draft,
  now,
  onApprove,
  onReject,
  onReopen,
}: {
  draft: DraftEvent;
  now: Date;
  onApprove: () => void;
  onReject: () => void;
  onReopen: () => void;
}) {
  const starts = new Date(draft.startsAt);

  return (
    <View style={styles.row}>
      <Text variant="title">{draft.title}</Text>
      <Text variant="body" color="textSecondary">
        {draft.summary}
      </Text>

      {/*
        Everything a decision actually turns on, in one place. Making a reviewer open
        each post to find out where and when it is turns a minute of work into ten.
      */}
      <View style={styles.facts}>
        <Text variant="meta" color="textSecondary">
          {CATEGORY_LABELS[draft.category]}
        </Text>
        <Text variant="meta" color="textSecondary">
          {formatEventTime(starts, new Date(draft.endsAt), now)}
        </Text>
        <Text variant="meta" color="textSecondary">
          {draft.venueName.length > 0 ? `${draft.venueName}, ${draft.town}` : draft.town}
        </Text>
        <Text variant="meta" color="textSecondary">
          {draft.priceLabel}
        </Text>
      </View>

      {draft.tags.length > 0 ? (
        <View style={styles.tags}>
          {draft.tags.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </View>
      ) : null}

      {draft.boost ? <Badge label={strings.moderate.boostRequested} tone="promoted" /> : null}

      {draft.reviewNote ? (
        <Text variant="meta" color="danger">
          {draft.reviewNote}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {draft.review === 'pending' ? (
          <>
            <Button label={strings.moderate.approve} onPress={onApprove} />
            <Button label={strings.moderate.reject} variant="danger" onPress={onReject} />
          </>
        ) : (
          <Button label={strings.moderate.reopen} variant="secondary" onPress={onReopen} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.xs,
  },
  caveat: {
    marginHorizontal: space.lg,
    marginTop: space.md,
    padding: space.sm,
    borderWidth: border.hairline,
    borderRadius: radius.base,
  },
  tabs: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.lg,
  },
  row: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.xs,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },
  empty: {
    padding: space.lg,
  },
});
