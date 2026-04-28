# Series-to-New-Training Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make adding a Lernpfad to a *new* training work, fix the broken in-screen picker in `training-new`, and drop the mandatory-Spieler check.

**Architecture:** Introduce a third LibraryView container variant (`LibraryDraftPickerContainer`, no mutations) plus a dedicated `draftPickStore` Zustand store for the handoff between `training-new`, the new `library-pick-draft` route, and the existing detail screens. `training-new` keeps the picked items in local state and ships everything in a single `useCreateTraining` POST.

**Tech Stack:** Expo Router v4, React 19, Zustand v5, TanStack Query v5, NativeWind v4, Strapi v5 backend.

**Spec:** `docs/superpowers/specs/2026-04-28-series-to-new-training-design.md`

**Branch:** `feature/series-to-new-training` (already created from `main`)

---

## File Map

**Create:**
- `lib/store/draftPickStore.ts` — Zustand store for the draft-pick handoff
- `components/screens/LibraryDraftPickerContainer.tsx` — third LibraryView container, no mutations
- `app/library-pick-draft.tsx` — thin route wrapper

**Modify:**
- `lib/queries/useTrainings.ts` — extend `CreateTrainingInput` and the POST payload
- `components/sheets/TrainingPickerSheet.tsx` — pass `seriesName` + `exerciseIds` CSV when creating new training from a series
- `app/_layout.tsx` — register the `library-pick-draft` route
- `app/exercise-detail/[id].tsx` — three-mode branch (`draft-pick` / `training-pick` / `view`)
- `app/series-detail/[id].tsx` — three-mode branch
- `app/training-new.tsx` — full body rewrite: read URL params for series, render Inhalt section with `MethodicalSeriesBlock`, push to library-pick-draft, drop player-mandatory
- `lib/store/pickModeStore.ts` — strip `startAdd` legacy

**Test infrastructure:** This project has no automated tests. Every task uses TypeScript type-checking (`npx tsc --noEmit`) and a manual smoke test for verification. Final task pass-through covers the full feature flow.

---

## Task 1: Extend `useCreateTraining` with `methodicalSeriesIds`

**Files:**
- Modify: `lib/queries/useTrainings.ts:77-114`

**Why first:** No consumers yet; safe to deploy this in isolation. Later tasks will pass `methodicalSeriesIds` from `training-new`.

- [ ] **Step 1.1: Update `CreateTrainingInput` and the mutation body**

In `lib/queries/useTrainings.ts`, modify the `CreateTrainingInput` interface and the `useCreateTraining` mutation body so the POST connects both `exercises` and `methodicalSeries` in one request.

Replace the block at lines 77–114 with:

```typescript
interface CreateTrainingInput {
  name: string;
  date: string;
  exerciseIds: string[];
  methodicalSeriesIds: string[];
  playerIds: string[];
}

export const useCreateTraining = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clubId = user?.clubs?.[0]?.documentId;

  return useMutation({
    mutationFn: async (input: CreateTrainingInput) => {
      const { data } = await apiClient.post<StrapiResponse<Training>>('/trainings', {
        data: {
          Name: input.name,
          Date: input.date,
          training_status: 'draft',
          clubs: {
            connect: [{ documentId: clubId }],
          },
          exercises: {
            connect: input.exerciseIds.map((id) => ({ documentId: id })),
          },
          methodicalSeries: {
            connect: input.methodicalSeriesIds.map((id) => ({ documentId: id })),
          },
          players: {
            connect: input.playerIds.map((id) => ({ documentId: id })),
          },
        },
      });

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
  });
};
```

- [ ] **Step 1.2: TypeScript check**

Run: `npx tsc --noEmit`

Expected: there will be ONE pre-existing error about `app/training-new.tsx` because `CreateTrainingInput` is now stricter (training-new doesn't pass `methodicalSeriesIds` yet). Note it. Other code should still compile.

If you see compile errors elsewhere (e.g. another caller of `useCreateTraining`), fix them by passing `methodicalSeriesIds: []`.

- [ ] **Step 1.3: Commit**

```bash
git add lib/queries/useTrainings.ts
git commit -m "feat(training): accept methodicalSeriesIds in useCreateTraining

Single POST connects both exercises and methodicalSeries relations.
Caller in training-new.tsx will be updated to populate the new field."
```

---

## Task 2: Create `draftPickStore`

**Files:**
- Create: `lib/store/draftPickStore.ts`

- [ ] **Step 2.1: Write the store**

Create `lib/store/draftPickStore.ts` with the following:

```typescript
import { create } from 'zustand';

type OnAddExercise = (exerciseDocumentId: string) => void;
type OnAddSeries = (seriesDocumentId: string, exerciseDocumentIds: string[]) => void;

interface StartArgs {
  initialExerciseIds: string[];
  initialSeriesIds: string[];
  onAddExercise: OnAddExercise;
  onAddSeries: OnAddSeries;
}

interface DraftPickStore {
  active: boolean;
  initialExerciseIds: Set<string>;
  initialSeriesIds: Set<string>;
  addedExerciseIds: Set<string>;
  addedSeriesIds: Set<string>;
  onAddExercise?: OnAddExercise;
  onAddSeries?: OnAddSeries;

  startDraftPick: (args: StartArgs) => void;
  addExercise: (exerciseDocumentId: string) => void;
  addSeries: (seriesDocumentId: string, exerciseDocumentIds: string[]) => void;
  cancel: () => void;
}

const emptySet = <T,>() => new Set<T>();

export const useDraftPickStore = create<DraftPickStore>((set, get) => ({
  active: false,
  initialExerciseIds: emptySet<string>(),
  initialSeriesIds: emptySet<string>(),
  addedExerciseIds: emptySet<string>(),
  addedSeriesIds: emptySet<string>(),
  onAddExercise: undefined,
  onAddSeries: undefined,

  startDraftPick: ({ initialExerciseIds, initialSeriesIds, onAddExercise, onAddSeries }) =>
    set({
      active: true,
      initialExerciseIds: new Set(initialExerciseIds),
      initialSeriesIds: new Set(initialSeriesIds),
      addedExerciseIds: emptySet<string>(),
      addedSeriesIds: emptySet<string>(),
      onAddExercise,
      onAddSeries,
    }),

  addExercise: (exerciseDocumentId) => {
    const s = get();
    if (!s.active || !s.onAddExercise) return;
    s.onAddExercise(exerciseDocumentId);
    set({ addedExerciseIds: new Set(s.addedExerciseIds).add(exerciseDocumentId) });
  },

  addSeries: (seriesDocumentId, exerciseDocumentIds) => {
    const s = get();
    if (!s.active || !s.onAddSeries) return;
    s.onAddSeries(seriesDocumentId, exerciseDocumentIds);
    const nextEx = new Set(s.addedExerciseIds);
    exerciseDocumentIds.forEach((id) => nextEx.add(id));
    set({
      addedSeriesIds: new Set(s.addedSeriesIds).add(seriesDocumentId),
      addedExerciseIds: nextEx,
    });
  },

  cancel: () =>
    set({
      active: false,
      initialExerciseIds: emptySet<string>(),
      initialSeriesIds: emptySet<string>(),
      addedExerciseIds: emptySet<string>(),
      addedSeriesIds: emptySet<string>(),
      onAddExercise: undefined,
      onAddSeries: undefined,
    }),
}));
```

- [ ] **Step 2.2: TypeScript check**

Run: `npx tsc --noEmit`

Expected: only the pre-existing `training-new.tsx` error from Task 1. The new file should compile clean.

- [ ] **Step 2.3: Commit**

```bash
git add lib/store/draftPickStore.ts
git commit -m "feat(store): add draftPickStore for new-training pick handoff

Holds initialIds (parent state for checkmark seeding), addedIds (live during
session), and onAdd callbacks. Adders fire the callback and update the live
sets. cancel() resets everything."
```

---

## Task 3: Update `TrainingPickerSheet` to pass full series params

**Files:**
- Modify: `components/sheets/TrainingPickerSheet.tsx:89-97`

**Context:** Currently the "Neues Training" button only passes `preselectSeries=<id>` for a series. We need `seriesName` and `exerciseIds` CSV too, so `training-new` can render the `MethodicalSeriesBlock` immediately on mount without waiting for the series detail to load.

- [ ] **Step 3.1: Update `handleCreateNew`**

Replace the function in `components/sheets/TrainingPickerSheet.tsx` (lines 89–97):

```typescript
    const handleCreateNew = () => {
      if (!pickMode) return;
      sheetRef.current?.dismiss();
      if (pickMode.kind === 'exercise') {
        router.push(`/training-new?preselect=${encodeURIComponent(pickMode.exerciseId)}`);
      } else {
        const params = new URLSearchParams({
          preselectSeries: pickMode.seriesId,
          seriesName: pickMode.seriesName,
          exerciseIds: pickMode.exerciseIds.join(','),
        });
        router.push(`/training-new?${params.toString()}`);
      }
    };
```

- [ ] **Step 3.2: TypeScript check**

Run: `npx tsc --noEmit`

Expected: only the pre-existing `training-new.tsx` error.

- [ ] **Step 3.3: Commit**

```bash
git add components/sheets/TrainingPickerSheet.tsx
git commit -m "feat(picker): pass seriesName and exerciseIds when creating new training

Lets training-new render the MethodicalSeriesBlock on first paint instead
of waiting for a series-detail fetch."
```

---

## Task 4: Create `LibraryDraftPickerContainer`

**Files:**
- Create: `components/screens/LibraryDraftPickerContainer.tsx`

**Reference:** Mirror `components/screens/LibraryPickerContainer.tsx` but without mutations and without `useTrainingDetail`.

- [ ] **Step 4.1: Write the container**

Create `components/screens/LibraryDraftPickerContainer.tsx` with:

```typescript
import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LibraryView, LibraryTab } from './LibraryView';
import { collectTagNames, filterExercises } from './library-filters';
import {
  EMPTY_FILTERS,
  LibraryFilterState,
} from '@/components/sheets/LibraryFilterSheet';
import { useExercises } from '@/lib/queries/useExercises';
import { useMethodicalSeries } from '@/lib/queries/useMethodicalSeries';
import { useDraftPickStore } from '@/lib/store/draftPickStore';
import type { Exercise, MethodicalSeries } from '@/lib/types/models';

export function LibraryDraftPickerContainer() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('exercises');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LibraryFilterState>(EMPTY_FILTERS);
  const [refreshing, setRefreshing] = useState(false);

  const { data: exercises, isLoading: exercisesLoading } = useExercises(search);
  const { data: series, isLoading: seriesLoading } = useMethodicalSeries();
  const queryClient = useQueryClient();

  const {
    active,
    initialExerciseIds,
    initialSeriesIds,
    addedExerciseIds: liveAddedExerciseIds,
    addedSeriesIds: liveAddedSeriesIds,
    addExercise,
    addSeries,
  } = useDraftPickStore();

  // If someone navigates to this route without a startDraftPick call, bail back.
  useEffect(() => {
    if (!active) {
      if (__DEV__) console.warn('[LibraryDraftPickerContainer] mounted without active draft session');
      router.back();
    }
  }, [active]);

  const checkmarkExerciseIds = useMemo(() => {
    const u = new Set(initialExerciseIds);
    liveAddedExerciseIds.forEach((id) => u.add(id));
    return u;
  }, [initialExerciseIds, liveAddedExerciseIds]);

  const checkmarkSeriesIds = useMemo(() => {
    const u = new Set(initialSeriesIds);
    liveAddedSeriesIds.forEach((id) => u.add(id));
    return u;
  }, [initialSeriesIds, liveAddedSeriesIds]);

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

  const handleAddExercise = (ex: Exercise) => {
    if (checkmarkExerciseIds.has(ex.documentId)) return;
    addExercise(ex.documentId);
  };

  const handleAddSeries = (s: MethodicalSeries) => {
    if (checkmarkSeriesIds.has(s.documentId)) return;
    const exerciseDocumentIds = (s.exercises ?? []).map((ex) => ex.documentId);
    addSeries(s.documentId, exerciseDocumentIds);
  };

  return (
    <LibraryView
      pickHeader={{
        title: 'Hinzufügen',
        onClose: () => router.back(),
        onDone: () => router.back(),
      }}
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
      addedExerciseIds={checkmarkExerciseIds}
      addedSeriesIds={checkmarkSeriesIds}
      addingExerciseId={null}
      addingSeriesId={null}
      onAddExercise={handleAddExercise}
      onAddSeries={handleAddSeries}
      onPressExercise={(ex) =>
        router.push({
          pathname: '/exercise-detail/[id]',
          params: { id: ex.documentId },
        })
      }
      onPressSeries={(s) =>
        router.push({
          pathname: '/series-detail/[id]' as any,
          params: { id: s.documentId },
        })
      }
    />
  );
}
```

**Note:** `pickHeader.onClose` and `onDone` both call `router.back()` — there's only one logical "back" for this screen. The store stays alive (no `cancel()`) so the detail screens can still consume callbacks if user navigated to a detail. `cancel()` happens on `training-new` unmount.

- [ ] **Step 4.2: TypeScript check**

Run: `npx tsc --noEmit`

Expected: only the pre-existing `training-new.tsx` error.

- [ ] **Step 4.3: Commit**

```bash
git add components/screens/LibraryDraftPickerContainer.tsx
git commit -m "feat(library): add LibraryDraftPickerContainer (no-mutation variant)

Reads draftPickStore for callbacks and seeding. Add-actions fire
store actions which both invoke the parent callback and update local
addedIds for instant checkmark feedback."
```

---

## Task 5: Add `library-pick-draft` route

**Files:**
- Create: `app/library-pick-draft.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 5.1: Create the route file**

Create `app/library-pick-draft.tsx`:

```typescript
import { LibraryDraftPickerContainer } from '@/components/screens/LibraryDraftPickerContainer';

export default function LibraryPickDraftScreen() {
  return <LibraryDraftPickerContainer />;
}
```

- [ ] **Step 5.2: Register the route in `_layout.tsx`**

In `app/_layout.tsx`, after the existing `library-pick` Stack.Screen (around line 78), add a sibling for the draft route. Insert this right after the closing `/>` of the existing `library-pick` block:

```typescript
      <Stack.Screen
        name="library-pick-draft"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }}
      />
```

- [ ] **Step 5.3: TypeScript check**

Run: `npx tsc --noEmit`

Expected: same pre-existing `training-new.tsx` error. The route may produce a typed-routes warning the first time the dev server hasn't restarted yet (`'/library-pick-draft' as any` cast may be needed by callers if Expo Router's typed-routes don't pick it up — handle in Task 8 if so).

- [ ] **Step 5.4: Commit**

```bash
git add app/library-pick-draft.tsx app/_layout.tsx
git commit -m "feat(routes): add library-pick-draft route for no-trainingId flow"
```

---

## Task 6: Adapt `exercise-detail` for draft-pick mode

**Files:**
- Modify: `app/exercise-detail/[id].tsx`

**Goal:** When `draftPickStore.active` is true, the "Hinzufügen"-CTA fires the store's `addExercise` callback and dismisses, instead of running the API mutation.

- [ ] **Step 6.1: Replace the file body**

Open `app/exercise-detail/[id].tsx` and rewrite the imports + component. The key changes:
- Add `useDraftPickStore` import.
- Compute a `mode` flag: `'draft-pick' | 'training-pick' | 'view'`.
- Branch the CTA handler and label off `mode`.
- `addedExerciseIds` for the "Bereits hinzugefügt"-state comes from `draftPickStore` in draft-pick mode, otherwise from `pickSessionStore`.

Replace the entire file with:

```typescript
import { useRef, useState } from 'react';
import { Platform, View, Pressable } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Screen,
  Text,
  Card,
  Icon,
  Button,
  ExercisePills,
  SkeletonDetail,
  SkeletonLine,
} from '@/components/ui';
import { useExerciseDetail } from '@/lib/queries/useExercises';
import { useAddExerciseToTraining } from '@/lib/queries/useTrainings';
import { toast } from 'sonner-native';
import { usePickSessionStore } from '@/lib/store/pickSessionStore';
import { useDraftPickStore } from '@/lib/store/draftPickStore';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';

export default function ExerciseDetailScreen() {
  const { id, trainingId, trainingName, readOnly } = useLocalSearchParams<{
    id: string;
    trainingId?: string;
    trainingName?: string;
    readOnly?: string;
  }>();
  const { data: exercise, isLoading } = useExerciseDetail(id);
  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);
  const addExerciseMutation = useAddExerciseToTraining();
  const [adding, setAdding] = useState(false);
  const { addedExerciseIds: sessionAdded, markAdded } = usePickSessionStore();
  const draftActive = useDraftPickStore((s) => s.active);
  const draftAddedExerciseIds = useDraftPickStore((s) => s.addedExerciseIds);
  const draftInitialExerciseIds = useDraftPickStore((s) => s.initialExerciseIds);
  const draftAddExercise = useDraftPickStore((s) => s.addExercise);

  const mode: 'draft-pick' | 'training-pick' | 'view' =
    draftActive ? 'draft-pick' : trainingId ? 'training-pick' : 'view';

  const handleDirectAdd = async () => {
    if (!trainingId || !exercise || adding) return;
    setAdding(true);
    try {
      await addExerciseMutation.mutateAsync({ trainingId, exerciseId: exercise.documentId });
      markAdded(exercise.documentId);
      toast.success('Übung hinzugefügt');
      router.back();
    } catch {
      toast.error('Übung konnte nicht hinzugefügt werden');
    } finally {
      setAdding(false);
    }
  };

  const handleDraftAdd = () => {
    if (!exercise) return;
    draftAddExercise(exercise.documentId);
    toast.success('Übung hinzugefügt');
    router.back();
  };

  const headerOptions = {
    headerShown: true as const,
    title: 'Übung',
    headerLeft: () => (
      <Pressable onPress={() => router.back()} className="px-2 py-1" hitSlop={8}>
        <Icon
          name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
          size={22}
          color="foreground"
        />
      </Pressable>
    ),
    ...(mode !== 'view' ? {
      headerRight: () => (
        <Pressable
          onPress={() => router.dismissAll()}
          className="px-2 py-1"
          hitSlop={8}
        >
          <Text variant="subhead" weight="semibold" color="primary">Fertig</Text>
        </Pressable>
      ),
    } : {}),
  };

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <Screen scroll padding="base" edges={['bottom']}>
          <SkeletonDetail />
          <View className="mt-6">
            <SkeletonLine width="30%" height={20} className="mb-3" />
            <SkeletonLine width="100%" height={80} className="mb-4" />
            <SkeletonLine width="100%" height={80} />
          </View>
        </Screen>
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen padding="base" edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 items-center justify-center">
          <Text variant="footnote" color="muted">Übung nicht gefunden</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={headerOptions} />

      <Screen scroll padding="base" edges={['bottom']}>
        <Text variant="largeTitle" weight="bold" className="mb-3 mt-2">
          {exercise.Name}
        </Text>

        <View className="mb-5">
          <ExercisePills exercise={exercise} />
        </View>

        {(exercise.methodicalSeries?.length ?? 0) > 0 && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/series-detail/[id]' as any,
                params: trainingId
                  ? { id: exercise.methodicalSeries![0].documentId, trainingId, trainingName: trainingName ?? '' }
                  : { id: exercise.methodicalSeries![0].documentId },
              })
            }
            className="flex-row items-center gap-2 bg-primary/10 rounded-lg px-3 py-2 mb-5"
          >
            <Icon name="school-outline" size={16} color="primary" />
            <View className="flex-1">
              <Text variant="caption2" color="muted">Teil der Methodischen Reihe</Text>
              <Text variant="footnote" weight="semibold" color="primary">
                {exercise.methodicalSeries![0].name}
              </Text>
            </View>
            <Icon name="chevron-forward" size={14} color="primary" />
          </Pressable>
        )}

        {exercise.Description && (
          <>
            <Text variant="headline" className="mb-2">Beschreibung</Text>
            <Text variant="body" color="muted" className="mb-6">
              {exercise.Description}
            </Text>
          </>
        )}

        {exercise.Steps && exercise.Steps.length > 0 && (
          <>
            <Text variant="headline" className="mb-3">Anleitung</Text>
            {exercise.Steps.map((step: any, idx: number) => {
              const title = typeof step === 'string' ? step : step?.Name;
              const body = typeof step === 'string' ? null : step?.Description;
              return (
                <Card key={step?.id ?? idx} className="mb-3">
                  <View className="flex-row gap-3">
                    <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center">
                      <Text variant="caption1" weight="bold" color="primary">{idx + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text variant="body" weight="semibold" className="mb-1">{title}</Text>
                      {body && <Text variant="footnote" color="muted">{body}</Text>}
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {exercise.Hint && (
          <Card variant="outline" className="border-warning bg-warning/10 mt-2 mb-8">
            <View className="flex-row items-start gap-2">
              <Icon name="bulb-outline" color="warning" size={18} />
              <View className="flex-1">
                <Text variant="subhead" weight="semibold" color="warning" className="mb-1">
                  Trainer-Hinweis
                </Text>
                <Text variant="footnote" color="foreground">{exercise.Hint}</Text>
              </View>
            </View>
          </Card>
        )}
      </Screen>

      {!readOnly && (() => {
        const alreadyAdded =
          mode === 'draft-pick'
            ? draftAddedExerciseIds.has(exercise.documentId) || draftInitialExerciseIds.has(exercise.documentId)
            : mode === 'training-pick'
              ? sessionAdded.has(exercise.documentId)
              : false;
        return (
          <View className="px-5 py-3 border-t border-border bg-background">
            <Button
              size="lg"
              className="w-full"
              leftIcon={alreadyAdded ? 'checkmark' : 'add'}
              loading={adding}
              disabled={alreadyAdded}
              onPress={
                mode === 'draft-pick'
                  ? handleDraftAdd
                  : mode === 'training-pick'
                    ? handleDirectAdd
                    : () => trainingPickerRef.current?.present(exercise.documentId, exercise.Name)
              }
            >
              {alreadyAdded
                ? 'Bereits hinzugefügt'
                : mode === 'draft-pick'
                  ? 'Übung hinzufügen'
                  : mode === 'training-pick'
                    ? (trainingName ? `Übung zu „${trainingName}" hinzufügen` : 'Übung hinzufügen')
                    : 'Zum Training hinzufügen'}
            </Button>
          </View>
        );
      })()}

      <TrainingPickerSheet ref={trainingPickerRef} />
    </Screen>
  );
}
```

- [ ] **Step 6.2: TypeScript check**

Run: `npx tsc --noEmit`

Expected: only the pre-existing `training-new.tsx` error.

- [ ] **Step 6.3: Commit**

```bash
git add app/exercise-detail/[id].tsx
git commit -m "feat(exercise-detail): add draft-pick mode for new-training flow

Three modes now: draft-pick (callbacks), training-pick (mutation),
view (read-only). Mode determined once at top, CTA branches off it."
```

---

## Task 7: Adapt `series-detail` for draft-pick mode

**Files:**
- Modify: `app/series-detail/[id].tsx`

- [ ] **Step 7.1: Replace the file body**

Replace the entire `app/series-detail/[id].tsx` with:

```typescript
import { useRef, useState } from 'react';
import { Platform, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Screen,
  Text,
  Icon,
  SkeletonDetail,
  SkeletonList,
  Button,
} from '@/components/ui';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import { useMethodicalSeriesDetail } from '@/lib/queries/useMethodicalSeries';
import { useAddMethodicalSeriesToTraining, useAddExerciseToTraining } from '@/lib/queries/useTrainings';
import { toast } from 'sonner-native';
import { COLORS } from '@/lib/theme';
import { usePickSessionStore } from '@/lib/store/pickSessionStore';
import { useDraftPickStore } from '@/lib/store/draftPickStore';

export default function SeriesDetailScreen() {
  const { id, trainingId, trainingName } = useLocalSearchParams<{
    id: string;
    trainingId?: string;
    trainingName?: string;
  }>();
  const { data: series, isLoading } = useMethodicalSeriesDetail(id);
  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  const addSeriesMutation = useAddMethodicalSeriesToTraining();
  const addExerciseMutation = useAddExerciseToTraining();
  const [addingWholeSeries, setAddingWholeSeries] = useState(false);
  const [addingExerciseId, setAddingExerciseId] = useState<string | null>(null);
  const { addedExerciseIds: sessionExerciseIds, addedSeriesIds: sessionSeriesIds, markAdded, markSeriesAdded } = usePickSessionStore();

  const draftActive = useDraftPickStore((s) => s.active);
  const draftInitialExerciseIds = useDraftPickStore((s) => s.initialExerciseIds);
  const draftInitialSeriesIds = useDraftPickStore((s) => s.initialSeriesIds);
  const draftAddedExerciseIds = useDraftPickStore((s) => s.addedExerciseIds);
  const draftAddedSeriesIds = useDraftPickStore((s) => s.addedSeriesIds);
  const draftAddExercise = useDraftPickStore((s) => s.addExercise);
  const draftAddSeries = useDraftPickStore((s) => s.addSeries);

  const mode: 'draft-pick' | 'training-pick' | 'view' =
    draftActive ? 'draft-pick' : trainingId ? 'training-pick' : 'view';

  const isExerciseAdded = (exerciseId: string) =>
    mode === 'draft-pick'
      ? draftAddedExerciseIds.has(exerciseId) || draftInitialExerciseIds.has(exerciseId)
      : mode === 'training-pick'
        ? sessionExerciseIds.has(exerciseId)
        : false;

  const isSeriesAdded =
    mode === 'draft-pick'
      ? series ? draftAddedSeriesIds.has(series.documentId) || draftInitialSeriesIds.has(series.documentId) : false
      : mode === 'training-pick'
        ? series ? sessionSeriesIds.has(series.documentId) : false
        : false;

  const handleAddExercise = async (exerciseId: string, exerciseName: string) => {
    if (mode === 'draft-pick') {
      if (isExerciseAdded(exerciseId)) return;
      draftAddExercise(exerciseId);
      toast.success(`${exerciseName} hinzugefügt`);
      return;
    }
    if (mode !== 'training-pick' || !trainingId || addingExerciseId === exerciseId) return;
    setAddingExerciseId(exerciseId);
    try {
      await addExerciseMutation.mutateAsync({ trainingId, exerciseId });
      markAdded(exerciseId);
      toast.success(`${exerciseName} hinzugefügt`);
    } catch {
      toast.error('Übung konnte nicht hinzugefügt werden');
    } finally {
      setAddingExerciseId(null);
    }
  };

  const headerOptions = {
    headerShown: true as const,
    title: 'Lernpfad',
    headerLeft: () => (
      <Pressable onPress={() => router.back()} className="px-2 py-1" hitSlop={8}>
        <Icon
          name={Platform.OS === 'web' ? 'close' : 'chevron-back'}
          size={22}
          color="foreground"
        />
      </Pressable>
    ),
    ...(mode !== 'view' ? {
      headerRight: () => (
        <Pressable onPress={() => router.dismissAll()} className="px-2 py-1" hitSlop={8}>
          <Text variant="subhead" weight="semibold" color="primary">Fertig</Text>
        </Pressable>
      ),
    } : {}),
  };

  const handleAddWholeSeries = async () => {
    if (!series) return;
    if (mode === 'draft-pick') {
      if (isSeriesAdded) return;
      const exerciseDocumentIds = (series.exercises ?? []).map((ex) => ex.documentId);
      draftAddSeries(series.documentId, exerciseDocumentIds);
      toast.success('Lernpfad hinzugefügt');
      router.back();
      return;
    }
    if (mode !== 'training-pick' || !trainingId || addingWholeSeries) return;
    setAddingWholeSeries(true);
    try {
      const exerciseDocumentIds = (series.exercises ?? []).map((ex) => ex.documentId);
      await addSeriesMutation.mutateAsync({
        trainingId,
        seriesDocumentId: series.documentId,
        exerciseDocumentIds,
      });
      exerciseDocumentIds.forEach(markAdded);
      markSeriesAdded(series.documentId);
      toast.success('Lernpfad hinzugefügt');
      router.dismissAll();
    } catch {
      toast.error('Lernpfad konnte nicht hinzugefügt werden');
    } finally {
      setAddingWholeSeries(false);
    }
  };

  if (isLoading) {
    return (
      <Screen scroll padding="base" edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View className="pt-14">
          <SkeletonDetail />
          <View className="mt-6">
            <SkeletonList count={4} />
          </View>
        </View>
      </Screen>
    );
  }

  if (!series) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View className="flex-1 items-center justify-center">
          <Icon name="list-outline" size={40} color="muted" />
          <Text variant="footnote" color="muted" className="mt-3">
            Lernpfad nicht gefunden
          </Text>
        </View>
      </Screen>
    );
  }

  const exerciseIds = (series.exercises ?? []).map((ex) => ex.documentId);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={headerOptions} />

      <Screen scroll edges={[]}>

      {/* Hero */}
      <View className="bg-card px-5 pt-5 pb-6 border-b border-border">
        <View className="w-12 h-12 rounded-full bg-primary/15 items-center justify-center mb-4">
          <Icon name="school-outline" size={26} color="primary" />
        </View>

        {series.category ? (
          <View className="self-start bg-amber-500/25 border border-amber-400/50 rounded-md px-2 py-1 mb-2">
            <Text variant="caption2" className="text-amber-300 font-bold uppercase tracking-widest">
              {series.category}
            </Text>
          </View>
        ) : null}

        <Text variant="largeTitle" weight="bold" className="mb-1">
          {series.name}
        </Text>

        {series.goal ? (
          <View className="bg-surface-1 rounded-lg px-3 py-2 mt-2">
            <Text variant="caption1" weight="semibold" color="muted" className="mb-1">
              Ziel
            </Text>
            <Text variant="footnote">{series.goal}</Text>
          </View>
        ) : null}

        {series.description ? (
          <Text variant="footnote" className="mt-3" color="muted">
            {series.description}
          </Text>
        ) : null}
      </View>

      {/* Exercise list */}
      <View className="px-5 pt-4 pb-4">
        <Text variant="headline" weight="semibold" className="mb-3">
          {series.exercises?.length ?? 0} Übungen
        </Text>

        {(series.exercises ?? []).map((ex, idx) => (
            <Pressable
              key={ex.documentId}
              onPress={() =>
                router.push({
                  pathname: '/exercise-detail/[id]',
                  params: mode === 'training-pick'
                    ? { id: ex.documentId, trainingId, trainingName: trainingName ?? '' }
                    : { id: ex.documentId },
                })
              }
              className="flex-row items-center gap-3 mb-3 bg-card border border-border rounded-xl px-3 py-3 active:opacity-80"
            >
              <View className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center shrink-0">
                <Text variant="caption2" weight="bold" color="primary">
                  {idx + 1}
                </Text>
              </View>
              <Text variant="subhead" className="flex-1" numberOfLines={2}>
                {ex.Name}
              </Text>
              {(() => {
                const isAdded = isExerciseAdded(ex.documentId);
                const isAdding = addingExerciseId === ex.documentId;
                return (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      if (isAdded || isAdding) return;
                      if (mode === 'view') {
                        trainingPickerRef.current?.present(ex.documentId, ex.Name);
                      } else {
                        handleAddExercise(ex.documentId, ex.Name);
                      }
                    }}
                    hitSlop={10}
                    disabled={isAdded || isAdding}
                    className={
                      isAdded
                        ? 'w-9 h-9 rounded-full bg-success/15 items-center justify-center shrink-0'
                        : 'w-9 h-9 rounded-full bg-primary/15 items-center justify-center shrink-0'
                    }
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Icon name={isAdded ? 'checkmark' : 'add'} size={18} color={isAdded ? 'success' : 'primary'} />
                    )}
                  </Pressable>
                );
              })()}
            </Pressable>
        ))}
      </View>

      </Screen>

      {(() => {
        return (
          <View className="px-5 py-3 border-t border-border bg-background">
            <Button
              size="lg"
              className="w-full"
              leftIcon={isSeriesAdded ? 'checkmark' : 'add'}
              loading={addingWholeSeries}
              disabled={isSeriesAdded}
              onPress={
                mode === 'view'
                  ? () => trainingPickerRef.current?.presentSeries(series.documentId, series.name, exerciseIds)
                  : handleAddWholeSeries
              }
            >
              {isSeriesAdded
                ? 'Bereits hinzugefügt'
                : mode === 'draft-pick'
                  ? 'Lernpfad hinzufügen'
                  : mode === 'training-pick'
                    ? (trainingName ? `Lernpfad zu „${trainingName}" hinzufügen` : 'Lernpfad hinzufügen')
                    : 'Ganze Reihe hinzufügen'}
            </Button>
          </View>
        );
      })()}

      {mode === 'view' && <TrainingPickerSheet ref={trainingPickerRef} />}
    </Screen>
  );
}
```

- [ ] **Step 7.2: TypeScript check**

Run: `npx tsc --noEmit`

Expected: only the pre-existing `training-new.tsx` error.

- [ ] **Step 7.3: Commit**

```bash
git add app/series-detail/[id].tsx
git commit -m "feat(series-detail): add draft-pick mode for new-training flow

Both whole-series-add CTA and per-exercise + buttons branch on mode:
draft-pick fires draftPickStore actions, training-pick mutates,
view shows TrainingPickerSheet."
```

---

## Task 8: Rewrite `training-new.tsx`

**Files:**
- Modify: `app/training-new.tsx`

**Goals:**
- Read `preselect`, `preselectSeries`, `seriesName`, `exerciseIds` URL params.
- Local state for `seriesIds` + `seriesNameMap` (and existing `exerciseIds`, `playerIds`).
- "Inhalt"-Sektion: render `MethodicalSeriesBlock` for each series, then standalone exercise cards. Mirror the structure of `app/(tabs)/trainings/[id]/index.tsx:170-244`.
- "Auswählen"-Button: `draftPickStore.startDraftPick(...)` then `router.push('/library-pick-draft' as any)`.
- Spieler optional: `canCreate = name.trim().length > 0 && exerciseIds.length > 0`.
- Submit: pass `methodicalSeriesIds: seriesIds` to `useCreateTraining`.
- Cleanup: `useEffect` returns a cleanup that calls `draftPickStore.cancel()` on unmount.

- [ ] **Step 8.1: Replace the file body**

Replace the entire `app/training-new.tsx` with:

```typescript
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import {
  Screen,
  Text,
  Button,
  Card,
  toast,
  Icon,
  MethodicalSeriesBlock,
} from '@/components/ui';
import { useDraftPickStore } from '@/lib/store/draftPickStore';
import { useCreateTraining } from '@/lib/queries/useTrainings';
import { useExercises } from '@/lib/queries/useExercises';
import { useMethodicalSeries } from '@/lib/queries/useMethodicalSeries';
import { usePlayers } from '@/lib/queries/usePlayers';
import { usePickModeStore } from '@/lib/store/pickModeStore';

export default function NewTrainingScreen() {
  const params = useLocalSearchParams<{
    preselect?: string;
    preselectSeries?: string;
    seriesName?: string;
    exerciseIds?: string;
  }>();

  const initialExerciseIds = useMemo(() => {
    const ids: string[] = [];
    if (params.preselect) ids.push(params.preselect);
    if (params.exerciseIds) {
      params.exerciseIds.split(',').filter(Boolean).forEach((id) => {
        if (!ids.includes(id)) ids.push(id);
      });
    }
    return ids;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- URL params are read once at mount

  const initialSeriesIds = useMemo(() => {
    return params.preselectSeries ? [params.preselectSeries] : [];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseIds, setExerciseIds] = useState<string[]>(initialExerciseIds);
  const [seriesIds, setSeriesIds] = useState<string[]>(initialSeriesIds);
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const createTraining = useCreateTraining();

  const { data: allExercises } = useExercises('');
  const { data: allSeries } = useMethodicalSeries();
  const { data: allPlayers } = usePlayers();

  // Cleanup the draft pick store when the screen unmounts (e.g., user submits or aborts).
  useEffect(() => {
    return () => useDraftPickStore.getState().cancel();
  }, []);

  const exercisesById = useMemo(
    () => new Map((allExercises ?? []).map((ex: any) => [ex.documentId, ex])),
    [allExercises],
  );
  const seriesById = useMemo(
    () => new Map((allSeries ?? []).map((s: any) => [s.documentId, s])),
    [allSeries],
  );

  const selectedSeries = useMemo(
    () => seriesIds.map((id) => seriesById.get(id)).filter(Boolean) as any[],
    [seriesById, seriesIds],
  );

  const selectedExercises = useMemo(
    () => exerciseIds.map((id) => exercisesById.get(id)).filter(Boolean) as any[],
    [exercisesById, exerciseIds],
  );

  const seriesIdSet = useMemo(() => new Set(seriesIds), [seriesIds]);

  const exercisesBySeries = useMemo(() => {
    const map = new Map<string, any[]>();
    selectedExercises.forEach((ex) => {
      const seriesRef = ex.methodicalSeries?.find((s: any) => seriesIdSet.has(s.documentId));
      if (seriesRef) {
        const list = map.get(seriesRef.documentId) ?? [];
        list.push(ex);
        map.set(seriesRef.documentId, list);
      }
    });
    return map;
  }, [selectedExercises, seriesIdSet]);

  const standaloneExercises = useMemo(
    () => selectedExercises.filter(
      (ex) => !ex.methodicalSeries?.some((s: any) => seriesIdSet.has(s.documentId)),
    ),
    [selectedExercises, seriesIdSet],
  );

  const removeSeries = (seriesDocumentId: string) => {
    const seriesExercises = exercisesBySeries.get(seriesDocumentId) ?? [];
    const seriesExerciseIds = new Set(seriesExercises.map((ex) => ex.documentId));
    setSeriesIds((prev) => prev.filter((id) => id !== seriesDocumentId));
    setExerciseIds((prev) => prev.filter((id) => !seriesExerciseIds.has(id)));
  };

  const removeExercise = (exerciseDocumentId: string) =>
    setExerciseIds((prev) => prev.filter((x) => x !== exerciseDocumentId));

  const confirmRemoveStandalone = (exerciseId: string, exerciseName: string) => {
    const msg = `"${exerciseName}" entfernen?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) removeExercise(exerciseId);
      return;
    }
    Alert.alert('Übung entfernen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: () => removeExercise(exerciseId) },
    ]);
  };

  const selectedPlayers = useMemo(() => {
    const byId = new Map((allPlayers ?? []).map((p: any) => [p.documentId, p]));
    return playerIds.map((id) => byId.get(id)).filter(Boolean) as any[];
  }, [allPlayers, playerIds]);

  const removePlayer = (id: string) =>
    setPlayerIds((prev) => prev.filter((x) => x !== id));

  const canCreate = name.trim().length > 0 && exerciseIds.length > 0;

  const handleOpenPicker = () => {
    useDraftPickStore.getState().startDraftPick({
      initialExerciseIds: exerciseIds,
      initialSeriesIds: seriesIds,
      onAddExercise: (id) =>
        setExerciseIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      onAddSeries: (sid, exIds) => {
        setSeriesIds((prev) => (prev.includes(sid) ? prev : [...prev, sid]));
        setExerciseIds((prev) => {
          const next = [...prev];
          exIds.forEach((id) => {
            if (!next.includes(id)) next.push(id);
          });
          return next;
        });
      },
    });
    router.push('/library-pick-draft' as any);
  };

  const handleOpenPlayerPicker = () => {
    usePickModeStore.getState().start(playerIds, setPlayerIds);
    router.push('/player-picker');
  };

  const handleCreate = () => {
    createTraining.mutate(
      { name, date, exerciseIds, methodicalSeriesIds: seriesIds, playerIds },
      {
        onSuccess: () => {
          router.back();
          toast.success('Training erstellt');
        },
        onError: () => toast.error('Training konnte nicht erstellt werden'),
      }
    );
  };

  const totalContentCount = exerciseIds.length;

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Training erstellen',
          headerBackTitle: 'Abbrechen',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-5">
            <Text variant="subhead" weight="semibold" className="mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="z.B. Jugendtraining"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-5">
            <Text variant="subhead" weight="semibold" className="mb-2">Datum</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text variant="subhead" weight="semibold">
                Übungen ({totalContentCount})
              </Text>
              <Button
                variant="ghost"
                size="sm"
                leftIcon="search-outline"
                onPress={handleOpenPicker}
              >
                Auswählen
              </Button>
            </View>

            {totalContentCount === 0 && (
              <Text variant="footnote" color="muted">Noch keine Übungen gewählt</Text>
            )}

            {selectedSeries.map((s) => {
              const blockExercises = exercisesBySeries.get(s.documentId) ?? [];
              return (
                <MethodicalSeriesBlock
                  key={s.documentId}
                  series={s}
                  blockExercises={blockExercises}
                  totalInSeries={blockExercises.length}
                  mode="edit"
                  onNavigateToDetail={() => router.push({ pathname: '/series-detail/[id]' as any, params: { id: s.documentId } })}
                  onNavigateToExercise={(exId) => router.push({ pathname: '/exercise-detail/[id]', params: { id: exId, readOnly: '1' } })}
                  onRemoveSeries={() => removeSeries(s.documentId)}
                  onRemoveExercise={(exerciseId) => removeExercise(exerciseId)}
                />
              );
            })}

            {standaloneExercises.map((exercise) => (
              <Card key={exercise.documentId} className="mb-3 flex-row items-center">
                <Pressable
                  onPress={() => router.push({ pathname: '/exercise-detail/[id]', params: { id: exercise.documentId, readOnly: '1' } })}
                  className="flex-1 flex-row justify-between items-start"
                >
                  <Text variant="subhead" weight="semibold" className="flex-1 mr-2">
                    {exercise.Name}
                  </Text>
                  <Text variant="caption1" color="muted">{exercise.Minutes} Min</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmRemoveStandalone(exercise.documentId, exercise.Name)}
                  hitSlop={8}
                  className="ml-3 w-11 h-11 rounded-full bg-destructive/10 items-center justify-center active:opacity-70"
                >
                  <Icon name="close" size={20} color="destructive" />
                </Pressable>
              </Card>
            ))}
          </View>

          <View className="mb-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text variant="subhead" weight="semibold">
                Spieler ({playerIds.length})
              </Text>
              <Button
                variant="ghost"
                size="sm"
                leftIcon="search-outline"
                onPress={handleOpenPlayerPicker}
              >
                Auswählen
              </Button>
            </View>

            {playerIds.length === 0 && (
              <Text variant="footnote" color="muted">Noch keine Spieler gewählt (optional)</Text>
            )}

            {selectedPlayers.map((p) => {
              const label = [p.firstname, p.Name].filter(Boolean).join(' ') || 'Spieler';
              return (
                <View
                  key={p.documentId}
                  className="flex-row items-center py-2 border-b border-border"
                >
                  <Text variant="footnote" className="flex-1" numberOfLines={1}>
                    {label}
                  </Text>
                  <Pressable
                    onPress={() => removePlayer(p.documentId)}
                    hitSlop={8}
                    className="w-10 h-10 items-center justify-center"
                  >
                    <Icon name="close" size={20} color="muted" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-5 pt-3 pb-4 border-t border-border bg-background">
          <Button
            size="lg"
            className="w-full"
            loading={createTraining.isPending}
            disabled={!canCreate}
            onPress={handleCreate}
          >
            Training erstellen
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
```

- [ ] **Step 8.2: Verify `MethodicalSeriesBlock` is exported from `@/components/ui`**

Run: `grep -n "MethodicalSeriesBlock" components/ui/index.ts`

If the symbol is exported (output shows the line), proceed. If not (no output), add it:

```typescript
// In components/ui/index.ts, alongside the other exports:
export { MethodicalSeriesBlock } from './MethodicalSeriesBlock';
```

- [ ] **Step 8.3: TypeScript check**

Run: `npx tsc --noEmit`

Expected: clean compile. The pre-existing error from Task 1 should now be gone (training-new now passes `methodicalSeriesIds`).

If you get a typed-routes error on `/library-pick-draft`, that's expected — Expo Router's typed routes need the dev server to regenerate. The `as any` cast on the `router.push` call handles it.

- [ ] **Step 8.4: Commit**

```bash
git add app/training-new.tsx components/ui/index.ts
git commit -m "feat(training-new): support series preselect, in-screen draft picker, optional Spieler

- Reads preselectSeries+seriesName+exerciseIds URL params
- Renders MethodicalSeriesBlock per selected series + standalone exercise cards
- 'Auswählen' button starts a draftPickStore session and pushes /library-pick-draft
- Spieler is no longer required for canCreate
- Submits exerciseIds + methodicalSeriesIds in a single useCreateTraining call
- Cleanup on unmount cancels the draft pick store"
```

---

## Task 9: Strip legacy `startAdd` from `pickModeStore`

**Files:**
- Modify: `lib/store/pickModeStore.ts`

**Why now:** `training-new` no longer references `startAdd`. The store can shrink to multi-select-only.

- [ ] **Step 9.1: Replace the file**

Replace `lib/store/pickModeStore.ts` with:

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
    set({ active: true, selectedIds: initial, onConfirm }),

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

  cancel: () => set({ active: false, selectedIds: [], onConfirm: undefined }),
}));
```

- [ ] **Step 9.2: TypeScript check**

Run: `npx tsc --noEmit`

Expected: clean compile. If anything else still referenced `startAdd` or `onAdd`, the compiler will surface it now.

- [ ] **Step 9.3: Search for stale references**

Run: `grep -rn "startAdd" lib/ app/ components/ 2>/dev/null`

Expected: no matches.

Then: `grep -rn "OnAddCallback" lib/ app/ components/ 2>/dev/null`

Expected: no matches. (If something else still uses the old type alias, surface it now.)

- [ ] **Step 9.4: Commit**

```bash
git add lib/store/pickModeStore.ts
git commit -m "refactor(pick-mode-store): drop legacy startAdd/onAdd

Single-add flow migrated to draftPickStore. pickModeStore now does only
multi-select confirm (used by player-picker)."
```

---

## Task 10: Update CLAUDE.md architecture notes

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 10.1: Add section about draftPickStore + draft container**

Open `CLAUDE.md`. Find the section "Library View + Container split (shipped 2026-04-28)" (around line 18). Below the existing description of `pickSessionStore`, add this paragraph:

```markdown

**Draft-pick state:** When creating a *new* training (`training-new.tsx`), the picker uses `lib/store/draftPickStore.ts` instead of mutations. `LibraryDraftPickerContainer` reads `initialExerciseIds`/`initialSeriesIds` (seeded by `training-new` from its local state) for checkmarks, and adds fire `addExercise`/`addSeries` actions on the store, which call back to `training-new`. Cancellation happens on `training-new` unmount; the store stays alive while the user is in `library-pick-draft` or a detail screen so callbacks remain consumable.

`exercise-detail` and `series-detail` have three modes: `draft-pick` (fires draft store callbacks), `training-pick` (mutates), `view` (read-only with `TrainingPickerSheet` for "Add to training"). Mode is computed once at the top of the file from `draftPickStore.active` + the `trainingId` URL param.
```

- [ ] **Step 10.2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude.md): document draftPickStore and 3-mode detail screens"
```

---

## Task 11: Manual smoke test

**Goal:** Run through every flow in the spec's Test Plan section. No code changes — just verify the implementation works end-to-end.

- [ ] **Step 11.1: Start dev server**

```bash
npx expo start --clear
```

Open on iOS simulator (or physical device).

- [ ] **Step 11.2: Run the Pflichtflows checklist**

For each item, manually exercise the flow and confirm the expected behavior. Check off in the spec or jot results:

- [ ] Library-Tab → Übung-Card `+` → TrainingPickerSheet → "Neues Training" → preselect-Übung sichtbar im Form, Erstellen funktioniert
- [ ] Library-Tab → Series-Card `+` → TrainingPickerSheet → "Neues Training" → preselectSeries: Series + alle ihre Übungen sichtbar als `MethodicalSeriesBlock`, Erstellen connectet beides im Backend
- [ ] training-new → "Auswählen" → library-pick-draft öffnet → +Übung, +Series funktioniert mit Checkmarks → Fertig → zurück, neue Items im Form
- [ ] In library-pick-draft: Card-Tap → exercise-detail → "Hinzufügen"-CTA → schließt zurück, Übung im training-new
- [ ] In library-pick-draft: Card-Tap → series-detail → "Hinzufügen"-CTA → schließt zurück, Series + Übungen im training-new
- [ ] In library-pick-draft → series-detail → einzelne Übung mit `+` adden → Übung im training-new (ohne Series)
- [ ] training-new ohne Spieler erstellbar (canCreate erfüllt mit nur Name + 1 Übung)
- [ ] X-Button auf `MethodicalSeriesBlock` in training-new entfernt Series + dazugehörige Übungen aus lokalem State
- [ ] X-Button auf Standalone-Übung entfernt nur diese
- [ ] Hardware-Back aus library-pick-draft → kommt zurück zu training-new ohne Crash, Form-State intakt
- [ ] "Abbrechen" auf training-new → keine Backend-Spuren (im Strapi-Admin verifizieren: kein Draft mit dem getesteten Namen entstanden)

- [ ] **Step 11.3: Run regression checklist**

- [ ] Existing-training-pick (von einem bestehenden Training aus Library hinzufügen) funktioniert noch — keine Mutationen-Regression
- [ ] Player-Picker (Multi-Select) funktioniert noch — `pickModeStore.start` Pfad
- [ ] Library-Browse-Mode (Tab) funktioniert noch — `LibraryBrowseContainer`
- [ ] exercise-detail aus Library-Tab geöffnet (no trainingId, no draft) → kein Add-CTA, nur read-only? (Korrektur: CTA "Zum Training hinzufügen" via `TrainingPickerSheet` ist erwartet — das ist der `view`-Modus, keine Regression)
- [ ] series-detail aus existing-training-pick → Add-CTA mutate-mode (alter Pfad)

- [ ] **Step 11.4: Move plan to completed and commit**

```bash
git mv docs/superpowers/plans/2026-04-28-series-to-new-training.md docs/superpowers/plans/completed/
git commit -m "docs: mark series-to-new-training plan as completed"
```

- [ ] **Step 11.5: Update roadmap**

Open `docs/superpowers/roadmap.md`. Find item X "Series-to-New-Training". Mark as shipped, link to spec/plan, list what shipped.

Replace the section (around lines 69-77) with:

```markdown
### ✅ X. Series-to-New-Training — SHIPPED 2026-04-28

**Docs:**
- Spec: `specs/2026-04-28-series-to-new-training-design.md`
- Plan: `plans/completed/2026-04-28-series-to-new-training.md`

**Was shipped:**
- ✅ `app/library-pick-draft.tsx` — neuer Route für draft-mode-Picker
- ✅ `components/screens/LibraryDraftPickerContainer.tsx` — dritte LibraryView-Container-Variante (no mutations)
- ✅ `lib/store/draftPickStore.ts` — Zustand-Store für training-new ↔ Picker-Handoff
- ✅ `app/training-new.tsx` — komplettes Body-Rewrite: liest `preselectSeries`-Param, rendert `MethodicalSeriesBlock`-basierte Inhalt-Sektion, Auswählen-Button öffnet draft-Picker, Spieler nicht mehr mandatory
- ✅ `app/exercise-detail/[id].tsx` + `app/series-detail/[id].tsx` — drei Modi (`draft-pick` / `training-pick` / `view`)
- ✅ `useCreateTraining` — akzeptiert `methodicalSeriesIds`, single POST connectet beide Relationen
- ✅ `pickModeStore` — Legacy `startAdd` entfernt
```

```bash
git add docs/superpowers/roadmap.md
git commit -m "docs(roadmap): mark series-to-new-training as shipped"
```

---

## Done criteria

- All TypeScript compiles cleanly: `npx tsc --noEmit` succeeds.
- All Pflichtflows in Step 11.2 pass on iOS.
- All regression checks in Step 11.3 pass.
- Branch has 11 commits matching the task structure.
- Plan moved to `plans/completed/`.
- Roadmap updated.
- No `startAdd` / `onAdd` references remain in the codebase outside test/doc files.
