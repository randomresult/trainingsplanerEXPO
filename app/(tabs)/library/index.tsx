import { useState, useCallback, useRef, useMemo } from 'react';
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
  DurationBucket,
} from '@/components/sheets/LibraryFilterSheet';
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Text, ExerciseCard, Icon, FilterChip } from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';
import { usePickModeStore } from '@/lib/store/pickModeStore';
import { COLORS } from '@/lib/theme';

export default function LibraryListScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isPickMode = mode === 'pick';

  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);

  // Pick-mode selectors subscribe only when needed — avoids noisy re-renders in normal mode.
  const selectedIds = usePickModeStore((s) => s.selectedIds);
  const toggle = usePickModeStore((s) => s.toggle);
  const confirm = usePickModeStore((s) => s.confirm);
  const cancel = usePickModeStore((s) => s.cancel);

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

  // Cancel pick-mode if the user navigates away without confirming (back swipe / hardware back).
  // useFocusEffect's cleanup runs on blur.
  useFocusEffect(
    useCallback(() => {
      return () => {
        const store = usePickModeStore.getState();
        if (store.active) store.cancel();
      };
    }, [])
  );

  const handleCardPress = (exerciseId: string) => {
    if (isPickMode) {
      toggle(exerciseId);
    } else {
      router.push(`/library/${exerciseId}`);
    }
  };

  const handleConfirm = () => {
    confirm();
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen
        options={
          isPickMode
            ? {
                headerShown: true,
                title: 'Auswählen',
                headerBackTitle: 'Abbrechen',
                headerRight: () => (
                  <Pressable onPress={handleConfirm} className="px-2">
                    <Text variant="body" weight="semibold" color="primary">
                      Fertig ({selectedIds.length})
                    </Text>
                  </Pressable>
                ),
              }
            : { headerShown: false }
        }
      />

      {!isPickMode && (
        <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
          <Text variant="largeTitle" weight="bold">Bibliothek</Text>
        </View>
      )}

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
            renderItem={({ item }: { item: any }) => {
              const selected = isPickMode && selectedIds.includes(item.documentId);
              return (
                <ExerciseCard
                  exercise={item}
                  onPress={() => handleCardPress(item.documentId)}
                  trailing={
                    isPickMode ? (
                      <Icon
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        color={selected ? 'primary' : 'muted'}
                        size={24}
                      />
                    ) : (
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
                    )
                  }
                />
              );
            }}
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
