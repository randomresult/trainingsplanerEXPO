import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabBarIcon({ focused, label }: { focused: boolean; label: string }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0f',
          borderTopColor: '#1a1a24',
        },
        tabBarActiveTintColor: '#6c47ff',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="📊" />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Bibliothek',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="📚" />,
        }}
      />
      <Tabs.Screen
        name="trainings"
        options={{
          title: 'Trainings',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="🏓" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="👤" />,
        }}
      />
    </Tabs>
  );
}
