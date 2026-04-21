import { View, Text, Pressable } from 'react-native';
import { useAuthStore } from '@/lib/store';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <View className="flex-1 bg-background p-5">
      <Text className="text-2xl font-bold text-foreground mb-4">Dashboard</Text>
      <Text className="text-base text-muted-foreground mb-6">
        Willkommen, {user?.username || 'Trainer'}!
      </Text>

      <View className="bg-card rounded-xl p-4 border border-border">
        <Text className="text-sm text-center text-muted-foreground">
          Dashboard Features kommen in Sub-Project 2
        </Text>
      </View>
    </View>
  );
}
