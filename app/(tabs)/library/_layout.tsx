import { Platform, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const webBackButton =
  Platform.OS === 'web'
    ? () => (
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/library');
          }}
          className="px-2 py-1"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
      )
    : undefined;

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
        headerLeft: webBackButton,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Übung', headerBackTitle: 'Zurück' }}
      />
    </Stack>
  );
}
