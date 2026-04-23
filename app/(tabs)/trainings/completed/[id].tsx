import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, Text, Button, Icon } from '@/components/ui';
import { useTrainingDetail } from '@/lib/queries/useTrainings';
import { COLORS } from '@/lib/theme';

const POINTS_PER_EXERCISE = 10;

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

  const exerciseCount = training.exercises?.length ?? 0;
  const points = exerciseCount * POINTS_PER_EXERCISE;

  return (
    <Screen padding="base">
      <View className="flex-1 items-center justify-center">
        <View className="w-24 h-24 rounded-full bg-success/20 items-center justify-center mb-6">
          <Icon name="checkmark-circle" size={64} color="success" />
        </View>

        <Text variant="largeTitle" weight="bold" className="mb-2 text-center">
          Training beendet
        </Text>
        <Text variant="title3" color="muted" className="mb-10 text-center">
          {training.Name}
        </Text>

        <View className="items-center mb-12">
          <Text
            weight="bold"
            className="text-primary"
            style={{ fontSize: 80, lineHeight: 88 }}
          >
            {points}
          </Text>
          <Text variant="title3" color="primary" weight="semibold">
            Punkte
          </Text>
          <Text variant="footnote" color="muted" className="mt-1">
            {exerciseCount} {exerciseCount === 1 ? 'Übung' : 'Übungen'} abgehakt
          </Text>
        </View>

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
