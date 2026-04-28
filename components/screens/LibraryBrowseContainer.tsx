import { useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LibraryView, LibraryTab } from './LibraryView';
import { collectTagNames, filterExercises } from './library-filters';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import {
  EMPTY_FILTERS,
  LibraryFilterState,
} from '@/components/sheets/LibraryFilterSheet';
import { useExercises } from '@/lib/queries/useExercises';
import { useMethodicalSeries } from '@/lib/queries/useMethodicalSeries';
import type { Exercise, MethodicalSeries } from '@/lib/types/models';

const EMPTY_SET: ReadonlySet<string> = new Set();

export function LibraryBrowseContainer() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('exercises');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LibraryFilterState>(EMPTY_FILTERS);
  const [refreshing, setRefreshing] = useState(false);

  const { data: exercises, isLoading: exercisesLoading } = useExercises(search);
  const { data: series, isLoading: seriesLoading } = useMethodicalSeries();
  const queryClient = useQueryClient();

  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

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

  return (
    <>
      <LibraryView
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
        addedExerciseIds={EMPTY_SET}
        addedSeriesIds={EMPTY_SET}
        addingExerciseId={null}
        addingSeriesId={null}
        onAddExercise={(ex: Exercise) =>
          trainingPickerRef.current?.present(ex.documentId, ex.Name)
        }
        onAddSeries={(s: MethodicalSeries) =>
          trainingPickerRef.current?.presentSeries(
            s.documentId,
            s.name,
            (s.exercises ?? []).map((ex) => ex.documentId),
          )
        }
        onPressExercise={(ex) =>
          router.push({ pathname: '/exercise-detail/[id]', params: { id: ex.documentId } })
        }
        onPressSeries={(s) =>
          router.push({ pathname: '/series-detail/[id]' as any, params: { id: s.documentId } })
        }
      />
      <TrainingPickerSheet ref={trainingPickerRef} />
    </>
  );
}
