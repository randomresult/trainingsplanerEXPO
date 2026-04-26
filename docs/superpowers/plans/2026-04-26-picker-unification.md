# Library / Picker Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `exercise-picker.tsx` and `library/index.tsx` into a single shared `LibraryScreen` component, eliminating `usePickModeStore`'s exercise-specific parts and the `exercise-picker` route.

**Architecture:** Extract a `LibraryScreen` component with an optional `trainingId` prop. Browse mode (no prop) uses `TrainingPickerSheet`. Pick mode (`trainingId` set) adds directly via mutations. Two thin route files wrap the component: `app/(tabs)/library/index.tsx` (tab, no prop) and `app/library-pick.tsx` (push route, passes `trainingId`). Training screens navigate to `/library-pick` instead of calling the store and pushing `/exercise-picker`. `exercise-detail` reads pick context from route params instead of the store.

**Tech Stack:** Expo Router v4, NativeWind v4, TanStack Query v5, Zustand v5, React Native, `sonner-native`.

---

## File Map

**Create:**
- `components/screens/LibraryScreen.tsx` — shared component, owns all library UI and both modes
- `app/library-pick.tsx` — thin push-route wrapper

**Modify:**
- `app/(tabs)/library/index.tsx` — replace with thin wrapper (renders `<LibraryScreen />`)
- `app/_layout.tsx` — swap `exercise-picker` Stack.Screen for `library-pick`
- `app/(tabs)/trainings/[id]/index.tsx` — replace `handleAddExercises` (remove store call)
- `app/(tabs)/trainings/[id]/execute.tsx` — replace `handleAddExercises` (remove store call)
- `app/exercise-detail/[id].tsx` — replace store subscription with route params
- `lib/store/pickModeStore.ts` — remove exercise-specific fields and `startAdd`

**Delete:**
- `app/exercise-picker.tsx`

---

## Task 1: Create `LibraryScreen` component

**Files:**
- Create: `components/screens/LibraryScreen.tsx`

- [ ] **Step 1: Create the component file**

Create `components/screens/LibraryScreen.tsx` with the following content:

```typescript
import { useState, useRef, useMemo } from 'react';
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
    (exercises ?? []).forEach((ex: any) => tagNames(ex[key]).forEach((n) => set.add(n)));
    return Array.from(set).sort();
  };

  const availableFocusareas = useMemo(() => collectTagNames('focusareas'), [exercises]);
  const availablePlayerlevels = useMemo(() => collectTagNames('playerlevels'), [exercises]);
  const availableCategories = useMemo(() => collectTagNames('categories'), [exercises]);

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

  const handleAddExercise = async (exerciseId: string) => {
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
  };

  const handleAddSeries = async (item: MethodicalSeries) => {
    if (!trainingId) return;
    try {
      await addSeriesMutation.mutateAsync({
        trainingId,
        seriesDocumentId: item.documentId,
        exerciseDocumentIds: (item.exercises ?? []).map((ex) => ex.documentId),
      });
      toast.success('Lernpfad hinzugefügt');
    } catch {
      toast.error('Lernpfad konnte nicht hinzugefügt werden');
    }
  };

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
                renderItem={({ item }: { item: any }) => {
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
                }}
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
            renderItem={({ item }: { item: MethodicalSeries }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/library/series/[id]' as any,
                    params: { id: item.documentId },
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
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        if (pickMode) {
                          handleAddSeries(item);
                        } else {
                          trainingPickerRef.current?.presentSeries(
                            item.documentId,
                            item.name,
                            (item.exercises ?? []).map((ex) => ex.documentId),
                          );
                        }
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors from the new file. (Ignore pre-existing errors if any.)

- [ ] **Step 3: Commit**

```bash
git add components/screens/LibraryScreen.tsx
git commit -m "feat(screens): extract LibraryScreen component — browse + pick mode"
```

---

## Task 2: Replace `library/index.tsx` with thin wrapper

**Files:**
- Modify: `app/(tabs)/library/index.tsx`

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `app/(tabs)/library/index.tsx` with:

```typescript
import { LibraryScreen } from '@/components/screens/LibraryScreen';

export default function LibraryListScreen() {
  return <LibraryScreen />;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify library tab still works**

Open the app. Navigate to the Bibliothek tab. Confirm:
- "Übungen" and "Lernpfade" tabs both render
- Search works
- Filter chip opens the filter sheet
- `+` on an exercise opens the TrainingPickerSheet
- `+` on a series card opens the TrainingPickerSheet (series mode)
- Tapping an exercise card navigates to exercise-detail

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/library/index.tsx"
git commit -m "refactor(library): replace index.tsx with thin LibraryScreen wrapper"
```

---

## Task 3: Create `library-pick.tsx` push route

**Files:**
- Create: `app/library-pick.tsx`

- [ ] **Step 1: Create the file**

Create `app/library-pick.tsx`:

```typescript
import { useLocalSearchParams } from 'expo-router';
import { LibraryScreen } from '@/components/screens/LibraryScreen';

export default function LibraryPickScreen() {
  const { trainingId, trainingName } = useLocalSearchParams<{
    trainingId: string;
    trainingName?: string;
  }>();

  return <LibraryScreen trainingId={trainingId} trainingName={trainingName} />;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/library-pick.tsx
git commit -m "feat(routes): add library-pick push route"
```

---

## Task 4: Update `_layout.tsx` — swap routes

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Replace `exercise-picker` Stack.Screen with `library-pick`**

In `app/_layout.tsx`, find:

```typescript
      <Stack.Screen
        name="exercise-picker"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
```

Replace it with:

```typescript
      <Stack.Screen
        name="library-pick"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "refactor(layout): replace exercise-picker route with library-pick"
```

---

## Task 5: Update training callsites

**Files:**
- Modify: `app/(tabs)/trainings/[id]/index.tsx`
- Modify: `app/(tabs)/trainings/[id]/execute.tsx`

### `app/(tabs)/trainings/[id]/index.tsx`

- [ ] **Step 1: Replace `handleAddExercises`**

Find:

```typescript
const handleAddExercises = () => {
  if (!training) return;
  const existingIds = training.exercises?.map((e) => e.documentId) ?? [];
  usePickModeStore.getState().startAdd(async (exerciseId) => {
    try {
      await addExercise.mutateAsync({ trainingId: id, exerciseId });
      toast.success('Übung hinzugefügt');
    } catch {
      toast.error('Übung konnte nicht hinzugefügt werden');
    }
  });
  router.push({
    pathname: '/exercise-picker',
    params: { excludeIds: existingIds.join(',') },
  });
};
```

Replace with:

```typescript
const handleAddExercises = () => {
  if (!training) return;
  router.push({
    pathname: '/library-pick',
    params: { trainingId: id, trainingName: training.Name },
  });
};
```

- [ ] **Step 2: Remove `usePickModeStore` import from this file**

Find and remove the import line:

```typescript
import { usePickModeStore } from '@/lib/store/pickModeStore';
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/trainings/[id]/index.tsx"
git commit -m "refactor(training-detail): navigate to library-pick instead of exercise-picker"
```

### `app/(tabs)/trainings/[id]/execute.tsx`

- [ ] **Step 5: Replace `handleAddExercises`**

Find:

```typescript
const handleAddExercises = () => {
  if (!training) return;
  const existingIds = training.exercises?.map((e) => e.documentId) ?? [];
  usePickModeStore.getState().startAdd(
    async (exerciseId) => {
      try {
        await addExercise.mutateAsync({ trainingId: id, exerciseId });
        toast.success('Übung hinzugefügt');
      } catch {
        toast.error('Übung konnte nicht hinzugefügt werden');
      }
    },
    'Zum Live-Training hinzufügen'
  );
  router.push({
    pathname: '/exercise-picker',
    params: { excludeIds: existingIds.join(',') },
  });
};
```

Replace with:

```typescript
const handleAddExercises = () => {
  if (!training) return;
  router.push({
    pathname: '/library-pick',
    params: { trainingId: id, trainingName: training.Name },
  });
};
```

- [ ] **Step 6: Remove `usePickModeStore` import from this file**

Find and remove:

```typescript
import { usePickModeStore } from '@/lib/store/pickModeStore';
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add "app/(tabs)/trainings/[id]/execute.tsx"
git commit -m "refactor(execute): navigate to library-pick instead of exercise-picker"
```

---

## Task 6: Update `exercise-detail` — route params replace store

**Files:**
- Modify: `app/exercise-detail/[id].tsx`

- [ ] **Step 1: Remove `usePickModeStore` import, add `useAddExerciseToTraining`**

Find:

```typescript
import { usePickModeStore } from '@/lib/store/pickModeStore';
```

Remove that line.

Find the existing training mutations import (it will be near `useExerciseDetail`). Add `useAddExerciseToTraining` to the trainings import:

```typescript
import { useAddExerciseToTraining } from '@/lib/queries/useTrainings';
```

- [ ] **Step 2: Update `useLocalSearchParams` to include `trainingId` and `trainingName`**

Find:

```typescript
  const { id } = useLocalSearchParams<{ id: string }>();
```

Replace with:

```typescript
  const { id, trainingId, trainingName } = useLocalSearchParams<{
    id: string;
    trainingId?: string;
    trainingName?: string;
  }>();
```

- [ ] **Step 3: Replace store subscriptions with the mutation hook**

Find and remove these two lines:

```typescript
  const onAdd = usePickModeStore((s) => s.onAdd);
  const addContextLabel = usePickModeStore((s) => s.addContextLabel);
```

Add the mutation hook after the existing hook declarations:

```typescript
  const addExerciseMutation = useAddExerciseToTraining();
```

- [ ] **Step 4: Replace `handleDirectAdd`**

Find the existing `handleDirectAdd` function (it calls `onAdd(exercise.documentId)`). Replace it with:

```typescript
  const handleDirectAdd = async () => {
    if (!trainingId || directAdding) return;
    setDirectAdding(true);
    try {
      await addExerciseMutation.mutateAsync({ trainingId, exerciseId: exercise.documentId });
      toast.success('Übung hinzugefügt');
    } catch {
      toast.error('Übung konnte nicht hinzugefügt werden');
    } finally {
      setDirectAdding(false);
    }
  };
```

- [ ] **Step 5: Update the CTA button**

Find:

```typescript
  {onAdd ? (
    <Button
      size="lg"
      className="w-full"
      leftIcon="add"
      loading={directAdding}
      onPress={handleDirectAdd}
    >
      {addContextLabel ?? 'Zum Training hinzufügen'}
    </Button>
  ) : (
    <Button
      size="lg"
      className="w-full"
      leftIcon="add"
      onPress={() => trainingPickerRef.current?.present(exercise.documentId, exercise.Name)}
    >
      Zum Training hinzufügen
    </Button>
  )}
```

Replace with:

```typescript
  {trainingId ? (
    <Button
      size="lg"
      className="w-full"
      leftIcon="add"
      loading={directAdding}
      onPress={handleDirectAdd}
    >
      {trainingName ? `Zu „${trainingName}"` : 'Zum Training hinzufügen'}
    </Button>
  ) : (
    <Button
      size="lg"
      className="w-full"
      leftIcon="add"
      onPress={() => trainingPickerRef.current?.present(exercise.documentId, exercise.Name)}
    >
      Zum Training hinzufügen
    </Button>
  )}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Verify exercise-detail still works from both contexts**

**Browse mode:** Open library tab → tap exercise card → detail shows "Zum Training hinzufügen" button → tapping opens TrainingPickerSheet.

**Pick mode:** Open a training → tap "Hinzufügen" → library-pick opens → tap an exercise card → detail opens → shows `Zu „[Training Name]"` button → tapping adds and shows success toast → pressing back returns to library-pick.

- [ ] **Step 8: Commit**

```bash
git add app/exercise-detail/[id].tsx
git commit -m "refactor(exercise-detail): read pick context from route params, remove store dependency"
```

---

## Task 7: Slim down `pickModeStore`

**Files:**
- Modify: `lib/store/pickModeStore.ts`

- [ ] **Step 1: Remove exercise-specific types and fields**

Replace the entire contents of `lib/store/pickModeStore.ts` with:

```typescript
import { create } from 'zustand';

type OnConfirmCallback = (ids: string[]) => void | Promise<void>;

interface PickModeStore {
  active: boolean;
  selectedIds: string[];
  onConfirm?: OnConfirmCallback;

  start: (initial: string[], onConfirm: OnConfirmCallback) => void;
  toggle: (id: string) => void;
  confirm: () => Promise<void>;
  cancel: () => void;
}

export const usePickModeStore = create<PickModeStore>((set, get) => ({
  active: false,
  selectedIds: [],
  onConfirm: undefined,

  start: (initial, onConfirm) =>
    set({
      active: true,
      selectedIds: initial,
      onConfirm,
    }),

  toggle: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),

  confirm: async () => {
    const { onConfirm, selectedIds } = get();
    try {
      await onConfirm?.(selectedIds);
    } finally {
      set({ active: false, selectedIds: [], onConfirm: undefined });
    }
  },

  cancel: () =>
    set({ active: false, selectedIds: [], onConfirm: undefined }),
}));
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. (If there are errors they will point to remaining `startAdd` / `onAdd` / `addContextLabel` usages that were missed — fix those first.)

- [ ] **Step 3: Commit**

```bash
git add lib/store/pickModeStore.ts
git commit -m "refactor(store): remove exercise single-add mode from pickModeStore"
```

---

## Task 8: Delete `exercise-picker.tsx`

**Files:**
- Delete: `app/exercise-picker.tsx`

- [ ] **Step 1: Delete the file**

```bash
rm "app/exercise-picker.tsx"
```

Or delete via file explorer / IDE.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are "cannot find module" errors pointing to `exercise-picker`, grep for remaining references:

```bash
grep -r "exercise-picker" app/ lib/ components/
```

Fix any remaining references (should be none after Tasks 4–6).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: delete exercise-picker.tsx — replaced by library-pick"
```

---

## Task 9: Final type-check + acceptance

- [ ] **Step 1: Full type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 2: Grep for any remaining exercise-picker or startAdd references**

```bash
grep -r "exercise-picker\|startAdd\|addContextLabel" app/ lib/ components/
```

Expected: no results (only `training-new.tsx` may still reference `startAdd` — that is intentionally out of scope).

- [ ] **Step 3: Manual acceptance check**

- [ ] Library tab (browse mode): exercises tab works, series tab works, filters work, `+` opens TrainingPickerSheet
- [ ] Library tab → exercise card → detail → "Zum Training hinzufügen" opens TrainingPickerSheet
- [ ] Training detail → "Hinzufügen" → opens library-pick in pick mode with correct title
- [ ] Library-pick → exercises tab: `+` adds directly, ✓ state appears, toast fires
- [ ] Library-pick → series tab: `+` adds series directly, toast fires
- [ ] Library-pick → tap exercise card → detail shows `Zu „[Training Name]"` CTA → adds directly
- [ ] Back from library-pick returns to training screen
- [ ] Player picker still works (uses remaining store multi-select — untouched)
- [ ] `training-new.tsx` exercise-add still works (intentionally left using old flow)

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore: picker unification complete — acceptance verified"
```
