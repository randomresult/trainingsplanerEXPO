import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/lib/store';
import { useAppFonts } from '@/lib/fonts';
import { Toaster } from '@/components/ui';
import { COLORS } from '@/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isRestored, restoreSession } = useAuthStore();
  const { loaded: fontsLoaded } = useAppFonts();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isRestored, segments]);

  if (!isRestored || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="exercise-picker"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="training-new"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="player-picker"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="exercise-detail/[id]"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          title: 'Übung',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <RootLayoutNav />
          <Toaster
            position="top-center"
            offset={120}
            duration={3000}
            toastOptions={{
              style: {
                backgroundColor: 'hsl(0, 0%, 13%)',
                borderWidth: 1,
                borderColor: 'hsl(0, 0%, 15%)'
              },
            }}
          />
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
