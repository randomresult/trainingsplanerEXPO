import { useCallback, useRef } from 'react';
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
import { Stack } from 'expo-router';
import {
  Screen,
  Text,
  ExerciseCard,
  Icon,
  FilterChip,
  SkeletonList,
} from '@/components/ui';
import {
  LibraryFilterSheet,
  LibraryFilterSheetRef,
  LibraryFilterState,
  DURATION_LABEL,
} from '@/components/sheets/LibraryFilterSheet';
import { COLORS } from '@/lib/theme';
import type { Exercise, MethodicalSeries } from '@/lib/types/models';

const SERIES_BG = require('../../assets/images/series_background_default.png');

export type LibraryTab = 'exercises' | 'series';

export interface LibraryViewProps {
  // Chrome
  /** When set, renders a pick-mode `Stack.Screen` header with this title. When undefined, renders the inline „Bibliothek" tab heading. */
  headerTitle?: string;
  onHeaderClose?: () => void;
  onHeaderDone?: () => void;
  headerDoneLabel?: string;

  // Tab
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;

  // Data
  exercises: Exercise[] | undefined;
  series: MethodicalSeries[] | undefined;
  exercisesLoading: boolean;
  seriesLoading: boolean;

  // Search
  search: string;
  onSearchChange: (s: string) => void;

  // Filters
  filters: LibraryFilterState;
  onFiltersChange: (f: LibraryFilterState) => void;
  availableFocusareas: string[];
  availablePlayerlevels: string[];
  availableCategories: string[];
  filteredExercises: Exercise[];

  // Refresh
  refreshing: boolean;
  onRefresh: () => void;

  // Add state — controlled by container
  addedExerciseIds: ReadonlySet<string>;
  addedSeriesIds: ReadonlySet<string>;
  addingExerciseId: string | null;
  addingSeriesId: string | null;

  // Actions
  onAddExercise: (exercise: Exercise) => void;
  onAddSeries: (series: MethodicalSeries) => void;
  onPressExercise: (exercise: Exercise) => void;
  onPressSeries: (series: MethodicalSeries) => void;
}

export function LibraryView(props: LibraryViewProps) {
  const filterSheetRef = useRef<LibraryFilterSheetRef>(null);

  const {
    headerTitle,
    onHeaderClose,
    onHeaderDone,
    headerDoneLabel = 'Fertig',
    activeTab,
    onTabChange,
    exercises,
    series,
    exercisesLoading,
    seriesLoading,
    search,
    onSearchChange,
    filters,
    onFiltersChange,
    availableFocusareas,
    availablePlayerlevels,
    availableCategories,
    filteredExercises,
    refreshing,
    onRefresh,
    addedExerciseIds,
    addedSeriesIds,
    addingExerciseId,
    addingSeriesId,
    onAddExercise,
    onAddSeries,
    onPressExercise,
    onPressSeries,
  } = props;

  const isPickHeader = !!headerTitle;

  const activeFilterCount =
    filters.focusareas.length +
    filters.playerlevels.length +
    filters.categories.length +
    (filters.duration ? 1 : 0);

  const removeTag = (key: 'focusareas' | 'playerlevels' | 'categories', name: string) =>
    onFiltersChange({ ...filters, [key]: filters[key].filter((v) => v !== name) });
  const clearDuration = () => onFiltersChange({ ...filters, duration: null });

  const renderExerciseItem = useCallback(({ item }: { item: Exercise }) => {
    const isAdded = addedExerciseIds.has(item.documentId);
    const isAdding = addingExerciseId === item.documentId;
    return (
      <ExerciseCard
        exercise={item}
        onPress={() => onPressExercise(item)}
        trailing={
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              if (!isAdded && !isAdding) onAddExercise(item);
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
        }
      />
    );
  }, [addedExerciseIds, addingExerciseId, onAddExercise, onPressExercise]);

  const renderSeriesItem = useCallback(({ item }: { item: MethodicalSeries }) => {
    const isAdded = addedSeriesIds.has(item.documentId);
    const isAdding = addingSeriesId === item.documentId;
    return (
      <Pressable
        onPress={() => onPressSeries(item)}
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
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                if (!isAdded && !isAdding) onAddSeries(item);
              }}
              disabled={isAdded || isAdding}
              hitSlop={10}
              className={
                isAdded
                  ? 'w-9 h-9 rounded-full bg-green-500/25 border border-green-400/40 items-center justify-center'
                  : 'w-9 h-9 rounded-full bg-white/15 border border-white/30 items-center justify-center'
              }
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name={isAdded ? 'checkmark' : 'add'} size={20} color="foreground" />
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }, [addedSeriesIds, addingSeriesId, onAddSeries, onPressSeries]);

  return (
    <Screen edges={isPickHeader ? ['bottom'] : ['top', 'bottom']}>
      {isPickHeader && (
        <Stack.Screen
          options={{
            headerShown: true,
            title: headerTitle,
            headerLeft: () => (
              <Pressable onPress={onHeaderClose} className="px-2 py-1" hitSlop={8}>
                <Icon
                  name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
                  size={22}
                  color="foreground"
                />
              </Pressable>
            ),
            headerRight: onHeaderDone
              ? () => (
                  <Pressable onPress={onHeaderDone} className="px-2 py-1" hitSlop={8}>
                    <Text variant="subhead" weight="semibold" color="primary">
                      {headerDoneLabel}
                    </Text>
                  </Pressable>
                )
              : undefined,
          }}
        />
      )}

      {!isPickHeader && (
        <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
          <Text variant="largeTitle" weight="bold">Bibliothek</Text>
        </View>
      )}

      {/* Tab toggle */}
      <View className="flex-row mx-5 mb-3 bg-surface-1 rounded-lg p-1">
        {(['exercises', 'series'] as LibraryTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
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
              onChangeText={onSearchChange}
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

          {exercisesLoading ? (
            <View className="px-5"><SkeletonList count={6} /></View>
          ) : (
            <Pressable onPress={Keyboard.dismiss} className="flex-1">
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.documentId}
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
            data={series ?? []}
            keyExtractor={(item) => item.documentId}
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

      <LibraryFilterSheet
        ref={filterSheetRef}
        filters={filters}
        onChange={onFiltersChange}
        availableFocusareas={availableFocusareas}
        availablePlayerlevels={availablePlayerlevels}
        availableCategories={availableCategories}
      />
    </Screen>
  );
}
