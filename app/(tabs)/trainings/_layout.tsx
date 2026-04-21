import { Stack } from 'expo-router';

export default function TrainingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0f',
        },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Training erstellen',
          headerBackTitle: 'Zurück',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: 'Training',
          headerBackTitle: 'Zurück',
        }}
      />
      <Stack.Screen
        name="[id]/execute"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/add-exercises"
        options={{
          title: 'Übungen hinzufügen',
          headerBackTitle: 'Zurück',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
