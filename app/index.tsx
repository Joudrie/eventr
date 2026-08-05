import { Redirect, useRouter } from 'expo-router';

import { FeedScreen } from '@/features/feed/FeedScreen';
import { usePreferences } from '@/lib/preferences';
import { Seo } from '@/lib/seo';

export default function Feed() {
  const router = useRouter();
  const { preferences, ready } = usePreferences();

  // Seo sits above the gates deliberately. During static rendering the storage read
  // never resolves, so anything below an early return contributes nothing to the
  // generated HTML — which is exactly how the page shipped with an empty <title>.
  const seo = (
    <Seo description="Everything happening near you. Free events first, no account needed, no tickets sold." />
  );

  // Hold the first frame until storage has answered, so someone who already picked a
  // town never sees the location gate flash past on launch.
  if (!ready) return seo;
  if (!preferences.chosen)
    return (
      <>
        {seo}
        <Redirect href="/location" />
      </>
    );

  return (
    <>
      {seo}
      <FeedScreen onOpenEvent={(event) => router.push(`/event/${event.id}`)} />
    </>
  );
}
