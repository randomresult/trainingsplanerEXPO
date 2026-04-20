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
          title: 'Trainings',
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
        name="[id]"
        options={{
          title: 'Training',
          headerBackTitle: 'Zurück',
        }}
      />
    </Stack>
  );
}
