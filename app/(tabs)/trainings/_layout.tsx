import { Platform, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const webBackButton =
  Platform.OS === 'web'
    ? () => (
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/trainings');
          }}
          className="px-2 py-1"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
      )
    : undefined;

export default function TrainingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
        // Only override headerLeft on web; setting it to undefined on iOS
        // disables the default native back button.
        ...(webBackButton && { headerLeft: webBackButton }),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="new"
        options={{ title: 'Training erstellen', headerBackTitle: 'Zurück' }}
      />
      <Stack.Screen
        name="history"
        options={{ title: 'Verlauf', headerBackTitle: 'Zurück' }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{ title: 'Training', headerBackTitle: 'Zurück' }}
      />
      <Stack.Screen
        name="[id]/execute"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="completed/[id]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
