/**
 * Primitive gallery — the Phase 2 gate.
 *
 * Every primitive in every state, on one screen, so the DESIGN.md Part 3 checklist can
 * be reviewed against something real rather than against intentions. Dev-only.
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/copy/strings';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  EndOfList,
  ErrorState,
  Icon,
  LiveDot,
  Sheet,
  Skeleton,
  SkeletonCard,
  Text,
  Toast,
  VerifiedMark,
} from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, space, type as typeScale } from '@/design/tokens';
import type { IconName } from '@/design/primitives';

const ICONS: readonly IconName[] = [
  'check',
  'chevronDown',
  'close',
  'retry',
  'location',
  'search',
  'back',
  'filter',
];

export default function Gallery() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [selectedChips, setSelectedChips] = useState<Record<string, boolean>>({ Free: true });

  const toggleChip = (key: string) =>
    setSelectedChips((current) => ({ ...current, [key]: !current[key] }));

  if (!__DEV__) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.color.page }]}>
        <Text variant="title">Not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.color.page }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxl * 2 },
        ]}
      >
        <Text variant="label" color="textSecondary">
          Phase 2
        </Text>
        <Text variant="displayL" style={styles.heading}>
          Primitives
        </Text>

        <Section title="Type">
          <Text variant="displayXl">Display XL {typeScale.displayXl.fontSize}</Text>
          <Text variant="displayL">Display L {typeScale.displayL.fontSize}</Text>
          <Text variant="title">Title {typeScale.title.fontSize}</Text>
          <Text variant="body">
            Body {typeScale.body.fontSize}. Descriptions, comments, and anything you actually read
            at length sit here.
          </Text>
          <Text variant="meta" color="textSecondary">
            Meta {typeScale.meta.fontSize} · 2.3 mi · 6:45 PM · 31 going
          </Text>
          <Text variant="label" color="textSecondary">
            Label {typeScale.label.fontSize}
          </Text>
        </Section>

        <Section title="Icons">
          <View style={styles.iconRow}>
            {ICONS.map((name) => (
              <View key={name} style={styles.iconCell}>
                <Icon name={name} size={24} />
                <Text variant="label" color="textSecondary">
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Buttons">
          <View style={styles.wrap}>
            <Button label="Going" variant="primary" feedback="commit" onPress={() => {}} />
            <Button label="Post an event" variant="accent" pill onPress={() => {}} />
            <Button label="Interested" variant="secondary" onPress={() => {}} />
            <Button label="Share" variant="ghost" onPress={() => {}} />
            <Button label="Report" variant="danger" onPress={() => {}} />
          </View>
          <View style={styles.wrap}>
            <Button label="Disabled" variant="primary" disabled onPress={() => {}} />
            <Button label="Loading" variant="primary" loading onPress={() => {}} />
            <Button label="With icon" variant="secondary" icon="location" onPress={() => {}} />
            <Button label="Large" variant="primary" size="large" onPress={() => {}} />
          </View>
          <Button label="Block button" variant="primary" block onPress={() => {}} />
        </Section>

        <Section title="Chips">
          <View style={styles.wrap}>
            <Chip
              label={strings.filters.radius(10)}
              opensSheet
              onPress={() => setSheetOpen(true)}
            />
            <Chip
              label={strings.filters.allCategories}
              opensSheet
              selected
              count={3}
              onPress={() => setSheetOpen(true)}
            />
            <Chip
              label="Free"
              selected={selectedChips.Free ?? false}
              onPress={() => toggleChip('Free')}
            />
            <Chip
              label="Music"
              selected={selectedChips.Music ?? false}
              onPress={() => toggleChip('Music')}
            />
            <Chip label="Disabled" disabled />
          </View>
        </Section>

        <Section title="Badges">
          <View style={styles.wrap}>
            <Badge label={strings.event.full} />
            <Badge label={strings.event.filling} tone="accent" />
            <Badge label={strings.promoted.label} tone="promoted" />
            <Badge label={strings.ads.label} tone="ad" />
            <Badge label={strings.event.cancelled} tone="danger" />
            <Badge label={strings.event.organizer} tone="brand" />
          </View>
          <View style={styles.inline}>
            <LiveDot />
            <Text variant="meta" color="textSecondary">
              {strings.feed.live}
            </Text>
            <Text variant="meta" color="textSecondary">
              ·
            </Text>
            <Text variant="title">Wakefield Parks</Text>
            <VerifiedMark organizer="Wakefield Parks" />
          </View>
        </Section>

        <Section title="Cards">
          <Card>
            <Text variant="title">Static card</Text>
            <Text variant="body" color="textSecondary">
              Flat, bordered, four pixel radius. No shadow.
            </Text>
          </Card>
          <Card onPress={() => {}} accessibilityLabel="Pressable card example">
            <Text variant="title">Pressable card</Text>
            <Text variant="body" color="textSecondary">
              Dims on press instead of scaling — a full-width card that scales reads as a wobble.
            </Text>
          </Card>
          <Card muted>
            <View style={styles.inline}>
              <Text variant="title">Muted card</Text>
              <Badge label={strings.event.full} />
            </View>
            <Text variant="body" color="textSecondary">
              How a full event looks. Still readable, still tappable, sorted down.
            </Text>
          </Card>
        </Section>

        <Section title="Loading">
          <SkeletonCard />
          <SkeletonCard withPhoto />
          <View style={styles.wrap}>
            <Skeleton width={120} height={12} />
            <Skeleton width={60} height={12} />
          </View>
        </Section>

        <Section title="Empty">
          <EmptyState
            title={strings.empty.noneNearby(5)}
            detail="Wakefield is quiet tonight. The nearest thing is a book sale in Melrose tomorrow morning."
            actions={[
              { label: strings.empty.widen(25), onPress: () => {} },
              { label: strings.empty.seeWeekend, onPress: () => {} },
            ]}
          />
        </Section>

        <Section title="Error">
          <ErrorState title={strings.error.loadFailed} onRetry={() => {}} />
        </Section>

        <Section title="End of list">
          <EndOfList label={strings.feed.endOfList} />
        </Section>

        <Section title="Divider">
          <Text variant="body">Above the rule</Text>
          <Divider />
          <Text variant="body" color="textSecondary">
            Below it. Decorative only — it always pairs with a surface change and never carries
            meaning on its own.
          </Text>
        </Section>

        <Section title="Overlays">
          <View style={styles.wrap}>
            <Button label="Open sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
            <Button label="Show toast" variant="secondary" onPress={() => setToastOpen(true)} />
          </View>
        </Section>

        <Section title="Long content">
          <Card>
            <Text variant="title">
              Beginner Genealogy Workshop: Tracing Immigrant Records in Middlesex County
            </Text>
            <Text variant="body" color="textSecondary">
              An eighty character title and a summary at the full one hundred and twenty character
              limit, so the wrapping is real rather than convenient.
            </Text>
          </Card>
        </Section>
      </ScrollView>

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter"
        footer={
          <>
            <Button label={strings.filters.clear} variant="ghost" onPress={() => {}} />
            <Button
              label={strings.filters.apply}
              variant="primary"
              block
              onPress={() => setSheetOpen(false)}
            />
          </>
        }
      >
        <Text variant="body" color="textSecondary" style={styles.sheetBody}>
          Drag this down to dismiss it, or flick it — a fast flick closes it even if you barely
          moved it.
        </Text>
        <View style={styles.wrap}>
          <Chip label="Free" selected onPress={() => {}} />
          <Chip label="Music" onPress={() => {}} />
          <Chip label="Running" onPress={() => {}} />
          <Chip label="Market" onPress={() => {}} />
        </View>
      </Sheet>

      <Toast
        message={strings.error.saveFailed}
        tone="danger"
        visible={toastOpen}
        onDismiss={() => setToastOpen(false)}
        action={{ label: strings.error.retry, onPress: () => setToastOpen(false) }}
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: theme.color.border }]}>
      <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
  },
  heading: {
    marginBottom: space.lg,
  },
  section: {
    borderTopWidth: border.hairline,
    paddingTop: space.md,
    marginTop: space.lg,
  },
  sectionTitle: {
    marginBottom: space.md,
  },
  sectionBody: {
    gap: space.md,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
  },
  iconCell: {
    alignItems: 'center',
    gap: space.xs,
    minWidth: 56,
  },
  sheetBody: {
    marginBottom: space.md,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
