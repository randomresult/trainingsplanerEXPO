# Library View + Container Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `LibraryScreen.tsx` into a pure presentation component (`LibraryView`) plus per-mode containers (`LibraryBrowseContainer`, `LibraryPickerContainer`) without changing any user-visible behaviour. This is a behaviour-preserving refactor that prepares the ground for future testing/Storybook and for additional pick-modes (e.g. an in-memory draft mode for the upcoming Series-to-New-Training cycle).

**Architecture:**
- `LibraryView` is a pure component: data + callbacks via props, no data fetching, no mutations, no router-pushes triggered from inside (the parent passes `onPress*` callbacks).
- `LibraryBrowseContainer` reproduces today's tab-mode behaviour: owns query hooks + filter/search state, opens `TrainingPickerSheet` when the user taps `+`.
- `LibraryPickerContainer` reproduces today's `library-pick`-mode behaviour: owns query hooks + mutations + `pickSessionStore` reads, fires the same toasts, navigates the same way.
- Two thin route files (`app/(tabs)/library/index.tsx`, `app/library-pick.tsx`) render the appropriate container.
- `LibraryScreen.tsx` is deleted at the end.
- Shared filter helpers (`tagNames`, `collectTagNames`, `filterExercises`) live in a new module so both containers can reuse them.

**Out of scope (intentionally):** No new modes, no `LibraryDraftContainer`, no callback-prop API, no series-to-new feature work. That's the next cycle, and it'll consume this split.

**Tech Stack:** Expo Router v4, React 19, NativeWind v4, TanStack Query v5, Zustand v5.

---

## File Map

**Create:**
- `components/screens/LibraryView.tsx` — pure presentation
- `components/screens/library-filters.ts` — shared `tagNames`, `collectTagNames`, `filterExercises`
- `components/screens/LibraryBrowseContainer.tsx` — tab mode
- `components/screens/LibraryPickerContainer.tsx` — `trainingId` mode

**Modify:**
- `app/(tabs)/library/index.tsx` — render `<LibraryBrowseContainer />`
- `app/library-pick.tsx` — render `<LibraryPickerContainer trainingId={...} />`

**Delete:**
- `components/screens/LibraryScreen.tsx`

---

## Task 1: Extract shared filter helpers

**Files:**
- Create: `components/screens/library-filters.ts`

Containers need the same `tagNames`/`collectTagNames`/`filterExercises` logic. Centralise it once so the containers stay thin and identical in their filter handling.

- [ ] **Step 1: Create `components/screens/library-filters.ts`**

```typescript
import type { Exercise } from '@/lib/types/models';
import type { LibraryFilterState } from '@/components/sheets/LibraryFilterSheet';

export const tagNames = (rel: any[] | undefined): string[] =>
  (rel ?? []).map((t) => t?.Name).filter(Boolean) as string[];

export const collectTagNames = (
  exercises: Exercise[] | undefined,
  key: 'focusareas' | 'playerlevels' | 'categories',
): string[] => {
  const set = new Set<string>();
  (exercises ?? []).forEach((ex: any) => tagNames(ex[key]).forEach((n) => set.add(n)));
  return Array.from(set).sort();
};

export const filterExercises = (
  exercises: Exercise[] | undefined,
  filters: LibraryFilterState,
): Exercise[] => {
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
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/screens/library-filters.ts
git commit -m "feat(library): extract shared filter helpers"
```

---

## Task 2: Extract `LibraryView` (pure presentation)

**Files:**
- Create: `components/screens/LibraryView.tsx`

`LibraryView` renders the entire library UI but doesn't own any data fetching, mutations, or stores. Everything comes in via props; user interactions go out via callbacks. The two FlatLists, search input, filter chips, tab toggle, the `LibraryFilterSheet`, and the optional pick-mode header all live here.

The header is rendered conditionally: when `headerTitle` is provided we render a `Stack.Screen` for the pick-mode header (left close icon, optional right „Fertig"). When `headerTitle` is `undefined` we render the inline „Bibliothek" title used by the tab.

- [ ] **Step 1: Create `components/screens/LibraryView.tsx`**

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. (Existing routes still use the old `LibraryScreen.tsx` — untouched in this task.)

- [ ] **Step 3: Commit**

```bash
git add components/screens/LibraryView.tsx
git commit -m "feat(library): extract pure LibraryView component"
```

---

## Task 3: `LibraryBrowseContainer` (Tab mode)

**Files:**
- Create: `components/screens/LibraryBrowseContainer.tsx`

The browse-mode container is the simplest: it renders the tab screen, owns the data hooks + filter/search state, and forwards `+`-taps to `TrainingPickerSheet`. No mutations, no `pickSessionStore` reads. The `addedExerciseIds`/`addedSeriesIds` are passed as empty sets to `LibraryView` so cards always show the `+` icon (browse mode never marks anything „added").

- [ ] **Step 1: Create `components/screens/LibraryBrowseContainer.tsx`**

```typescript
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/screens/LibraryBrowseContainer.tsx
git commit -m "feat(library): add LibraryBrowseContainer (tab mode)"
```

---

## Task 4: `LibraryPickerContainer` (mutate mode)

**Files:**
- Create: `components/screens/LibraryPickerContainer.tsx`

Reproduces today's `LibraryScreen` pick-mode behaviour exactly: mutations fire on add, `pickSessionStore` tracks already-added IDs across the session, header shows the trainingName plus a „Fertig" button that dismisses all stack screens. Toasts on success/failure are kept identical.

- [ ] **Step 1: Create `components/screens/LibraryPickerContainer.tsx`**

```typescript
import { useCallback, useMemo, useState } from 'react';
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
      headerTitle={trainingName ?? 'Hinzufügen'}
      onHeaderClose={() => router.back()}
      onHeaderDone={() => router.dismissAll()}
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/screens/LibraryPickerContainer.tsx
git commit -m "feat(library): add LibraryPickerContainer (mutate mode)"
```

---

## Task 5: Migrate routes; delete old `LibraryScreen`

**Files:**
- Modify: `app/(tabs)/library/index.tsx`
- Modify: `app/library-pick.tsx`
- Delete: `components/screens/LibraryScreen.tsx`

This task switches the two routes to the new containers in a single commit, then deletes the old file. Type-checking after the swap and before the delete catches any forgotten consumers of the old component.

- [ ] **Step 1: Read the current route wrappers to confirm what they look like**

```bash
cat app/\(tabs\)/library/index.tsx
cat app/library-pick.tsx
```

- [ ] **Step 2: Replace `app/(tabs)/library/index.tsx`**

Overwrite the file with:

```typescript
import { LibraryBrowseContainer } from '@/components/screens/LibraryBrowseContainer';

export default function LibraryListScreen() {
  return <LibraryBrowseContainer />;
}
```

- [ ] **Step 3: Replace `app/library-pick.tsx`**

Overwrite the file with:

```typescript
import { useLocalSearchParams } from 'expo-router';
import { LibraryPickerContainer } from '@/components/screens/LibraryPickerContainer';

export default function LibraryPickScreen() {
  const { trainingId, trainingName } = useLocalSearchParams<{
    trainingId: string;
    trainingName?: string;
  }>();
  return <LibraryPickerContainer trainingId={trainingId} trainingName={trainingName} />;
}
```

- [ ] **Step 4: Find any remaining `LibraryScreen` imports**

Run a grep across the project to ensure nothing else still imports the old component:

```bash
grep -rn "from '@/components/screens/LibraryScreen'" --include='*.ts' --include='*.tsx' . || echo "no matches"
grep -rn "components/screens/LibraryScreen" --include='*.ts' --include='*.tsx' . || echo "no matches"
```

Expected: no matches in `app/`, `components/`, `lib/`. If any match shows up, update the import to the appropriate container before deleting the file.

- [ ] **Step 5: Delete `components/screens/LibraryScreen.tsx`**

```bash
git rm components/screens/LibraryScreen.tsx
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add app/\(tabs\)/library/index.tsx app/library-pick.tsx
git commit -m "refactor(library): switch routes to View+Container split, delete LibraryScreen"
```

---

## Task 6: Acceptance walkthrough — all flows behave identically

This is a behaviour-preserving refactor. Walk through every flow that touched the old `LibraryScreen` and confirm nothing changed visibly.

- [ ] **Step 1: Browse mode (Bibliothek-Tab)**
  - [ ] Tab öffnet Library wie zuvor (Title „Bibliothek", kein Picker-Header)
  - [ ] Tab-Toggle Übungen ↔ Lernpfade funktioniert
  - [ ] Suche filtert Übungen
  - [ ] Filter-Chips öffnen `LibraryFilterSheet` und filtern korrekt
  - [ ] Pull-to-Refresh lädt Daten neu
  - [ ] `+` auf Übungs-Card öffnet `TrainingPickerSheet` mit der Übung
  - [ ] `+` auf Series-Card öffnet `TrainingPickerSheet` im Series-Modus
  - [ ] Tap auf Übungs-Card öffnet `exercise-detail` (ohne `trainingId`)
  - [ ] Tap auf Series-Card öffnet `series-detail` (ohne `trainingId`)

- [ ] **Step 2: Pick mode aus Trainings-Detail (`/library-pick?trainingId=...`)**
  - [ ] Header zeigt den Trainingsnamen, links Close, rechts „Fertig"
  - [ ] „Fertig" rufst `router.dismissAll()` (zurück zu den Tabs)
  - [ ] Tippen auf `+` einer Übung: Spinner → Toast „Übung hinzugefügt" → Card kriegt Checkmark, ist deaktiviert
  - [ ] Re-open des Pickers (gleiches Training): Übungen mit Checkmark bleiben markiert (Session-State via `pickSessionStore`)
  - [ ] Re-open mit anderem Training: `pickSessionStore` resettet, Server-Übungen werden korrekt geseedet
  - [ ] Tippen auf `+` eines Lernpfads: Spinner → Toast „Lernpfad hinzugefügt" → Series-Card und alle ihre Übungen markiert
  - [ ] Tap auf Übungs-Card öffnet `exercise-detail` mit `trainingId`/`trainingName` als Params (CTA „Übung zu „X" hinzufügen" sichtbar)
  - [ ] Tap auf Series-Card öffnet `series-detail` mit `trainingId`/`trainingName` als Params (CTA „Lernpfad zu „X" hinzufügen" sichtbar)

- [ ] **Step 3: Pick mode aus Live-Training (`/library-pick?trainingId=...` aus `execute.tsx`)**
  - [ ] Verhalten identisch zu Step 2 (gleicher Container, andere Aufrufstelle)

- [ ] **Step 4: Edge cases**
  - [ ] Filter-Chip entfernen aus Aktiv-Liste verhält sich wie zuvor
  - [ ] Suche im Pick-Modus funktioniert (Refresh setzt nicht zurück)
  - [ ] Empty-States (keine Treffer, keine Daten) werden korrekt gezeigt

- [ ] **Step 5: Final type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 6: Falls in der Akzeptanz Issues auftauchen, fix → commit. Sonst: ready to merge**

---

## Task 7: Move plan to `completed/`

**Files:**
- Move: `docs/superpowers/plans/2026-04-27-library-view-container-split.md` → `docs/superpowers/plans/completed/`

- [ ] **Step 1: Move and commit**

```bash
git mv docs/superpowers/plans/2026-04-27-library-view-container-split.md docs/superpowers/plans/completed/2026-04-27-library-view-container-split.md
git commit -m "docs: move library view+container split plan to completed/"
```

---

## Follow-up cycle (not in scope here)

After this split is shipped and verified, the next cycle is **Series-to-New-Training**. At that point we'll:

1. Re-evaluate whether the Lernpfad → „Neues Training erstellen"-Flow is still broken (probably yes — this refactor doesn't touch `training-new`).
2. Re-test the picker-sheet's „Heute & kommend"-Liste (does it already show the right state? probably no).
3. Decide what's the smallest delta to fix those remaining gaps. Likely: add `LibraryDraftContainer`, redesign `training-new` to match draft view, extend `useCreateTraining` with `seriesIds`, update `TrainingPickerSheet` to pass series params + show „bereits enthalten".

That cycle gets its own plan once we're here.
