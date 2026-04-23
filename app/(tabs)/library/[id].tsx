import { useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Text, Badge, Card, Icon, Button } from '@/components/ui';
import { useExerciseDetail } from '@/lib/queries/useExercises';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import { COLORS } from '@/lib/theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading } = useExerciseDetail(id);
  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen padding="base">
        <View className="flex-1 items-center justify-center">
          <Text variant="footnote" color="muted">Übung nicht gefunden</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Screen scroll padding="base">
        <Text variant="largeTitle" weight="bold" className="mb-3 mt-2">
          {exercise.Name}
        </Text>

        <View className="flex-row gap-2 mb-5">
          <Badge variant="muted">{`${exercise.Minutes} Min`}</Badge>
          {exercise.Difficulty && (
            <Badge variant="info-soft">{exercise.Difficulty}</Badge>
          )}
        </View>

        {exercise.Description && (
          <>
            <Text variant="headline" className="mb-2">Beschreibung</Text>
            <Text variant="body" color="muted" className="mb-6">
              {exercise.Description}
            </Text>
          </>
        )}

        {exercise.Steps && exercise.Steps.length > 0 && (
          <>
            <Text variant="headline" className="mb-3">Anleitung</Text>
            {exercise.Steps.map((step: any, idx: number) => {
              const title = typeof step === 'string' ? step : step?.Name;
              const body = typeof step === 'string' ? null : step?.Description;
              return (
                <Card key={step?.id ?? idx} className="mb-3">
                  <View className="flex-row gap-3">
                    <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center">
                      <Text variant="caption1" weight="bold" color="primary">{idx + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text variant="body" weight="semibold" className="mb-1">{title}</Text>
                      {body && <Text variant="footnote" color="muted">{body}</Text>}
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {exercise.Hint && (
          <Card variant="outline" className="border-warning bg-warning/10 mt-2 mb-8">
            <View className="flex-row items-start gap-2">
              <Icon name="bulb-outline" color="warning" size={18} />
              <View className="flex-1">
                <Text variant="subhead" weight="semibold" color="warning" className="mb-1">
                  Trainer-Hinweis
                </Text>
                <Text variant="footnote" color="foreground">{exercise.Hint}</Text>
              </View>
            </View>
          </Card>
        )}
      </Screen>

      <View className="px-5 py-3 border-t border-border bg-background">
        <Button
          size="lg"
          className="w-full"
          leftIcon="add"
          onPress={() => trainingPickerRef.current?.present(exercise.documentId, exercise.Name)}
        >
          Zum Training hinzufügen
        </Button>
      </View>

      <TrainingPickerSheet ref={trainingPickerRef} />
    </Screen>
  );
}
