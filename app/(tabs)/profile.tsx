import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-background p-5">
      <Text className="text-2xl font-bold text-foreground mb-4">Profil</Text>

      <View className="bg-card rounded-xl p-4 border border-border mb-4">
        <View className="items-center mb-4">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-primary">
              {(user?.firstName?.[0] || user?.username?.[0] || 'T').toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-semibold text-foreground mb-1">
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
              user?.username ||
              'Trainer'}
          </Text>
          <Text className="text-sm text-muted-foreground">{user?.email || ''}</Text>
        </View>

        {user?.clubs && user.clubs.length > 0 && (
          <View className="border-t border-border pt-3">
            <Text className="text-xs text-muted-foreground mb-1">
              {user.clubs.length === 1 ? 'Verein' : 'Vereine'}
            </Text>
            <Text className="text-sm text-foreground font-semibold">
              {user.clubs.map((c) => c.Name).join(', ')}
            </Text>
          </View>
        )}
      </View>

      <View className="bg-card rounded-xl p-4 border border-border mb-4">
        <Text className="text-sm text-center text-muted-foreground">
          Weitere Profil-Features kommen in Sub-Project 2
        </Text>
      </View>

      <Pressable
        onPress={handleLogout}
        className="border border-destructive rounded-xl p-4"
      >
        <Text className="text-center text-sm font-semibold text-destructive">
          Abmelden
        </Text>
      </Pressable>
    </View>
  );
}
