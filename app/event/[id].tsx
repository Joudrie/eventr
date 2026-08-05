import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { strings } from '@/copy/strings';
import { EmptyState, ErrorState, Skeleton } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { EventDetail } from '@/features/event/EventDetail';
import { clearHeroSource } from '@/features/event/heroStore';
import { usePreferences } from '@/lib/preferences';
import { useEventQuery } from '@/lib/queries/events';
import { Seo } from '@/lib/seo';
import { staticEventIds, staticEventMeta } from '@/data/static';

const CLOCK_TICK_MS = 30_000;

/**
 * Emits one HTML file per event at build time, so a shared link resolves to a real
 * page with the event's own title rather than to a 404 that the client happens to
 * recover from.
 */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return staticEventIds().map((id) => ({ id }));
}

export default function EventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { preferences } = usePreferences();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const handle = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(handle);
  }, []);

  // Resolved synchronously so it lands in the statically generated HTML — the async
  // query is still pending at that point and would contribute nothing.
  const meta = staticEventMeta(id);
  const seo = meta ? (
    <Seo title={meta.title} description={meta.description} path={`/event/${meta.id}`} />
  ) : null;

  const origin = {
    latitude: preferences.town.latitude,
    longitude: preferences.town.longitude,
  };
  const query = useEventQuery(id ?? '', origin);

  const close = () => {
    clearHeroSource();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (query.isPending) {
    return (
      <>
        {seo}
        <View
          style={{ flex: 1, backgroundColor: theme.color.page, padding: space.lg, gap: space.md }}
        >
          <Skeleton width="80%" height={26} />
          <Skeleton width="40%" height={32} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="90%" height={14} />
        </View>
      </>
    );
  }

  if (query.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.page }}>
        <ErrorState title={strings.error.loadFailed} onRetry={() => void query.refetch()} />
      </View>
    );
  }

  if (!query.data) {
    // A shared link to an event that has since been archived or removed lands here.
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.page }}>
        <EmptyState
          title="This event is no longer listed."
          detail="It may have ended, or the organizer took it down."
          actions={[{ label: 'Back to the feed', onPress: close }]}
        />
      </View>
    );
  }

  return (
    <>
      {seo}
      <EventDetail event={query.data} now={now} onClose={close} />
    </>
  );
}
