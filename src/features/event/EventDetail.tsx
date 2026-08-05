/**
 * Event detail.
 *
 * The header (title + price) travels from wherever the card was sitting, while the
 * rest crossfades in behind it. That continuity is the single highest-value animation
 * in the app — it answers "where did this come from" without the user having to think.
 *
 * Dismissal is a left-edge drag that the transition follows in reverse, and it can be
 * abandoned halfway. A back transition that must run to completion is the clearest
 * sign something is not really native (INTERACTIONS.md §3).
 */

import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/copy/strings';
import { spring, timing } from '@/design/motion';
import {
  Badge,
  Button,
  Divider,
  Icon,
  LiveDot,
  Press,
  Text,
  VerifiedMark,
} from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, radius, space } from '@/design/tokens';
import { spotsLeft } from '@/lib/capacity';
import { CapacityBadge } from '@/features/feed/EventCard';
import { formatDistance, shortPrice } from '@/lib/geo';
import {
  addToCalendar,
  callPhone,
  emailContact,
  openDirections,
  openExternal,
  shareEvent,
} from '@/lib/links';
import { formatEventRange, formatEventTime, isLive } from '@/lib/time';
import type { FeedEvent } from '@/types/event';
import { RsvpButtons } from '@/features/rsvp/RsvpButtons';
import { takeHeroSource, type HeroRect } from './heroStore';

/** Card title is 18px, detail title is 24px — the header enters at that ratio. */
const HERO_ENTRY_SCALE = 18 / 24;
/** Horizontal drag past this fraction of the screen dismisses on release. */
const DISMISS_FRACTION = 0.3;
/** Or this rightward velocity, regardless of distance. */
const DISMISS_VELOCITY = 700;
/** Only drags starting within this many px of the left edge begin a dismissal. */
const EDGE_WIDTH = 40;

export type EventDetailProps = {
  event: FeedEvent;
  now: Date;
  onClose: () => void;
};

export function EventDetail({ event, now, onClose }: EventDetailProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const [source] = useState<HeroRect | null>(() => takeHeroSource(event.id));

  /** 0 = sitting on the card, 1 = fully open. Drives every part of the transition. */
  const openness = useSharedValue(source && !reducedMotion ? 0 : 1);
  /** Rightward drag distance during an edge dismissal. */
  const dragX = useSharedValue(0);
  /**
   * Where the finger actually went down. `absoluteX - translationX` looks like the
   * same thing but isn't: translation is measured from the moment the gesture
   * *activates*, which is already `activeOffsetX` pixels into the swipe, so deriving
   * the origin that way drifts and the edge check rejects real edge swipes.
   */
  const gestureStartX = useSharedValue(0);
  const [heroRect, setHeroRect] = useState<HeroRect | null>(null);

  // Plain functions, not useCallback: a shared value is already a stable reference,
  // and listing one as a hook dependency then mutating it is exactly what the React
  // Compiler's immutability rule (correctly) rejects.
  const startEntry = () => {
    if (!source || reducedMotion) return;
    openness.value = withSpring(1, spring());
  };

  const close = () => {
    if (!source || reducedMotion) {
      onClose();
      return;
    }
    openness.value = withTiming(0, timing('settle'), (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const dismiss = Gesture.Pan()
    .activeOffsetX(12)
    .failOffsetY([-16, 16])
    // onBegin fires at touch-down, before activation — the only reliable origin.
    .onBegin((gestureEvent) => {
      gestureStartX.value = gestureEvent.x;
    })
    .onUpdate((gestureEvent) => {
      // Edge-only, so the gesture never fights the vertical scroll or a link tap.
      if (gestureStartX.value > EDGE_WIDTH) return;
      dragX.value = Math.max(0, gestureEvent.translationX);
    })
    .onEnd((gestureEvent) => {
      if (gestureStartX.value > EDGE_WIDTH) return;
      const farEnough = dragX.value > screenWidth * DISMISS_FRACTION;
      const fastEnough = gestureEvent.velocityX > DISMISS_VELOCITY;

      if (farEnough || fastEnough) {
        dragX.value = withTiming(screenWidth, timing('settle'), (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        // Abandoned halfway — springs back rather than committing.
        dragX.value = withSpring(0, spring());
      }
    });

  /** The screen itself slides and dims as you drag it away. */
  const screenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragX.value, [0, screenWidth], [1, 0], 'clamp') * openness.value,
  }));

  /**
   * The header travels from the card's measured rect. Scaled from the top-left so the
   * text grows out of its old size rather than ballooning from its centre.
   */
  const heroStyle = useAnimatedStyle(() => {
    if (!source || !heroRect) return {};
    const dx = source.x - heroRect.x;
    const dy = source.y - heroRect.y;
    const progress = openness.value;

    return {
      transform: [
        { translateX: interpolate(progress, [0, 1], [dx, 0]) },
        { translateY: interpolate(progress, [0, 1], [dy, 0]) },
        { scale: interpolate(progress, [0, 1], [HERO_ENTRY_SCALE, 1]) },
      ],
    };
  });

  /** Everything that is not the header crossfades, slightly behind the header's travel. */
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openness.value, [0.35, 1], [0, 1], 'clamp'),
  }));

  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const live = isLive(startsAt, endsAt, now);

  return (
    <GestureDetector gesture={dismiss}>
      <Animated.View style={[styles.root, screenStyle, { backgroundColor: theme.color.page }]}>
        <Animated.View
          style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: theme.color.page }]}
        />

        <View style={[styles.bar, { paddingTop: insets.top + space.sm }]}>
          <Press
            onPress={close}
            feedback="select"
            scaleOnPress={false}
            accessibilityLabel="Back to the feed"
            style={styles.back}
          >
            <Icon name="back" size={22} />
          </Press>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            onLayout={(layoutEvent) => {
              const { x, y, width, height } = layoutEvent.nativeEvent.layout;
              setHeroRect({ x, y: y + insets.top, width, height });
              startEntry();
            }}
            style={[styles.hero, heroStyle]}
          >
            <View style={styles.titleRow}>
              <Text variant="displayL" style={styles.title}>
                {event.title}
              </Text>
              {event.verified ? (
                <VerifiedMark organizer={event.posterName} placement="inline" />
              ) : null}
            </View>
            <Text variant="displayXl">{shortPrice(event)}</Text>
          </Animated.View>

          <Animated.View style={bodyStyle}>
            <View style={styles.metaRow}>
              {live ? <LiveDot /> : null}
              <Text variant="meta" color={live ? 'danger' : 'textSecondary'}>
                {formatEventTime(startsAt, endsAt, now)}
              </Text>
              <Text variant="meta" color="textSecondary">
                ·
              </Text>
              <Text variant="meta" color="textSecondary">
                {formatDistance(event.distanceM)}
              </Text>
              <CapacityBadge state={event.capacityState} />
            </View>

            {/*
              The card has room for a label; this has room for the arithmetic behind it.
              Anyone deciding whether to drive over deserves the actual numbers rather
              than an adjective.
            */}
            {event.capacity != null ? (
              <Text variant="meta" color="textSecondary">
                {strings.event.capacityOf(event.capacity)}
                {' · '}
                {event.capacityState === 'over'
                  ? strings.rsvp.goingCount(event.goingCount)
                  : strings.event.spotsLeft(spotsLeft(event.capacity, event.goingCount) ?? 0)}
              </Text>
            ) : null}

            {event.pendingReview ? (
              <View style={[styles.pending, { borderColor: theme.color.brand }]}>
                <Badge label={strings.event.pending} tone="brand" />
                <Text variant="meta" color="textSecondary">
                  {strings.event.pendingNotice}
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <RsvpButtons event={event} />
            </View>

            <Divider />

            <Section title="When">
              <Text variant="body">{formatEventRange(startsAt, endsAt)}</Text>
            </Section>

            <Section title="Where">
              <Press
                onPress={() => openDirections(event)}
                feedback="select"
                scaleOnPress={false}
                accessibilityLabel={`Directions to ${event.venueName ?? event.town}`}
                style={styles.linkRow}
              >
                <View style={styles.linkText}>
                  {event.venueName ? <Text variant="body">{event.venueName}</Text> : null}
                  <Text variant="meta" color="textSecondary">
                    {[event.addressLine, event.town].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <Text variant="meta" color="brand">
                  {strings.event.directions}
                </Text>
              </Press>
            </Section>

            {/* Price tiers in full — the card only had room for the floor. */}
            {event.priceLabel ? (
              <Section title="Price">
                <Text variant="body">{event.priceLabel}</Text>
              </Section>
            ) : null}

            {event.tags.length > 0 ? (
              <Section title={strings.event.tags}>
                <View style={styles.tags}>
                  {event.tags.map((tag) => (
                    <Badge key={tag} label={tag} />
                  ))}
                </View>
              </Section>
            ) : null}

            {event.description ? (
              <Section title="Details">
                <Text variant="body">{event.description}</Text>
              </Section>
            ) : null}

            <Section title="Posted by">
              <View style={styles.titleRow}>
                <Text variant="body">{event.posterName}</Text>
                {event.verified ? (
                  <VerifiedMark organizer={event.posterName} placement="inline" />
                ) : null}
              </View>
            </Section>

            {event.contactEmail || event.contactUrl || event.contactPhone ? (
              <Section title="Contact">
                <View style={styles.contactRow}>
                  {event.contactPhone ? (
                    <Button
                      label={event.contactPhone}
                      variant="secondary"
                      onPress={() => callPhone(event.contactPhone!)}
                    />
                  ) : null}
                  {event.contactEmail ? (
                    <Button
                      label="Email"
                      variant="secondary"
                      onPress={() => emailContact(event.contactEmail!, event.title)}
                    />
                  ) : null}
                  {event.contactUrl ? (
                    <Button
                      label="Website"
                      variant="secondary"
                      onPress={() => openExternal(event.contactUrl!)}
                    />
                  ) : null}
                </View>
              </Section>
            ) : null}

            {/* We never sell tickets. This leaves the app, every time. */}
            {event.ticketUrl ? (
              <View style={styles.tickets}>
                <Button
                  label={strings.event.getTickets}
                  variant="accent"
                  block
                  onPress={() => openExternal(event.ticketUrl!)}
                  accessibilityHint="Opens the organizer's ticket page"
                />
              </View>
            ) : null}

            <Divider />

            <View style={styles.footerActions}>
              <Button
                label={strings.event.addToCalendar}
                variant="secondary"
                onPress={() => addToCalendar(event, now)}
              />
              <Button
                label={strings.event.share}
                variant="secondary"
                onPress={() => void shareEvent(event)}
              />
              <Button label={strings.event.report} variant="danger" onPress={() => {}} />
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bar: {
    paddingHorizontal: space.sm,
    paddingBottom: space.xs,
  },
  back: {
    padding: space.sm,
    alignSelf: 'flex-start',
  },
  content: {
    paddingHorizontal: space.lg,
  },
  hero: {
    // Grows out of the card's title size rather than ballooning from its centre.
    transformOrigin: Platform.OS === 'web' ? 'left top' : undefined,
    gap: space.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.xs,
  },
  title: {
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.md,
  },
  actions: {
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  pending: {
    borderWidth: border.hairline,
    borderRadius: radius.base,
    padding: space.md,
    marginTop: space.md,
    gap: space.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  section: {
    paddingVertical: space.md,
    gap: space.xs,
  },
  sectionTitle: {
    marginBottom: space.xs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.xs,
  },
  linkText: {
    flexShrink: 1,
    gap: 2,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  tickets: {
    marginTop: space.md,
    marginBottom: space.lg,
  },
  footerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.lg,
  },
});
