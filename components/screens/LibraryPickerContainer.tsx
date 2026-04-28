import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { LibraryView, LibraryTab } from './LibraryView';
import { collectTagNames, filterExercises } from './library-filters';
import {
  EMPTY_FILTERS,
  LibraryFilterState,
} from '@/components/sheets/LibraryFilterSheet';
import { useExercises } from '@/lib/queries/useExercises';
import { useMethodicalSeries } from '@/lib/queries/useMethodicalSeries';
import {
  useAddExerciseToTraining,
  useAddMethodicalSeriesToTraining,
  useTrainingDetail,
} from '@/lib/queries/useTrainings';
import { usePickSessionStore } from '@/lib/store/pickSessionStore';
import type { Exercise, MethodicalSeries } from '@/lib/types/models';

export interface LibraryPickerContainerProps {
  trainingId: string;
  trainingName?: string;
}

export function LibraryPickerContainer({ trainingId, trainingName }: LibraryPickerContainerProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('exercises');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LibraryFilterState>(EMPTY_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [addingExerciseId, setAddingExerciseId] = useState<string | null>(null);
  const [addingSeriesId, setAddingSeriesId] = useState<string | null>(null);

  const { data: exercises, isLoading: exercisesLoading } = useExercises(search);
  const { data: series, isLoading: seriesLoading } = useMethodicalSeries();
  const queryClient = useQueryClient();

  const addExerciseMutation = useAddExerciseToTraining();
  const addSeriesMutation = useAddMethodicalSeriesToTraining();
  const { addedExerciseIds, addedSeriesIds, markAdded, markSeriesAdded } = usePickSessionStore();

  const { data: training } = useTrainingDetail(trainingId);

  // Re-seed the pickSession store with current server state whenever the
  // training detail (re)loads or refetches. This keeps the picker's checkmarks
  // in sync with what's actually persisted, not stale in-session state.
  useEffect(() => {
    if (!training) return;
    const exerciseIds = (training.exercises ?? []).map((e) => e.documentId);
    const seriesIds = (training.methodicalSeries ?? []).map((s) => s.documentId);
    usePickSessionStore.getState().startSession(trainingId, exerciseIds, seriesIds);
  }, [training, trainingId]);

  const availableFocusareas = useMemo(() => collectTagNames(exercises, 'focusareas'), [exercises]);
  const availablePlayerlevels = useMemo(() => collectTagNames(exercises, 'playerlevels'), [exercises]);
  const availableCategories = useMemo(() => collectTagNames(exercises, 'categories'), [exercises]);
  const filteredExercises = useMemo(() => filterExercises(exercises, filters), [exercises, filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['exercises'], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['methodicalSeries'], type: 'active' }),
    ]);
    setRefreshing(false);
  };

  const handleAddExercise = useCallback(async (ex: Exercise) => {
    if (addingExerciseId === ex.documentId) return;
    setAddingExerciseId(ex.documentId);
    try {
      await addExerciseMutation.mutateAsync({ trainingId, exerciseId: ex.documentId });
      markAdded(ex.documentId);
      toast.success('Übung hinzugefügt');
    } catch {
      toast.error('Übung konnte nicht hinzugefügt werden');
    } finally {
      setAddingExerciseId(null);
    }
  }, [trainingId, addingExerciseId, addExerciseMutation, markAdded]);

  const handleAddSeries = useCallback(async (s: MethodicalSeries) => {
    if (addingSeriesId === s.documentId) return;
    setAddingSeriesId(s.documentId);
    try {
      const exerciseDocumentIds = (s.exercises ?? []).map((ex) => ex.documentId);
      await addSeriesMutation.mutateAsync({
        trainingId,
        seriesDocumentId: s.documentId,
        exerciseDocumentIds,
      });
      exerciseDocumentIds.forEach(markAdded);
      markSeriesAdded(s.documentId);
      toast.success('Lernpfad hinzugefügt');
    } catch {
      toast.error('Lernpfad konnte nicht hinzugefügt werden');
    } finally {
      setAddingSeriesId(null);
    }
  }, [trainingId, addingSeriesId, addSeriesMutation, markAdded, markSeriesAdded]);

  return (
    <LibraryView
      pickHeader={{
        title: trainingName ?? 'Hinzufügen',
        onClose: () => router.back(),
        onDone: () => router.dismissAll(),
      }}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      exercises={exercises}
      series={series}
      exercisesLoading={exercisesLoading}
      seriesLoading={seriesLoading}
      search={search}
      onSearchChange={setSearch}
      filters={filters}
      onFiltersChange={setFilters}
      availableFocusareas={availableFocusareas}
      availablePlayerlevels={availablePlayerlevels}
      availableCategories={availableCategories}
      filteredExercises={filteredExercises}
      refreshing={refreshing}
      onRefresh={onRefresh}
      addedExerciseIds={addedExerciseIds}
      addedSeriesIds={addedSeriesIds}
      addingExerciseId={addingExerciseId}
      addingSeriesId={addingSeriesId}
      onAddExercise={handleAddExercise}
      onAddSeries={handleAddSeries}
      onPressExercise={(ex) =>
        router.push({
          pathname: '/exercise-detail/[id]',
          params: { id: ex.documentId, trainingId, trainingName: trainingName ?? '' },
        })
      }
      onPressSeries={(s) =>
        router.push({
          pathname: '/series-detail/[id]' as any,
          params: { id: s.documentId, trainingId, trainingName: trainingName ?? '' },
        })
      }
    />
  );
}
