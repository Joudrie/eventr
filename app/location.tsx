/**
 * The location gate. One question, asked once.
 *
 * Not a signup wall and not a permission dialog. Typing a town is the default path;
 * GPS is a button you can ignore. Nothing about browsing this app should require
 * handing over anything.
 */

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Divider, Icon, Press, Text, Toast } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, radius, space, type as typeScale } from '@/design/tokens';
import { usePreferences } from '@/lib/preferences';
import { Seo } from '@/lib/seo';
import { nearestTown, searchTowns, type Town } from '@/lib/towns';

export default function LocationGate() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setTown } = usePreferences();

  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = searchTowns(query);

  const choose = (town: Town) => {
    setTown(town);
    router.replace('/');
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
        keyExtractor={(town) => `${town.name}-${town.state}`}
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
            onPress={() => choose(item)}
            feedback="select"
            scaleOnPress={false}
            accessibilityLabel={`${item.name}, ${item.state}`}
            style={styles.row}
          >
            <Text variant="title">{item.name}</Text>
            <Text variant="meta" color="textSecondary">
              {item.state}
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
