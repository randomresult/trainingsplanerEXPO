import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from 'react-native';
import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
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
  const initiallyAdded = useMemo(
    () => new Set((excludeIds ?? '').split(',').filter(Boolean)),
    [excludeIds]
  );

  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search);

  const onAdd = usePickModeStore((s) => s.onAdd);

  // Per-card ephemeral state: which is mid-mutation, which has just been added
  // during this picker session. initiallyAdded comes from the caller as a
  // query param and covers the "already in training" case.
  const [addingId, setAddingId] = useState<string | null>(null);
  const [sessionAddedIds, setSessionAddedIds] = useState<Set<string>>(new Set());

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

  // Cancel on actual removal (back/swipe-dismiss) — NOT on focus loss, so
  // pushing /exercise-detail on top and returning preserves the session.
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      const store = usePickModeStore.getState();
      if (store.active) store.cancel();
    });
    return unsubscribe;
  }, [navigation]);

  const handleAdd = async (exerciseId: string) => {
    if (!onAdd || addingId === exerciseId) return;
    setAddingId(exerciseId);
    try {
      await onAdd(exerciseId);
      setSessionAddedIds((prev) => {
        const next = new Set(prev);
        next.add(exerciseId);
        return next;
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Übungen',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              className="px-2 py-1"
              hitSlop={8}
            >
              <Icon
                name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
                size={22}
                color="foreground"
              />
            </Pressable>
          ),
          // Dezente Bestätigung im Header: sobald der User mindestens eine
          // Übung hinzugefügt hat, sieht er den Counter statt nur der Toasts
          // zu zählen. So weiß er beim Schließen, wie viele schon sitzen.
          headerRight: () =>
            sessionAddedIds.size > 0 ? (
              <View className="px-3 py-1 rounded-full bg-success/15 flex-row items-center gap-1">
                <Icon name="checkmark" size={14} color="success" />
                <Text variant="caption1" weight="semibold" color="success">
                  {sessionAddedIds.size}{' '}
                  {sessionAddedIds.size === 1 ? 'hinzugefügt' : 'hinzugefügt'}
                </Text>
              </View>
            ) : undefined,
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
              const alreadyThere = initiallyAdded.has(item.documentId);
              const sessionAdded = sessionAddedIds.has(item.documentId);
              const isAdded = alreadyThere || sessionAdded;
              const isAdding = addingId === item.documentId;

              return (
                <ExerciseCard
                  exercise={item}
                  onPress={() =>
                    router.push({
                      pathname: '/exercise-detail/[id]',
                      params: { id: item.documentId },
                    })
                  }
                  trailing={
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        if (!isAdded && !isAdding) handleAdd(item.documentId);
                      }}
                      hitSlop={8}
                      disabled={isAdded || isAdding}
                      className={
                        isAdded
                          ? 'w-8 h-8 rounded-full bg-success/15 items-center justify-center'
                          : 'w-8 h-8 rounded-full bg-primary/15 items-center justify-center'
                      }
                    >
                      {isAdding ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <Icon
                          name={isAdded ? 'checkmark' : 'add'}
                          size={18}
                          color={isAdded ? 'success' : 'primary'}
                        />
                      )}
                    </Pressable>
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
