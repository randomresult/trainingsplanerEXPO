import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LibraryView, LibraryTab } from './LibraryView';
import { collectTagNames, filterExercises } from './library-filters';
import {
  EMPTY_FILTERS,
  LibraryFilterState,
} from '@/components/sheets/LibraryFilterSheet';
import { useExercises } from '@/lib/queries/useExercises';
import { useMethodicalSeries } from '@/lib/queries/useMethodicalSeries';
import { useDraftPickStore } from '@/lib/store/draftPickStore';
import type { Exercise, MethodicalSeries } from '@/lib/types/models';

export function LibraryDraftPickerContainer() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('exercises');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LibraryFilterState>(EMPTY_FILTERS);
  const [refreshing, setRefreshing] = useState(false);

  const { data: exercises, isLoading: exercisesLoading } = useExercises(search);
  const { data: series, isLoading: seriesLoading } = useMethodicalSeries();
  const queryClient = useQueryClient();

  const {
    active,
    initialExerciseIds,
    initialSeriesIds,
    addedExerciseIds: liveAddedExerciseIds,
    addedSeriesIds: liveAddedSeriesIds,
    addExercise,
    addSeries,
  } = useDraftPickStore();

  // If someone navigates to this route without a startDraftPick call, bail back.
  useEffect(() => {
    if (!active) {
      if (__DEV__) console.warn('[LibraryDraftPickerContainer] mounted without active draft session');
      router.back();
    }
  }, [active]);

  const checkmarkExerciseIds = useMemo(() => {
    const u = new Set(initialExerciseIds);
    liveAddedExerciseIds.forEach((id) => u.add(id));
    return u;
  }, [initialExerciseIds, liveAddedExerciseIds]);

  const checkmarkSeriesIds = useMemo(() => {
    const u = new Set(initialSeriesIds);
    liveAddedSeriesIds.forEach((id) => u.add(id));
    return u;
  }, [initialSeriesIds, liveAddedSeriesIds]);

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

  const handleAddExercise = (ex: Exercise) => {
    if (checkmarkExerciseIds.has(ex.documentId)) return;
    addExercise(ex.documentId);
  };

  const handleAddSeries = (s: MethodicalSeries) => {
    if (checkmarkSeriesIds.has(s.documentId)) return;
    const exerciseDocumentIds = (s.exercises ?? []).map((ex) => ex.documentId);
    addSeries(s.documentId, exerciseDocumentIds);
  };

  if (!active) return null;

  return (
    <LibraryView
      pickHeader={{
        title: 'Hinzufügen',
        onClose: () => router.back(),
        onDone: () => router.back(),
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
      addedExerciseIds={checkmarkExerciseIds}
      addedSeriesIds={checkmarkSeriesIds}
      addingExerciseId={null}
      addingSeriesId={null}
      onAddExercise={handleAddExercise}
      onAddSeries={handleAddSeries}
      onPressExercise={(ex) =>
        router.push({
          pathname: '/exercise-detail/[id]',
          params: { id: ex.documentId },
        })
      }
      onPressSeries={(s) =>
        router.push({
          pathname: '/series-detail/[id]' as any,
          params: { id: s.documentId },
        })
      }
    />
  );
}
