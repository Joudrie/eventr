/**
 * The feed card.
 *
 * Text-forward by default. Most of what this app exists to surface — a town rec
 * department, a run club, a senior class fundraiser — will not have a good photo, and
 * a card that looks broken without one would push exactly those posts to the bottom.
 * So the title carries the card and the photo is an optional left-hand thumbnail.
 *
 * The price is the right-hand anchor at display weight, borrowed from the reference
 * mock, which had it right: a loud price is the fastest thing to scan. `Free` gets the
 * same weight as `$35`, which is the product's whole argument stated typographically.
 */

import { useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { strings } from '@/copy/strings';
import { Badge, Card, LiveDot, Text, VerifiedMark } from '@/design/primitives';
import { radius, size, space } from '@/design/tokens';
import { formatDistance, shortPrice } from '@/lib/geo';
import { setHeroSource } from '@/features/event/heroStore';
import { formatEventTime, isLive } from '@/lib/time';
import type { FeedEvent } from '@/types/event';

export type EventCardProps = {
  event: FeedEvent;
  now: Date;
  onPress?: () => void;
};

export function EventCard({ event, now, onPress }: EventCardProps) {
  const headlineRef = useRef<View>(null);

  /**
   * Measure the headline the instant it is tapped and hand the rect to the detail
   * screen, which animates its header out of that exact position. Measuring on press
   * rather than on layout means the rect reflects where the card actually is after
   * any scrolling, which is the only position that matters.
   */
  const openWithTransition = () => {
    if (!onPress) return;
    const node = headlineRef.current;
    if (!node) {
      onPress();
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      setHeroSource(event.id, { x, y, width, height });
      onPress();
    });
  };

  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const live = isLive(startsAt, endsAt, now);
  const full = event.capacityState === 'full';

  const timeLabel = formatEventTime(startsAt, endsAt, now);
  const distanceLabel = formatDistance(event.distanceM);
  const goingLabel = strings.rsvp.goingCount(event.goingCount);

  return (
    <Card
      onPress={onPress ? openWithTransition : undefined}
      muted={full}
      accessibilityLabel={`${event.title}. ${event.summary}. ${shortPrice(event)}. ${timeLabel}. ${distanceLabel} away. ${goingLabel}.${event.verified ? ' Verified organizer.' : ''}`}
      accessibilityHint="Opens the event"
    >
      <View style={styles.top}>
        {event.photoPath ? (
          <Image
            source={{ uri: event.photoPath }}
            style={styles.photo}
            accessibilityIgnoresInvertColors
          />
        ) : null}

        <View ref={headlineRef} style={styles.headline}>
          <Text variant="title" numberOfLines={2}>
            {event.title}
          </Text>
          <Text variant="body" color="textSecondary" numberOfLines={2}>
            {event.summary}
          </Text>
        </View>

        <Text variant="displayL" style={styles.price}>
          {shortPrice(event)}
        </Text>
      </View>

      <View style={styles.meta}>
        {live ? <LiveDot /> : null}
        <Text variant="meta" color={live ? 'danger' : 'textSecondary'}>
          {timeLabel}
        </Text>
        <Dot />
        <Text variant="meta" color="textSecondary">
          {distanceLabel}
        </Text>
        <Dot />
        <Text variant="meta" color="textSecondary">
          {goingLabel}
        </Text>

        {event.pendingReview ? <Badge label={strings.event.pending} tone="brand" /> : null}
        {full ? <Badge label={strings.event.full} /> : null}
        {event.capacityState === 'filling' ? (
          <Badge label={strings.event.filling} tone="accent" />
        ) : null}

        {/*
          Pinned to the right edge of the meta row so it lands in the same place on
          every card. Inline after the title, its position moved with the title's
          length and jumped again whenever the title wrapped — which made a row of
          cards look misaligned even though each one was individually correct.
        */}
        {event.verified ? (
          <View style={styles.verified}>
            <VerifiedMark organizer={event.posterName} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function Dot() {
  return (
    <Text variant="meta" color="textSecondary" accessibilityElementsHidden>
      ·
    </Text>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    gap: space.md,
  },
  photo: {
    width: size.cardThumb,
    height: size.cardThumb,
    borderRadius: radius.base,
  },
  headline: {
    flex: 1,
    gap: space.xs,
  },
  verified: {
    // Pushes to the right edge regardless of what precedes it, so the check sits at
    // one constant x down the whole feed.
    marginLeft: 'auto',
  },
  price: {
    // Never squeezed by a long title; the title wraps instead.
    flexShrink: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.md,
  },
});
