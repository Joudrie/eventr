import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design/theme';
import { PreferencesProvider } from '@/lib/preferences';
import { MyEventsProvider } from '@/lib/myEvents';
import { RsvpProvider } from '@/lib/rsvp';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The feed must work in a parking garage with no signal. Cached pages stay
            // usable for an hour rather than being discarded the moment they go stale.
            gcTime: 60 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <PreferencesProvider>
              <MyEventsProvider>
                <RsvpProvider>
                  <StatusBar style="auto" />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="location" />
                    {/*
                  The detail screen animates itself from the card's measured position
                  and owns its own swipe-to-dismiss, so the stack must not layer a
                  second animation on top of it.
                */}
                    <Stack.Screen
                      name="event/[id]"
                      options={{ animation: 'none', gestureEnabled: false }}
                    />
                  </Stack>
                </RsvpProvider>
              </MyEventsProvider>
            </PreferencesProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
