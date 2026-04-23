import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Text, ExerciseCard, Icon, FilterChip } from '@/components/ui';
import {
  LibraryFilterSheet,
  LibraryFilterSheetRef,
  LibraryFilterState,
  EMPTY_FILTERS,
  DURATION_LABEL,
} from '@/components/sheets/LibraryFilterSheet';
import { useExercises } from '@/lib/queries/useExercises';
import { usePickModeStore } from '@/lib/store/pickModeStore';
import { COLORS } from '@/lib/theme';

export default function ExercisePickerScreen() {
  const { excludeIds } = useLocalSearchParams<{ excludeIds?: string }>();
  const excluded = useMemo(
    () => new Set((excludeIds ?? '').split(',').filter(Boolean)),
    [excludeIds]
  );

  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);

  const selectedIds = usePickModeStore((s) => s.selectedIds);
  const toggle = usePickModeStore((s) => s.toggle);
  const confirm = usePickModeStore((s) => s.confirm);

  const [filters, setFilters] = useState<LibraryFilterState>(EMPTY_FILTERS);
  const filterSheetRef = useRef<LibraryFilterSheetRef>(null);

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
      if (excluded.has(ex.documentId)) return false;
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
  }, [exercises, filters, excluded]);

  const activeFilterCount =
    filters.focusareas.length +
    filters.playerlevels.length +
    filters.categories.length +
    (filters.duration ? 1 : 0);

  const removeTag = (key: 'focusareas' | 'playerlevels' | 'categories', name: string) =>
    setFilters((s) => ({ ...s, [key]: s[key].filter((v) => v !== name) }));
  const clearDuration = () => setFilters((s) => ({ ...s, duration: null }));

  useFocusEffect(
    useCallback(() => {
      return () => {
        const store = usePickModeStore.getState();
        if (store.active) store.cancel();
      };
    }, [])
  );

  const handleConfirm = () => {
    confirm();
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Übungen auswählen',
          headerBackTitle: 'Abbrechen',
          headerRight: () => (
            <Pressable onPress={handleConfirm} className="px-2">
              <Text variant="body" weight="semibold" color="primary">
                Fertig ({selectedIds.length})
              </Text>
            </Pressable>
          ),
        }}
      />

      <View className="px-5 pt-4 pb-2">
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
              const selected = selectedIds.includes(item.documentId);
              return (
                <ExerciseCard
                  exercise={item}
                  onPress={() => toggle(item.documentId)}
                  trailing={
                    <Icon
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      color={selected ? 'primary' : 'muted'}
                      size={24}
                    />
                  }
                />
              );
            }}
          />
        </Pressable>
      )}

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
