import { View } from 'react-native';
import { Screen, Text, Icon } from '@/components/ui';
import { useAuthStore } from '@/lib/store';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <Screen scroll padding="base">
      <Text variant="largeTitle" weight="bold" className="mb-1 mt-2">
        Hallo {user?.firstName ?? user?.username ?? 'Trainer'}
      </Text>
      <Text variant="body" color="muted" className="mb-6">
        Willkommen zurück.
      </Text>

      <View className="bg-card rounded-2xl p-6 items-center border border-border">
        <Icon name="construct-outline" size={40} color="muted" />
        <Text variant="headline" className="mt-3 mb-1">
          Dashboard in Arbeit
        </Text>
        <Text variant="footnote" color="muted" className="text-center">
          Statistiken und Übersichten kommen in Sub-Project 2.
        </Text>
      </View>
    </Screen>
  );
}
