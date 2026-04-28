import { useRef, useState } from 'react';
import { Platform, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Screen,
  Text,
  Icon,
  SkeletonDetail,
  SkeletonList,
  Button,
} from '@/components/ui';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import { useMethodicalSeriesDetail } from '@/lib/queries/useMethodicalSeries';
import { useAddMethodicalSeriesToTraining, useAddExerciseToTraining } from '@/lib/queries/useTrainings';
import { toast } from 'sonner-native';
import { COLORS } from '@/lib/theme';
import { usePickSessionStore } from '@/lib/store/pickSessionStore';
import { useDraftPickStore } from '@/lib/store/draftPickStore';

export default function SeriesDetailScreen() {
  const { id, trainingId, trainingName } = useLocalSearchParams<{
    id: string;
    trainingId?: string;
    trainingName?: string;
  }>();
  const { data: series, isLoading } = useMethodicalSeriesDetail(id);
  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  const addSeriesMutation = useAddMethodicalSeriesToTraining();
  const addExerciseMutation = useAddExerciseToTraining();
  const [addingWholeSeries, setAddingWholeSeries] = useState(false);
  const [addingExerciseId, setAddingExerciseId] = useState<string | null>(null);
  const { addedExerciseIds: sessionExerciseIds, addedSeriesIds: sessionSeriesIds, markAdded, markSeriesAdded } = usePickSessionStore();

  const draftActive = useDraftPickStore((s) => s.active);
  const draftInitialExerciseIds = useDraftPickStore((s) => s.initialExerciseIds);
  const draftInitialSeriesIds = useDraftPickStore((s) => s.initialSeriesIds);
  const draftAddedExerciseIds = useDraftPickStore((s) => s.addedExerciseIds);
  const draftAddedSeriesIds = useDraftPickStore((s) => s.addedSeriesIds);
  const draftAddExercise = useDraftPickStore((s) => s.addExercise);
  const draftAddSeries = useDraftPickStore((s) => s.addSeries);

  const mode: 'draft-pick' | 'training-pick' | 'view' =
    draftActive ? 'draft-pick' : trainingId ? 'training-pick' : 'view';

  const isExerciseAdded = (exerciseId: string) =>
    mode === 'draft-pick'
      ? draftAddedExerciseIds.has(exerciseId) || draftInitialExerciseIds.has(exerciseId)
      : mode === 'training-pick'
        ? sessionExerciseIds.has(exerciseId)
        : false;

  const isSeriesAdded =
    mode === 'draft-pick'
      ? series ? draftAddedSeriesIds.has(series.documentId) || draftInitialSeriesIds.has(series.documentId) : false
      : mode === 'training-pick'
        ? series ? sessionSeriesIds.has(series.documentId) : false
        : false;

  const handleAddExercise = async (exerciseId: string, exerciseName: string) => {
    if (mode === 'draft-pick') {
      if (isExerciseAdded(exerciseId)) return;
      draftAddExercise(exerciseId);
      toast.success(`${exerciseName} hinzugefügt`);
      return;
    }
    if (mode !== 'training-pick' || !trainingId || addingExerciseId === exerciseId) return;
    setAddingExerciseId(exerciseId);
    try {
      await addExerciseMutation.mutateAsync({ trainingId, exerciseId });
      markAdded(exerciseId);
      toast.success(`${exerciseName} hinzugefügt`);
    } catch {
      toast.error('Übung konnte nicht hinzugefügt werden');
    } finally {
      setAddingExerciseId(null);
    }
  };

  const headerOptions = {
    headerShown: true as const,
    title: 'Lernpfad',
    headerLeft: () => (
      <Pressable onPress={() => router.back()} className="px-2 py-1" hitSlop={8}>
        <Icon
          name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
          size={22}
          color="foreground"
        />
      </Pressable>
    ),
    ...(mode !== 'view' ? {
      headerRight: () => (
        <Pressable
          onPress={mode === 'draft-pick' ? () => router.back() : () => router.dismissAll()}
          className="px-2 py-1"
          hitSlop={8}
        >
          <Text variant="subhead" weight="semibold" color="primary">Fertig</Text>
        </Pressable>
      ),
    } : {}),
  };

  const handleAddWholeSeries = async () => {
    if (!series) return;
    if (mode === 'draft-pick') {
      if (isSeriesAdded) return;
      const exerciseDocumentIds = (series.exercises ?? []).map((ex) => ex.documentId);
      draftAddSeries(series.documentId, exerciseDocumentIds);
      toast.success('Lernpfad hinzugefügt');
      router.back();
      return;
    }
    if (mode !== 'training-pick' || !trainingId || addingWholeSeries) return;
    setAddingWholeSeries(true);
    try {
      const exerciseDocumentIds = (series.exercises ?? []).map((ex) => ex.documentId);
      await addSeriesMutation.mutateAsync({
        trainingId,
        seriesDocumentId: series.documentId,
        exerciseDocumentIds,
      });
      exerciseDocumentIds.forEach(markAdded);
      markSeriesAdded(series.documentId);
      toast.success('Lernpfad hinzugefügt');
      router.dismissAll();
    } catch {
      toast.error('Lernpfad konnte nicht hinzugefügt werden');
    } finally {
      setAddingWholeSeries(false);
    }
  };

  if (isLoading) {
    return (
      <Screen scroll padding="base" edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View className="pt-14">
          <SkeletonDetail />
          <View className="mt-6">
            <SkeletonList count={4} />
          </View>
        </View>
      </Screen>
    );
  }

  if (!series) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 items-center justify-center">
          <Icon name="list-outline" size={40} color="muted" />
          <Text variant="footnote" color="muted" className="mt-3">
            Lernpfad nicht gefunden
          </Text>
        </View>
      </Screen>
    );
  }

  const exerciseIds = (series.exercises ?? []).map((ex) => ex.documentId);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={headerOptions} />

      <Screen scroll edges={[]}>

      {/* Hero */}
      <View className="bg-card px-5 pt-5 pb-6 border-b border-border">
        <View className="w-12 h-12 rounded-full bg-primary/15 items-center justify-center mb-4">
          <Icon name="school-outline" size={26} color="primary" />
        </View>

        {series.category ? (
          <View className="self-start bg-amber-500/25 border border-amber-400/50 rounded-md px-2 py-1 mb-2">
            <Text variant="caption2" className="text-amber-300 font-bold uppercase tracking-widest">
              {series.category}
            </Text>
          </View>
        ) : null}

        <Text variant="largeTitle" weight="bold" className="mb-1">
          {series.name}
        </Text>

        {series.goal ? (
          <View className="bg-surface-1 rounded-lg px-3 py-2 mt-2">
            <Text variant="caption1" weight="semibold" color="muted" className="mb-1">
              Ziel
            </Text>
            <Text variant="footnote">{series.goal}</Text>
          </View>
        ) : null}

        {series.description ? (
          <Text variant="footnote" className="mt-3" color="muted">
            {series.description}
          </Text>
        ) : null}
      </View>

      {/* Exercise list */}
      <View className="px-5 pt-4 pb-4">
        <Text variant="headline" weight="semibold" className="mb-3">
          {series.exercises?.length ?? 0} Übungen
        </Text>

        {(series.exercises ?? []).map((ex, idx) => (
            <Pressable
              key={ex.documentId}
              onPress={() =>
                router.push({
                  pathname: '/exercise-detail/[id]',
                  params: mode === 'training-pick'
                    ? { id: ex.documentId, trainingId, trainingName: trainingName ?? '' }
                    : { id: ex.documentId },
                })
              }
              className="flex-row items-center gap-3 mb-3 bg-card border border-border rounded-xl px-3 py-3 active:opacity-80"
            >
              <View className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center shrink-0">
                <Text variant="caption2" weight="bold" color="primary">
                  {idx + 1}
                </Text>
              </View>
              <Text variant="subhead" className="flex-1" numberOfLines={2}>
                {ex.Name}
              </Text>
              {(() => {
                const isAdded = isExerciseAdded(ex.documentId);
                const isAdding = addingExerciseId === ex.documentId;
                return (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      if (isAdded || isAdding) return;
                      if (mode === 'view') {
                        trainingPickerRef.current?.present(ex.documentId, ex.Name);
                      } else {
                        handleAddExercise(ex.documentId, ex.Name);
                      }
                    }}
                    hitSlop={10}
                    disabled={isAdded || isAdding}
                    className={
                      isAdded
                        ? 'w-9 h-9 rounded-full bg-success/15 items-center justify-center shrink-0'
                        : 'w-9 h-9 rounded-full bg-primary/15 items-center justify-center shrink-0'
                    }
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Icon name={isAdded ? 'checkmark' : 'add'} size={18} color={isAdded ? 'success' : 'primary'} />
                    )}
                  </Pressable>
                );
              })()}
            </Pressable>
        ))}
      </View>

      </Screen>

      {(() => {
        return (
          <View className="px-5 py-3 border-t border-border bg-background">
            <Button
              size="lg"
              className="w-full"
              leftIcon={isSeriesAdded ? 'checkmark' : 'add'}
              loading={addingWholeSeries}
              disabled={isSeriesAdded}
              onPress={
                mode === 'view'
                  ? () => trainingPickerRef.current?.presentSeries(series.documentId, series.name, exerciseIds)
                  : handleAddWholeSeries
              }
            >
              {isSeriesAdded
                ? 'Bereits hinzugefügt'
                : mode === 'draft-pick'
                  ? 'Lernpfad hinzufügen'
                  : mode === 'training-pick'
                    ? (trainingName ? `Lernpfad zu „${trainingName}" hinzufügen` : 'Lernpfad hinzufügen')
                    : 'Ganze Reihe hinzufügen'}
            </Button>
          </View>
        );
      })()}

      {mode === 'view' && <TrainingPickerSheet ref={trainingPickerRef} />}
    </Screen>
  );
}
