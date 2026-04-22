import { Stack } from 'expo-router';

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
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
