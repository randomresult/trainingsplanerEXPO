import { useState, useRef, useMemo } from 'react';
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
import {
  View,
  TextInput,
  FlatList,
  Keyboard,
  Pressable,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';

const SERIES_BG = require('@/assets/images/series_background_default.png');
import { router } from 'expo-router';
import { Screen, Text, ExerciseCard, Icon, FilterChip, SkeletonList } from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';
import { useMethodicalSeries } from '@/lib/queries/useMethodicalSeries';
import { useQueryClient } from '@tanstack/react-query';
import { COLORS } from '@/lib/theme';
import type { MethodicalSeries } from '@/lib/types/models';

type LibraryTab = 'exercises' | 'series';

export default function LibraryListScreen() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('exercises');
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);
  const { data: seriesList, isLoading: seriesLoading } = useMethodicalSeries();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  const [filters, setFilters] = useState<LibraryFilterState>(EMPTY_FILTERS);
  const filterSheetRef = useRef<LibraryFilterSheetRef>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['exercises'] }),
      queryClient.invalidateQueries({ queryKey: ['methodicalSeries'] }),
    ]);
    setRefreshing(false);
  };

  const tagNames = (rel: any[] | undefined) =>
    (rel ?? []).map((t) => t?.Name).filter(Boolean) as string[];

  const collectTagNames = (key: 'focusareas' | 'playerlevels' | 'categories') => {
    const set = new Set<string>();
    (exercises ?? []).forEach((ex: any) => {
      tagNames(ex[key]).forEach((n) => set.add(n));
    });
    return Array.from(set).sort();
  };

  const availableFocusareas = useMemo(() => collectTagNames('focusareas'), [exercises]);
  const availablePlayerlevels = useMemo(() => collectTagNames('playerlevels'), [exercises]);
  const availableCategories = useMemo(() => collectTagNames('categories'), [exercises]);

  const filtered = useMemo(() => {
    const matchesMulti = (selected: string[], rel: any[] | undefined) => {
      if (selected.length === 0) return true;
      const names = tagNames(rel);
      return names.some((n) => selected.includes(n));
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

  return (
    <Screen>
      <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
        <Text variant="largeTitle" weight="bold">Bibliothek</Text>
      </View>

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
              <FilterChip
                key={`cat-${name}`}
                label={name}
                active
                onRemove={() => removeTag('categories', name)}
              />
            ))}
            {filters.playerlevels.map((name) => (
              <FilterChip
                key={`lvl-${name}`}
                label={name}
                active
                onRemove={() => removeTag('playerlevels', name)}
              />
            ))}
            {filters.focusareas.map((name) => (
              <FilterChip
                key={`focus-${name}`}
                label={name}
                active
                onRemove={() => removeTag('focusareas', name)}
              />
            ))}
            {filters.duration && (
              <FilterChip
                label={DURATION_LABEL[filters.duration]}
                active
                onRemove={clearDuration}
              />
            )}
          </View>

          {isLoading ? (
            <View className="px-5">
              <SkeletonList count={6} />
            </View>
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
                renderItem={({ item }: { item: any }) => (
                  <ExerciseCard
                    exercise={item}
                    onPress={() => router.push({ pathname: '/exercise-detail/[id]', params: { id: item.documentId } })}
                    trailing={
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
                    }
                  />
                )}
              />
            </Pressable>
          )}
        </>
      ) : (
        // Lernpfade tab
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
            renderItem={({ item }: { item: MethodicalSeries }) => (
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/library/series/[id]' as any, params: { id: item.documentId } })}
                className="rounded-2xl overflow-hidden active:opacity-75"
              >
                {/* Background image — absolute fill, parent height driven by content */}
                <Image source={SERIES_BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

                {/* Dark overlay — inline style avoids NativeWind rgba translation issues */}
                <View style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} className="p-4">
                  <View className="flex-row items-start justify-between mb-3">
                    {item.category ? (
                      <View className="bg-amber-500/25 border border-amber-400/50 rounded-md px-2 py-1">
                        <Text variant="caption2" className="text-amber-300 font-bold uppercase tracking-widest">
                          {item.category}
                        </Text>
                      </View>
                    ) : <View />}
                    {/* Progress pill: hidden until cross-training PlayerProgress query is built */}
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
                      <Text variant="title2" weight="bold" className="text-white">{item.exercises?.length ?? 0}</Text>
                      <Text variant="footnote" className="text-white/60">Übungen</Text>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        trainingPickerRef.current?.presentSeries(
                          item.documentId,
                          item.name,
                          (item.exercises ?? []).map((ex) => ex.documentId),
                        );
                      }}
                      hitSlop={10}
                      className="w-9 h-9 rounded-full bg-white/15 border border-white/30 items-center justify-center"
                    >
                      <Icon name="add" size={20} color="foreground" />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )
      )}

      <TrainingPickerSheet ref={trainingPickerRef} />
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
