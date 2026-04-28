import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/lib/store';
import { useAppFonts } from '@/lib/fonts';
import { Toaster } from '@/components/ui';
import { COLORS } from '@/lib/theme';

// Matched to tailwind's `bg-background = hsl(0, 0%, 4%)` so headers, screen
// content, and the navigation container all share one dark colour. Mismatches
// here cause a silver/white flicker at the top edge during push transitions.
const DARK_BG = '#0a0a0a';

// Override DarkTheme background so the navigator container matches the app.
const APP_NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: DARK_BG,
    card: DARK_BG,
  },
};

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
        name="library-pick"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="series-detail/[id]"
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
        <ThemeProvider value={APP_NAV_THEME}>
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
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
