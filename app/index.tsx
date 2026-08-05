import { Redirect } from 'expo-router';

import { FeedScreen } from '@/features/feed/FeedScreen';
import { usePreferences } from '@/lib/preferences';

export default function Feed() {
  const { preferences, ready } = usePreferences();

  // Hold the first frame until storage has answered, so someone who already picked a
  // town never sees the location gate flash past on launch.
  if (!ready) return null;
  if (!preferences.chosen) return <Redirect href="/location" />;

  return <FeedScreen />;
}
