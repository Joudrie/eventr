/**
 * The location gate. One question, asked once.
 *
 * Not a signup wall and not a permission dialog. Typing a town is the default path;
 * GPS is a button you can ignore. Nothing about browsing this app should require
 * handing over anything.
 */

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Divider, Icon, Press, Text, Toast } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, radius, space, type as typeScale } from '@/design/tokens';
import { usePreferences } from '@/lib/preferences';
import { Seo } from '@/lib/seo';
import { nearestTown, searchTowns, type Town } from '@/lib/towns';
import { rankTowns, type RankedTown } from '@/lib/townRanking';
import { eventCountsByTown } from '@/data/local';
import { strings } from '@/copy/strings';

export default function LocationGate() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferences, setTown } = usePreferences();

  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * With no query, the list is ordered by where is actually worth going: a mix of how
   * close a town is and how much is on there, with a bonus for immediate neighbours.
   * Alphabetical would be arbitrary and pure distance would bury Boston under a dozen
   * towns that have nothing happening tonight.
   *
   * Typing switches to name matching, because at that point you know what you want.
   */
  const results = useMemo((): readonly RankedTown[] => {
    const matches = searchTowns(query);
    const counts = eventCountsByTown();
    const origin = preferences.town;
    const ranked = rankTowns(matches, origin, (town) => counts.get(town.name) ?? 0);

    // A typed query already expresses an intent; reordering it by liveliness would
    // move the town somebody is literally spelling out. Keep the name-match order and
    // only borrow the counts.
    if (query.trim().length === 0) return ranked;
    const byName = new Map(ranked.map((entry) => [entry.town.name, entry]));
    return matches.flatMap((town) => {
      const entry = byName.get(town.name);
      return entry ? [entry] : [];
    });
  }, [query, preferences.town]);

  const choose = (town: Town) => {
    setTown(town);
    /**
     * Go back to the feed that is already on the stack rather than replacing this
     * screen with a second copy of it. Reached from the header, `replace('/')` left
     * the original feed mounted and hidden underneath — invisible to the user, but a
     * whole extra screen holding its own query and scroll state.
     *
     * On first launch there is nothing to go back to, so replace is correct there.
     */
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const locateMe = async () => {
    setLocating(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Location is off. Pick your town instead.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      choose(
        nearestTown({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      );
    } catch {
      setError("Couldn't get your location. Pick your town instead.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.color.page, paddingTop: insets.top + space.xl },
      ]}
    >
      <Seo
        title="Pick your town"
        description="Choose a town to see what's happening nearby."
        path="/location"
      />
      <View style={styles.intro}>
        <Text variant="displayL">Where are you?</Text>
        <Text variant="body" color="textSecondary">
          Used to sort the feed by distance. Stored on this device, and you can change it any time.
        </Text>
      </View>

      <View
        style={[
          styles.field,
          { borderColor: theme.color.borderStrong, backgroundColor: theme.color.surface },
        ]}
      >
        <Icon name="search" size={18} color="textSecondary" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Type a town"
          placeholderTextColor={theme.color.textSecondary}
          autoCorrect={false}
          autoCapitalize="words"
          accessibilityLabel="Search for your town"
          style={[styles.input, { color: theme.color.textPrimary }]}
        />
      </View>

      <View style={styles.gps}>
        <Button
          label={locating ? 'Locating' : 'Use my location'}
          variant="secondary"
          icon="location"
          loading={locating}
          onPress={() => void locateMe()}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => `${item.town.name}-${item.town.state}`}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={Divider}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}
        ListEmptyComponent={
          <View style={styles.noMatch}>
            <Text variant="body" color="textSecondary">
              No town called “{query.trim()}” yet. Eventr covers Greater Boston to start.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Press
            onPress={() => choose(item.town)}
            feedback="select"
            scaleOnPress={false}
            accessibilityLabel={`${item.town.name}, ${item.town.state}. ${strings.location.eventCount(item.eventCount)}`}
            style={styles.row}
          >
            <Text variant="title">{item.town.name}</Text>
            {/* The number is why the town sits where it does in the list. Showing the
                ordering's own reasoning beats making people infer it. */}
            <Text variant="meta" color="textSecondary">
              {strings.location.eventCount(item.eventCount)}
            </Text>
          </Press>
        )}
      />

      <Toast
        message={error ?? ''}
        tone="danger"
        visible={error !== null}
        onDismiss={() => setError(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space.lg,
  },
  intro: {
    gap: space.sm,
    marginBottom: space.lg,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderWidth: border.hairline,
    borderRadius: radius.base,
  },
  input: {
    flex: 1,
    paddingVertical: space.md,
    fontSize: typeScale.body.fontSize,
    lineHeight: typeScale.body.lineHeight,
  },
  gps: {
    marginTop: space.md,
    marginBottom: space.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: space.md,
  },
  noMatch: {
    paddingVertical: space.xl,
  },
});
