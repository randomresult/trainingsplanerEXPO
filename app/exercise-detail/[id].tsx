import { useRef, useState } from 'react';
import { Platform, View, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Screen,
  Text,
  Card,
  Icon,
  Button,
  ExercisePills,
  SkeletonDetail,
  SkeletonLine,
} from '@/components/ui';
import { useExerciseDetail } from '@/lib/queries/useExercises';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import { useAddExerciseToTraining } from '@/lib/queries/useTrainings';
import { toast } from 'sonner-native';
import { COLORS } from '@/lib/theme';

export default function ExerciseDetailScreen() {
  const { id, trainingId, trainingName } = useLocalSearchParams<{
    id: string;
    trainingId?: string;
    trainingName?: string;
  }>();
  const { data: exercise, isLoading } = useExerciseDetail(id);
  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  const addExerciseMutation = useAddExerciseToTraining();
  const [directAdding, setDirectAdding] = useState(false);

  const headerOptions = {
    headerShown: true as const,
    title: 'Übung',
    headerLeft: () => (
      <Pressable onPress={() => router.back()} className="px-2 py-1" hitSlop={8}>
        <Icon
          name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
          size={22}
          color="foreground"
        />
      </Pressable>
    ),
    ...(trainingId ? {
      headerRight: () => (
        <Pressable onPress={() => router.dismissAll()} className="px-2 py-1" hitSlop={8}>
          <Text variant="subhead" weight="semibold" color="primary">Fertig</Text>
        </Pressable>
      ),
    } : {}),
  };

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <Screen scroll padding="base" edges={['bottom']}>
          <SkeletonDetail />
          <View className="mt-6">
            <SkeletonLine width="30%" height={20} className="mb-3" />
            <SkeletonLine width="100%" height={80} className="mb-4" />
            <SkeletonLine width="100%" height={80} />
          </View>
        </Screen>
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen padding="base" edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 items-center justify-center">
          <Text variant="footnote" color="muted">Übung nicht gefunden</Text>
        </View>
      </Screen>
    );
  }

  const handleDirectAdd = async () => {
    if (!trainingId || directAdding) return;
    setDirectAdding(true);
    try {
      await addExerciseMutation.mutateAsync({ trainingId, exerciseId: exercise.documentId });
      toast.success('Übung hinzugefügt');
      router.back();
    } catch {
      toast.error('Übung konnte nicht hinzugefügt werden');
    } finally {
      setDirectAdding(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={headerOptions} />

      <Screen scroll padding="base" edges={['bottom']}>
        <Text variant="largeTitle" weight="bold" className="mb-3 mt-2">
          {exercise.Name}
        </Text>

        <View className="mb-5">
          <ExercisePills exercise={exercise} />
        </View>

        {(exercise.methodicalSeries?.length ?? 0) > 0 && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/series-detail/[id]' as any,
                params: trainingId
                  ? { id: exercise.methodicalSeries![0].documentId, trainingId, trainingName: trainingName ?? '' }
                  : { id: exercise.methodicalSeries![0].documentId },
              })
            }
            className="flex-row items-center gap-2 bg-primary/10 rounded-lg px-3 py-2 mb-5"
          >
            <Icon name="school-outline" size={16} color="primary" />
            <View className="flex-1">
              <Text variant="caption2" color="muted">Teil der Methodischen Reihe</Text>
              <Text variant="footnote" weight="semibold" color="primary">
                {exercise.methodicalSeries![0].name}
              </Text>
            </View>
            <Icon name="chevron-forward" size={14} color="primary" />
          </Pressable>
        )}

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
        {trainingId ? (
          <Button
            size="lg"
            className="w-full"
            leftIcon="add"
            loading={directAdding}
            onPress={handleDirectAdd}
          >
            {trainingName ? `Zu „${trainingName}"` : 'Zum Training hinzufügen'}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            leftIcon="add"
            onPress={() => trainingPickerRef.current?.present(exercise.documentId, exercise.Name)}
          >
            Zum Training hinzufügen
          </Button>
        )}
      </View>

      <TrainingPickerSheet ref={trainingPickerRef} />
    </Screen>
  );
}
