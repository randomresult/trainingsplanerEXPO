import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, Text, Button, Icon, Avatar } from '@/components/ui';
import { useTrainingDetail } from '@/lib/queries/useTrainings';
import { COLORS } from '@/lib/theme';

function formatDuration(seconds: number | undefined | null): string {
  if (!seconds) return '–';
  const mins = Math.round(seconds / 60);
  return `${mins} Min`;
}

export default function CompletedTrainingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: training, isLoading } = useTrainingDetail(id);

  if (isLoading || !training) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  const playersToShow = training.players?.slice(0, 6) ?? [];
  const extra = (training.players?.length ?? 0) - playersToShow.length;

  return (
    <Screen padding="base">
      <View className="flex-1 items-center justify-center">
        <View className="w-24 h-24 rounded-full bg-success/20 items-center justify-center mb-6">
          <Icon name="checkmark-circle" size={64} color="success" />
        </View>

        <Text variant="largeTitle" weight="bold" className="mb-2 text-center">
          Training beendet
        </Text>
        <Text variant="title3" color="muted" className="mb-8 text-center">
          {training.Name}
        </Text>

        <View className="flex-row justify-around w-full mb-8">
          <View className="items-center flex-1">
            <Icon name="time-outline" size={18} color="muted" />
            <Text variant="body" weight="bold" className="mt-1">
              {formatDuration(training.actualDuration)}
            </Text>
            <Text variant="caption1" color="muted">
              Dauer
            </Text>
          </View>
          <View className="items-center flex-1">
            <Icon name="people-outline" size={18} color="muted" />
            <Text variant="body" weight="bold" className="mt-1">
              {training.players?.length ?? 0}
            </Text>
            <Text variant="caption1" color="muted">
              Teilnehmer
            </Text>
          </View>
          <View className="items-center flex-1">
            <Icon name="fitness-outline" size={18} color="muted" />
            <Text variant="body" weight="bold" className="mt-1">
              {training.exercises?.length ?? 0}
            </Text>
            <Text variant="caption1" color="muted">
              Übungen
            </Text>
          </View>
          <View className="items-center flex-1">
            <Icon name="star-outline" size={18} color="muted" />
            <Text variant="body" weight="bold" className="mt-1">
              {(training.exercises?.length ?? 0) * 10}
            </Text>
            <Text variant="caption1" color="muted">
              Punkte
            </Text>
          </View>
        </View>

        {playersToShow.length > 0 && (
          <View className="flex-row items-center mb-10">
            {playersToShow.map((p, idx) => (
              <View
                key={p.documentId}
                className={idx > 0 ? '-ml-2' : ''}
                style={{ zIndex: playersToShow.length - idx }}
              >
                <Avatar
                  initials={(p.firstname?.[0] ?? '') + (p.Name?.[0] ?? '')}
                  size="md"
                  className="border-2 border-background"
                />
              </View>
            ))}
            {extra > 0 && (
              <View className="-ml-2 w-12 h-12 rounded-full bg-muted items-center justify-center border-2 border-background">
                <Text variant="caption1" weight="bold">
                  +{extra}
                </Text>
              </View>
            )}
          </View>
        )}

        <Button
          size="lg"
          className="w-full"
          onPress={() => router.replace('/trainings')}
        >
          Zurück zur Trainings-Liste
        </Button>
      </View>
    </Screen>
  );
}
