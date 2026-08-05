/**
 * An advertisement in the feed.
 *
 * Built to be skipped. It occupies the same footprint as an event card, uses the same
 * type and spacing, and does exactly one thing when tapped: opens a link. No expansion,
 * no autoplay, no dismissal it can refuse to honour, nothing that follows the reader
 * down the page.
 *
 * The word "Ad" does the disclosing. The blue edge is for people who can see it, and a
 * reader who cannot distinguish the edge from the gold of a promoted event still gets
 * the difference in plain language.
 */

import { Image, StyleSheet, View } from 'react-native';

import { strings } from '@/copy/strings';
import { Badge, Card, Text } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { radius, size, space } from '@/design/tokens';
import { openExternal } from '@/lib/links';
import type { Ad } from '@/data/ads';

export function AdCard({ ad }: { ad: Ad }) {
  const theme = useTheme();

  return (
    <Card
      edge="ad"
      onPress={() => openExternal(ad.url)}
      accessibilityLabel={`Advertisement. ${ad.advertiser}. ${ad.headline}. ${ad.body}`}
      accessibilityHint={`Opens ${ad.advertiser} in your browser`}
    >
      <View style={styles.top}>
        {ad.image != null ? (
          <Image source={ad.image} style={styles.mark} accessibilityIgnoresInvertColors />
        ) : null}

        <View style={styles.body}>
          <View style={styles.labels}>
            <Badge label={strings.ads.label} tone="ad" />
            {/* Saying so outright costs nothing and is the difference between a house
                ad and a house ad that looks like it is hiding something. */}
            {ad.house ? (
              <Text variant="label" color="textSecondary">
                {strings.ads.house}
              </Text>
            ) : null}
          </View>

          <Text variant="title" numberOfLines={2}>
            {ad.headline}
          </Text>
          <Text variant="body" color="textSecondary" numberOfLines={2}>
            {ad.body}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text variant="meta" color="textSecondary">
          {ad.advertiser}
        </Text>
        <Text variant="meta" style={{ color: theme.color.edgeAd }}>
          {ad.cta}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    gap: space.md,
  },
  mark: {
    width: size.cardThumb,
    height: size.cardThumb,
    borderRadius: radius.base,
  },
  body: {
    flex: 1,
    gap: space.xs,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
});
