import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Press, Text } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { PostForm } from '@/features/post/PostForm';
import { useMyEvents } from '@/lib/myEvents';
import { usePreferences } from '@/lib/preferences';
import { Seo } from '@/lib/seo';

export default function PostRoute() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const { addEvent } = useMyEvents();

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.color.page, paddingTop: insets.top }]}>
      <Seo
        title="Post an event"
        description="Post a local event. Free, no account, and it stays free."
        path="/post"
      />

      <View style={styles.bar}>
        <Press
          onPress={close}
          feedback="select"
          scaleOnPress={false}
          accessibilityLabel="Close without posting"
          style={styles.back}
        >
          <Icon name="close" size={22} />
        </Press>
        <Text variant="displayL">Post an event</Text>
        <Text variant="meta" color="textSecondary">
          Free to post. Always.
        </Text>
      </View>

      <PostForm
        defaultTown={preferences.town}
        onCancel={close}
        onSubmit={(draft) => {
          addEvent(draft);
          router.replace(`/event/${draft.id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bar: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.xs,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: space.sm,
    paddingRight: space.sm,
  },
});
