/**
 * Palette comparison — the color study's evidence, not its illustration.
 *
 * Every candidate is rendered behind the **real feed**: actual seed events, actual
 * cards, actual type. A palette on a swatch grid tells you almost nothing about how it
 * behaves under forty listings, which is the only context this one will ever be seen in.
 *
 * Dev-only.
 */

import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Chip, Text } from '@/design/primitives';
import { PALETTE_CANDIDATES, type PaletteCandidate } from '@/design/palettes';
import { ThemeOverride, useTheme } from '@/design/theme';
import { border, space } from '@/design/tokens';
import type { Theme } from '@/design/tokens';
import { EventCard } from '@/features/feed/EventCard';
import { queryLocalEvents } from '@/data/local';
import { SEED_ORIGIN } from '@/data/seed/events';
import { DEFAULT_FILTERS, METERS_PER_MILE } from '@/types/event';

/** Enough cards to judge rhythm, few enough to fit several palettes on one page. */
const SAMPLE_SIZE = 4;

export default function Palettes() {
  const insets = useSafeAreaInsets();
  const outerTheme = useTheme();
  const now = useMemo(() => new Date(), []);

  const sample = useMemo(
    () =>
      queryLocalEvents(
        {
          ...DEFAULT_FILTERS,
          origin: SEED_ORIGIN,
          radiusM: 25 * METERS_PER_MILE,
          limit: SAMPLE_SIZE,
        },
        now,
      ).events,
    [now],
  );

  if (!__DEV__) {
    return (
      <View style={[styles.notFound, { backgroundColor: outerTheme.color.page }]}>
        <Text variant="title">Not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: outerTheme.color.page }}
      contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: insets.bottom }}
    >
      <View style={styles.intro}>
        <Text variant="label" color="textSecondary">
          Color study
        </Text>
        <Text variant="displayL">Candidates</Text>
        <Text variant="body" color="textSecondary">
          Each palette below is the real feed, not a mockup. Same events, same type, same spacing —
          only the tokens change.
        </Text>
      </View>

      {PALETTE_CANDIDATES.map((candidate) => (
        <CandidateBlock
          key={candidate.key}
          candidate={candidate}
          theme={candidate.light}
          events={sample}
          now={now}
        />
      ))}
    </ScrollView>
  );
}

function CandidateBlock({
  candidate,
  theme,
  events,
  now,
}: {
  candidate: PaletteCandidate;
  theme: Theme;
  events: ReturnType<typeof queryLocalEvents>['events'];
  now: Date;
}) {
  return (
    <ThemeOverride theme={theme}>
      <View style={[styles.block, { backgroundColor: theme.color.page }]}>
        <View style={styles.heading}>
          <Text variant="title">{candidate.name}</Text>
          <Text variant="meta" color="textSecondary">
            {candidate.tagline}
          </Text>
        </View>

        {/* The chrome a palette actually has to carry, not just the cards. */}
        <View style={styles.chrome}>
          <Chip label="Within 10 mi" opensSheet />
          <Chip label="Free" selected />
          <Badge label="Filling up" tone="accent" />
          <Badge label="Boosted" tone="promoted" />
        </View>

        <View style={styles.cards}>
          {events.map((event) => (
            <EventCard key={`${candidate.key}-${event.id}`} event={event} now={now} />
          ))}
        </View>
      </View>
    </ThemeOverride>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: space.lg,
    gap: space.xs,
    marginBottom: space.lg,
  },
  block: {
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    borderTopWidth: border.hairline,
    gap: space.md,
  },
  heading: {
    gap: 2,
  },
  chrome: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
  },
  cards: {
    gap: space.sm,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
