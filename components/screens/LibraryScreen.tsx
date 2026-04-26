import { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Keyboard,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Screen,
  Text,
  ExerciseCard,
  Icon,
  FilterChip,
  SkeletonList,
} from '@/components/ui';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import {
  LibraryFilterSheet,
  LibraryFilterSheetRef,
  LibraryFilterState,
  EMPTY_FILTERS,
  DURATION_LABEL,
} from '@/components/sheets/LibraryFilterSheet';
import { useExercises } from '@/lib/queries/useExercises';
import { useMethodicalSeries } from '@/lib/queries/useMethodicalSeries';
import {
  useAddExerciseToTraining,
  useAddMethodicalSeriesToTraining,
} from '@/lib/queries/useTrainings';
import { useQueryClient } from '@tanstack/react-query';
import { COLORS } from '@/lib/theme';
import type { MethodicalSeries } from '@/lib/types/models';
import { toast } from 'sonner-native';

const SERIES_BG = require('../../assets/images/series_background_default.png');

// Fix 1: Pure utility functions moved to module level (no component state deps)
const tagNames = (rel: any[] | undefined) =>
  (rel ?? []).map((t) => t?.Name).filter(Boolean) as string[];

const collectTagNames = (
  exercises: any[] | undefined,
  key: 'focusareas' | 'playerlevels' | 'categories',
) => {
  const set = new Set<string>();
  (exercises ?? []).forEach((ex: any) => tagNames(ex[key]).forEach((n) => set.add(n)));
  return Array.from(set).sort();
};

type LibraryTab = 'exercises' | 'series';

export interface LibraryScreenProps {
  trainingId?: string;
  trainingName?: string;
}

export function LibraryScreen({ trainingId, trainingName }: LibraryScreenProps) {
  const pickMode = !!trainingId;

  const [activeTab, setActiveTab] = useState<LibraryTab>('exercises');
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);
  const { data: seriesList, isLoading: seriesLoading } = useMethodicalSeries();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const addExerciseMutation = useAddExerciseToTraining();
  const addSeriesMutation = useAddMethodicalSeriesToTraining();

  const [addingId, setAddingId] = useState<string | null>(null);
  const [sessionAddedIds, setSessionAddedIds] = useState<Set<string>>(new Set());

  // Fix 4: State for series loading/added tracking
  const [addingSeriesId, setAddingSeriesId] = useState<string | null>(null);
  const [sessionAddedSeriesIds, setSessionAddedSeriesIds] = useState<Set<string>>(new Set());

  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);
  const [filters, setFilters] = useState<LibraryFilterState>(EMPTY_FILTERS);
  const filterSheetRef = useRef<LibraryFilterSheetRef>(null);

  // Fix 2: Use refetchQueries so the spinner waits for actual network data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['exercises'], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['methodicalSeries'], type: 'active' }),
    ]);
    setRefreshing(false);
  };

  // Fix 1: useMemo calls now pass exercises as first argument
  const availableFocusareas = useMemo(() => collectTagNames(exercises, 'focusareas'), [exercises]);
  const availablePlayerlevels = useMemo(() => collectTagNames(exercises, 'playerlevels'), [exercises]);
  const availableCategories = useMemo(() => collectTagNames(exercises, 'categories'), [exercises]);

  const filtered = useMemo(() => {
    const matchesMulti = (selected: string[], rel: any[] | undefined) => {
      if (selected.length === 0) return true;
      return tagNames(rel).some((n) => selected.includes(n));
    };
    return (exercises ?? []).filter((ex: any) => {
      if (!matchesMulti(filters.focusareas, ex.focusareas)) return false;
      if (!matchesMulti(filters.playerlevels, ex.playerlevels)) return false;
      if (!matchesMulti(filters.categories, ex.categories)) return false;
      if (filters.duration) {
        const m = ex.Minutes ?? 0;
        if (filters.duration === 'short' && m > 10) return false;
        if (filters.duration === 'medium' && (m <= 10 || m > 20)) return false;
        if (filters.duration === 'long' && m <= 20) return false;
      }
      return true;
    });
  }, [exercises, filters]);

  const activeFilterCount =
    filters.focusareas.length +
    filters.playerlevels.length +
    filters.categories.length +
    (filters.duration ? 1 : 0);

  const removeTag = (key: 'focusareas' | 'playerlevels' | 'categories', name: string) =>
    setFilters((s) => ({ ...s, [key]: s[key].filter((v) => v !== name) }));
  const clearDuration = () => setFilters((s) => ({ ...s, duration: null }));

  const handleAddExercise = useCallback(async (exerciseId: string) => {
    if (!trainingId || addingId === exerciseId) return;
    setAddingId(exerciseId);
    try {
      await addExerciseMutation.mutateAsync({ trainingId, exerciseId });
      setSessionAddedIds((prev) => new Set(prev).add(exerciseId));
      toast.success('Übung hinzugefügt');
    } catch {
      toast.error('Übung konnte nicht hinzugefügt werden');
    } finally {
      setAddingId(null);
    }
  }, [trainingId, addingId, addExerciseMutation]);

  const handleAddSeries = useCallback(async (item: MethodicalSeries) => {
    if (!trainingId || addingSeriesId === item.documentId) return;
    setAddingSeriesId(item.documentId);
    try {
      await addSeriesMutation.mutateAsync({
        trainingId,
        seriesDocumentId: item.documentId,
        exerciseDocumentIds: (item.exercises ?? []).map((ex) => ex.documentId),
      });
      setSessionAddedSeriesIds((prev) => new Set(prev).add(item.documentId));
      toast.success('Lernpfad hinzugefügt');
    } catch {
      toast.error('Lernpfad konnte nicht hinzugefügt werden');
    } finally {
      setAddingSeriesId(null);
    }
  }, [trainingId, addingSeriesId, addSeriesMutation]);

  // Fix 3: Memoized renderItem for exercises FlatList
  const renderExerciseItem = useCallback(({ item }: { item: any }) => {
    const isAdded = sessionAddedIds.has(item.documentId);
    const isAdding = addingId === item.documentId;
    return (
      <ExerciseCard
        exercise={item}
        onPress={() =>
          router.push({
            pathname: '/exercise-detail/[id]',
            params: pickMode
              ? { id: item.documentId, trainingId, trainingName: trainingName ?? '' }
              : { id: item.documentId },
          })
        }
        trailing={
          pickMode ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                if (!isAdded && !isAdding) handleAddExercise(item.documentId);
              }}
              hitSlop={10}
              disabled={isAdded || isAdding}
              className={
                isAdded
                  ? 'w-10 h-10 rounded-full bg-success/15 items-center justify-center'
                  : 'w-10 h-10 rounded-full bg-primary/15 items-center justify-center'
              }
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Icon
                  name={isAdded ? 'checkmark' : 'add'}
                  size={20}
                  color={isAdded ? 'success' : 'primary'}
                />
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                trainingPickerRef.current?.present(item.documentId, item.Name);
              }}
              hitSlop={10}
              className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center"
            >
              <Icon name="add" size={20} color="primary" />
            </Pressable>
          )
        }
      />
    );
  }, [sessionAddedIds, addingId, pickMode, trainingId, trainingName, handleAddExercise]);

  // Fix 3 + Fix 4: Memoized renderItem for series FlatList with loading/added state
  const renderSeriesItem = useCallback(({ item }: { item: MethodicalSeries }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/series-detail/[id]' as any,
          params: pickMode
            ? { id: item.documentId, trainingId, trainingName: trainingName ?? '' }
            : { id: item.documentId },
        })
      }
      style={{ position: 'relative' }}
      className="rounded-2xl overflow-hidden active:opacity-75"
    >
      <Image
        source={SERIES_BG}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      <View style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} className="p-4">
        <View className="flex-row items-start justify-between mb-3">
          {item.category ? (
            <View className="bg-amber-500/25 border border-amber-400/50 rounded-md px-2 py-1">
              <Text variant="caption2" className="text-amber-300 font-bold uppercase tracking-widest">
                {item.category}
              </Text>
            </View>
          ) : <View />}
        </View>
        <Text variant="title3" weight="bold" numberOfLines={2} className="mb-1 text-white">
          {item.name}
        </Text>
        {(item.goal || item.description) ? (
          <Text variant="footnote" numberOfLines={2} className="mb-4 text-white/65">
            {item.goal || item.description}
          </Text>
        ) : <View className="mb-4" />}
        <View className="h-px bg-white/20 mb-3" />
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-baseline gap-1">
            <Text variant="title2" weight="bold" className="text-white">
              {item.exercises?.length ?? 0}
            </Text>
            <Text variant="footnote" className="text-white/60">Übungen</Text>
          </View>
          {(() => {
            const isSeriesAdded = sessionAddedSeriesIds.has(item.documentId);
            const isSeriesAdding = addingSeriesId === item.documentId;
            return (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (!isSeriesAdded && !isSeriesAdding) {
                    if (pickMode) {
                      handleAddSeries(item);
                    } else {
                      trainingPickerRef.current?.presentSeries(
                        item.documentId,
                        item.name,
                        (item.exercises ?? []).map((ex) => ex.documentId),
                      );
                    }
                  }
                }}
                disabled={isSeriesAdded || isSeriesAdding}
                hitSlop={10}
                className={
                  isSeriesAdded
                    ? 'w-9 h-9 rounded-full bg-green-500/25 border border-green-400/40 items-center justify-center'
                    : 'w-9 h-9 rounded-full bg-white/15 border border-white/30 items-center justify-center'
                }
              >
                {isSeriesAdding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name={isSeriesAdded ? 'checkmark' : 'add'} size={20} color="foreground" />
                )}
              </Pressable>
            );
          })()}
        </View>
      </View>
    </Pressable>
  ), [pickMode, trainingId, trainingName, handleAddSeries, addingSeriesId, sessionAddedSeriesIds]);

  return (
    <Screen edges={pickMode ? ['bottom'] : ['top', 'bottom']}>
      {pickMode && (
        <Stack.Screen
          options={{
            headerShown: true,
            title: trainingName ?? 'Hinzufügen',
            headerLeft: () => (
              <Pressable onPress={() => router.back()} className="px-2 py-1" hitSlop={8}>
                <Icon
                  name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
                  size={22}
                  color="foreground"
                />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable onPress={() => router.dismissAll()} className="px-2 py-1" hitSlop={8}>
                <Text variant="subhead" weight="semibold" color="primary">Fertig</Text>
              </Pressable>
            ),
          }}
        />
      )}

      {!pickMode && (
        <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
          <Text variant="largeTitle" weight="bold">Bibliothek</Text>
        </View>
      )}

      {/* Tab toggle */}
      <View className="flex-row mx-5 mb-3 bg-surface-1 rounded-lg p-1">
        {(['exercises', 'series'] as LibraryTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md items-center ${activeTab === tab ? 'bg-card' : ''}`}
          >
            <Text
              variant="subhead"
              weight={activeTab === tab ? 'semibold' : 'regular'}
              color={activeTab === tab ? 'foreground' : 'muted'}
            >
              {tab === 'exercises' ? 'Übungen' : 'Lernpfade'}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'exercises' ? (
        <>
          <View className="px-5 pb-2">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Übung suchen..."
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="flex-row gap-2 px-5 pb-3 flex-wrap">
            <FilterChip
              label="Filter"
              leadingIcon="options-outline"
              active={activeFilterCount > 0}
              badge={activeFilterCount}
              onPress={() => filterSheetRef.current?.present()}
            />
            {filters.categories.map((name) => (
              <FilterChip key={`cat-${name}`} label={name} active onRemove={() => removeTag('categories', name)} />
            ))}
            {filters.playerlevels.map((name) => (
              <FilterChip key={`lvl-${name}`} label={name} active onRemove={() => removeTag('playerlevels', name)} />
            ))}
            {filters.focusareas.map((name) => (
              <FilterChip key={`focus-${name}`} label={name} active onRemove={() => removeTag('focusareas', name)} />
            ))}
            {filters.duration && (
              <FilterChip label={DURATION_LABEL[filters.duration]} active onRemove={clearDuration} />
            )}
          </View>

          {isLoading ? (
            <View className="px-5"><SkeletonList count={6} /></View>
          ) : (
            <Pressable onPress={Keyboard.dismiss} className="flex-1">
              <FlatList
                data={filtered}
                keyExtractor={(item: any) => item.documentId}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                  <View className="items-center justify-center py-12">
                    <Icon name="search-outline" size={40} color="muted" />
                    <Text variant="footnote" color="muted" className="mt-3">
                      {search ? 'Keine Übungen gefunden' : 'Keine Übungen vorhanden'}
                    </Text>
                  </View>
                }
                renderItem={renderExerciseItem}
              />
            </Pressable>
          )}
        </>
      ) : (
        seriesLoading ? (
          <View className="px-5"><SkeletonList count={4} /></View>
        ) : (
          <FlatList
            data={seriesList ?? []}
            keyExtractor={(item: MethodicalSeries) => item.documentId}
            contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Icon name="list-outline" size={40} color="muted" />
                <Text variant="footnote" color="muted" className="mt-3">Keine Lernpfade vorhanden</Text>
              </View>
            }
            renderItem={renderSeriesItem}
          />
        )
      )}

      {!pickMode && <TrainingPickerSheet ref={trainingPickerRef} />}
      <LibraryFilterSheet
        ref={filterSheetRef}
        filters={filters}
        onChange={setFilters}
        availableFocusareas={availableFocusareas}
        availablePlayerlevels={availablePlayerlevels}
        availableCategories={availableCategories}
      />
    </Screen>
  );
}
