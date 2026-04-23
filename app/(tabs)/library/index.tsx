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
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, ExerciseCard, Icon, FilterChip } from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';
import { COLORS } from '@/lib/theme';

export default function LibraryListScreen() {
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);

  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  const [filters, setFilters] = useState<LibraryFilterState>(EMPTY_FILTERS);
  const filterSheetRef = useRef<LibraryFilterSheetRef>(null);

  const availableFocus = useMemo(() => {
    const set = new Set<string>();
    (exercises ?? []).forEach((ex: any) => {
      (ex.focus ?? []).forEach((f: any) => {
        if (f?.Name) set.add(f.Name);
      });
    });
    return Array.from(set).sort();
  }, [exercises]);

  const availableDifficulty = useMemo(() => {
    const set = new Set<string>();
    (exercises ?? []).forEach((ex: any) => {
      if (ex.Difficulty) set.add(ex.Difficulty);
    });
    return Array.from(set);
  }, [exercises]);

  const filtered = useMemo(() => {
    return (exercises ?? []).filter((ex: any) => {
      if (filters.focus.length > 0) {
        const names = (ex.focus ?? []).map((f: any) => f?.Name).filter(Boolean);
        const overlap = names.some((n: string) => filters.focus.includes(n));
        if (!overlap) return false;
      }
      if (filters.difficulty && ex.Difficulty !== filters.difficulty) return false;
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
    filters.focus.length +
    (filters.difficulty ? 1 : 0) +
    (filters.duration ? 1 : 0);

  const removeFocus = (name: string) =>
    setFilters((s) => ({ ...s, focus: s.focus.filter((f) => f !== name) }));

  const clearDifficulty = () => setFilters((s) => ({ ...s, difficulty: null }));
  const clearDuration = () => setFilters((s) => ({ ...s, duration: null }));

  return (
    <Screen>
      <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
        <Text variant="largeTitle" weight="bold">Bibliothek</Text>
      </View>

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
        {filters.focus.map((name) => (
          <FilterChip
            key={`focus-${name}`}
            label={name}
            active
            onRemove={() => removeFocus(name)}
          />
        ))}
        {filters.difficulty && (
          <FilterChip
            label={filters.difficulty}
            active
            onRemove={clearDifficulty}
          />
        )}
        {filters.duration && (
          <FilterChip
            label={DURATION_LABEL[filters.duration]}
            active
            onRemove={clearDuration}
          />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <FlatList
            data={filtered}
            keyExtractor={(item: any) => item.documentId}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
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
                onPress={() => router.push(`/library/${item.documentId}`)}
                trailing={
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      trainingPickerRef.current?.present(item.documentId, item.Name);
                    }}
                    hitSlop={8}
                    className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center"
                  >
                    <Icon name="add" size={18} color="primary" />
                  </Pressable>
                }
              />
            )}
          />
        </Pressable>
      )}
      <TrainingPickerSheet ref={trainingPickerRef} />
      <LibraryFilterSheet
        ref={filterSheetRef}
        filters={filters}
        onChange={setFilters}
        availableFocus={availableFocus}
        availableDifficulty={availableDifficulty}
      />
    </Screen>
  );
}
