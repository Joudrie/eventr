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

const CLOCK_TICK_MS = 30_000;

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
      <View
        style={{ flex: 1, backgroundColor: theme.color.page, padding: space.lg, gap: space.md }}
      >
        <Skeleton width="80%" height={26} />
        <Skeleton width="40%" height={32} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="90%" height={14} />
      </View>
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

  return <EventDetail event={query.data} now={now} onClose={close} />;
}
