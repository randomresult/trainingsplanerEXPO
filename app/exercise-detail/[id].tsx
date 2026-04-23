import { useRef } from 'react';
import { Platform, View, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Screen,
  Text,
  Card,
  Icon,
  Button,
  ExercisePills,
} from '@/components/ui';
import { useExerciseDetail } from '@/lib/queries/useExercises';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import { usePickModeStore } from '@/lib/store/pickModeStore';
import { COLORS } from '@/lib/theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading } = useExerciseDetail(id);
  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  // Hide the "add to training" CTA when opened from inside an active pick
  // flow (e.g. live-training add-exercise picker). The user is already
  // mid-add — offering a *second* add to some other training would be wrong.
  const pickerActive = usePickModeStore((s) => s.active);

  const headerOptions = {
    title: 'Übung',
    // Modal has no native back chevron on either platform — the web close-
    // button pattern matches the rest of the app's modal routes.
    headerLeft: () => (
      <Pressable onPress={() => router.back()} className="px-2 py-1" hitSlop={8}>
        <Icon
          name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
          size={22}
          color="foreground"
        />
      </Pressable>
    ),
  };

  if (isLoading) {
    return (
      <Screen>
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen padding="base">
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 items-center justify-center">
          <Text variant="footnote" color="muted">Übung nicht gefunden</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={headerOptions} />

      <Screen scroll padding="base">
        <Text variant="largeTitle" weight="bold" className="mb-3 mt-2">
          {exercise.Name}
        </Text>

        <View className="mb-5">
          <ExercisePills exercise={exercise} />
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

      {!pickerActive && (
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
      )}

      <TrainingPickerSheet ref={trainingPickerRef} />
    </Screen>
  );
}
