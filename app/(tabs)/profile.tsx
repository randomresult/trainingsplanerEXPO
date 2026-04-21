import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Button, Card, Avatar } from '@/components/ui';
import { useAuthStore } from '@/lib/store';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const initials =
    user?.firstName && user?.lastName
      ? (user.firstName[0] ?? '') + (user.lastName[0] ?? '')
      : user?.username?.slice(0, 2) ?? 'T';

  return (
    <Screen scroll padding="base">
      <Text variant="largeTitle" weight="bold" className="mb-6 mt-2">
        Profil
      </Text>

      <Card className="items-center mb-4">
        <Avatar initials={initials} size="xl" className="mb-3" />
        <Text variant="title3" weight="semibold" className="mb-1">
          {[user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
            user?.username ||
            'Trainer'}
        </Text>
        <Text variant="footnote" color="muted">
          {user?.email ?? ''}
        </Text>

        {user?.clubs && user.clubs.length > 0 && (
          <View className="border-t border-border pt-3 mt-4 w-full">
            <Text variant="caption1" color="muted" className="mb-1">
              {user.clubs.length === 1 ? 'Verein' : 'Vereine'}
            </Text>
            <Text variant="subhead" weight="semibold">
              {user.clubs.map((c) => c.Name).join(', ')}
            </Text>
          </View>
        )}
      </Card>

      <Card className="mb-4">
        <Text variant="footnote" color="muted" className="text-center">
          Weitere Profil-Features kommen in Sub-Project 2
        </Text>
      </Card>

      <Button variant="destructive" size="lg" onPress={handleLogout}>
        Abmelden
      </Button>
    </Screen>
  );
}
