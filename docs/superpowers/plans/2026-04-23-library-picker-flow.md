# Library-Picker Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Library tab into a dual-role screen (browse + pick-mode) that replaces the broken `ExercisePickerSheet`, add a `TrainingPickerSheet` for single-exercise-add flows, and redesign `/trainings/new` with inline selection lists. A Zustand store carries the pick-mode state across route transitions.

**Architecture:** Route-param `?mode=pick` on `/library` triggers the picker-mode rendering path. A Zustand store `usePickModeStore` owns `selectedIds` and the `onConfirm` callback passed by the caller. The library card list renders checkmarks instead of the `+` button while in pick-mode and disables detail-navigation. Filters (Fokus/Schwierigkeit/Dauer) live locally in the library screen and work in both modes. For single-exercise-add, a `TrainingPickerSheet` shows draft/in-progress trainings plus a "Neues Training erstellen" option that navigates to `/trainings/new?preselect=<id>&returnTo=library`.

**Tech Stack:** Expo SDK 54 · React Native 0.81 · NativeWind v4 · `@tanstack/react-query` · `expo-router` · `@gorhom/bottom-sheet` · `zustand@^5.0.12` · `sonner-native` · `@expo/vector-icons/Ionicons`.

**Testing approach:** Repo has no test runner. Validation is `npx tsc --noEmit` after every change plus manual flow-testing on Expo Web + Expo Go iOS. No unit tests added in this plan.

**Branch:** `feature/library-picker` (branch from `main` after `feature/sp-polish` has been merged — if not merged yet, branch from `feature/sp-polish` instead and rebase later).

---

## Pre-conditions

- SP-Polish merged into `main`, OR branching from `feature/sp-polish` with `git log --oneline | head -5` showing `8a05ae2 docs(ui-thoughts)...` or newer at the tip.
- Working tree clean (`git status` shows nothing).
- `npx tsc --noEmit` returns zero errors.
- `zustand@^5.0.12` already in `package.json` (verified).
- `COLORS` module exists at `lib/theme.ts` with `primary`, `muted`, etc.
- `ExerciseCard`, `Text`, `Icon`, `Button`, `Card`, `BottomSheet`, `toast` all exported from `@/components/ui`.
- `useExercises(search)`, `useExerciseDetail(id)`, `usePlayers()` already exist in `lib/queries/`.
- `useAddExerciseToTraining`, `useCreateTraining`, `useTrainings` already exist in `lib/queries/useTrainings.ts`.

Verify:
```bash
git status                  # Expected: clean
npx tsc --noEmit            # Expected: no output
grep zustand package.json   # Expected: "zustand": "^5.0.12"
```

---

## File Structure

**New:**
```
lib/store/pickModeStore.ts
components/sheets/TrainingPickerSheet.tsx
components/sheets/LibraryFilterSheet.tsx
components/ui/FilterChip.tsx
```

**Modified:**
```
app/(tabs)/library/_layout.tsx         # pick-mode aware back/close behavior
app/(tabs)/library/index.tsx           # filter row, pick-mode rendering, "+"-button, Fertig header
app/(tabs)/library/[id].tsx            # add fixed bottom CTA "+ Zum Training hinzufügen"
app/(tabs)/trainings/new.tsx           # inline lists, preselect/returnTo params, Library-pick-mode nav
components/ui/index.ts                 # export FilterChip
```

**Deleted:**
```
components/sheets/ExercisePickerSheet.tsx
```

---

## Phase 1 · Foundation

### Task 1.1 · Create branch

- [ ] **Step 1: Verify clean tree and typecheck**

Run:
```bash
git status
npx tsc --noEmit
```

Both must be clean before continuing.

- [ ] **Step 2: Create and switch to branch**

If `main` contains the SP-Polish merge:
```bash
git checkout main
git pull
git checkout -b feature/library-picker
```

If SP-Polish hasn't been merged yet:
```bash
git checkout feature/sp-polish
git checkout -b feature/library-picker
```

Verify:
```bash
git branch --show-current   # Expected: feature/library-picker
```

---

### Task 1.2 · Zustand pick-mode store

**Files:**
- Create: `lib/store/pickModeStore.ts`

- [ ] **Step 1: Create the store file**

Write `lib/store/pickModeStore.ts`:

```ts
import { create } from 'zustand';

type OnConfirmCallback = (ids: string[]) => void;

interface PickModeStore {
  /** True while a caller has initiated pick-mode and the Library has not yet confirmed or cancelled. */
  active: boolean;
  /** Currently toggled ids — mutated by the Library on each tap. */
  selectedIds: string[];
  /** Callback that receives the final selection on confirm. Set by the caller via start(). */
  onConfirm?: OnConfirmCallback;

  start: (initial: string[], onConfirm: OnConfirmCallback) => void;
  toggle: (id: string) => void;
  confirm: () => void;
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

  confirm: () => {
    const { onConfirm, selectedIds } = get();
    onConfirm?.(selectedIds);
    set({ active: false, selectedIds: [], onConfirm: undefined });
  },

  cancel: () => set({ active: false, selectedIds: [], onConfirm: undefined }),
}));
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/store/pickModeStore.ts
git commit -m "feat(store): add pickModeStore for cross-screen selection state"
```

---

## Phase 2 · Library Pick-Mode

### Task 2.1 · Library index detects pick-mode + renders checkmarks + Fertig header

**Files:**
- Modify: `app/(tabs)/library/index.tsx`

This task wires pick-mode end-to-end for the Library list. In pick-mode:
- Header-right shows `Fertig (N)` — tap triggers `store.confirm()` + `router.back()`
- Card-onPress toggles selection via `store.toggle(id)` instead of navigating to detail
- Trailing shows a checkmark icon (ausgewählt/nicht) instead of the `+` button
- Cancel path: swipe-back / back chevron triggers `store.cancel()`

- [ ] **Step 1: Read current file** to preserve existing header, search, and FlatList structure

- [ ] **Step 2: Rewrite library/index.tsx**

```tsx
import { useState, useCallback } from 'react';
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
import { Screen, Text, ExerciseCard, Icon } from '@/components/ui';
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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Pressable onPress={Keyboard.dismiss} className="flex-1">
          <FlatList
            data={exercises ?? []}
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
                    ) : undefined
                  }
                />
              );
            }}
          />
        </Pressable>
      )}
    </Screen>
  );
}
```

Note: `useFocusEffect` cleanup runs when the screen loses focus (swipe-back, tab-switch away). We call `cancel()` to release the store. If the user actually tapped Fertig, `confirm()` already cleared the store and `cancel()` has no effect (already inactive).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/library/index.tsx
git commit -m "feat(library): pick-mode via ?mode=pick with checkmarks and Fertig header"
```

---

## Phase 3 · TrainingPickerSheet

### Task 3.1 · TrainingPickerSheet component

**Files:**
- Create: `components/sheets/TrainingPickerSheet.tsx`

This sheet is used by the library (both list `+` button and detail-screen CTA) to add a single exercise to an existing draft/in-progress training, or to create a new one.

- [ ] **Step 1: Create the file**

```tsx
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  BottomSheet,
  BottomSheetRef,
  Text,
  Icon,
  toast,
} from '@/components/ui';
import {
  useTrainings,
  useAddExerciseToTraining,
} from '@/lib/queries/useTrainings';
import type { Training } from '@/lib/types/models';

export interface TrainingPickerSheetRef {
  present: (exerciseId: string, exerciseName: string) => void;
}

type Props = Record<string, never>;

export const TrainingPickerSheet = forwardRef<TrainingPickerSheetRef, Props>(
  function TrainingPickerSheet(_, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [exerciseId, setExerciseId] = useState<string | null>(null);
    const [exerciseName, setExerciseName] = useState<string>('');
    const { data: trainings } = useTrainings();
    const addExercise = useAddExerciseToTraining();

    useImperativeHandle(ref, () => ({
      present: (id: string, name: string) => {
        setExerciseId(id);
        setExerciseName(name);
        sheetRef.current?.present();
      },
    }));

    const openTrainings = useMemo(
      () =>
        (trainings ?? [])
          .filter(
            (t) => t.training_status === 'draft' || t.training_status === 'in_progress'
          )
          .sort(
            (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
          ),
      [trainings]
    );

    const handleAddToExisting = async (trainingId: string, trainingName: string) => {
      if (!exerciseId) return;
      try {
        await addExercise.mutateAsync({ trainingId, exerciseId });
        toast.success(`Zu "${trainingName}" hinzugefügt`);
        sheetRef.current?.dismiss();
      } catch {
        toast.error('Hinzufügen fehlgeschlagen');
      }
    };

    const handleCreateNew = () => {
      if (!exerciseId) return;
      sheetRef.current?.dismiss();
      router.push(
        `/trainings/new?preselect=${encodeURIComponent(exerciseId)}&returnTo=library`
      );
    };

    return (
      <BottomSheet
        ref={sheetRef}
        snapPoints={['55%']}
        title={exerciseName ? `"${exerciseName}" hinzufügen` : 'Zum Training hinzufügen'}
      >
        <View className="flex-1">
          {openTrainings.length > 0 && (
            <>
              <Text variant="caption1" color="muted" className="mb-2 uppercase tracking-wide">
                Heute &amp; kommend
              </Text>
              <FlatList
                data={openTrainings}
                keyExtractor={(item: Training) => item.documentId}
                contentContainerStyle={{ paddingBottom: 8, gap: 6 }}
                renderItem={({ item }) => {
                  const isActive = item.training_status === 'in_progress';
                  return (
                    <Pressable
                      onPress={() => handleAddToExisting(item.documentId, item.Name)}
                      disabled={addExercise.isPending}
                      className="bg-card rounded-lg p-3 flex-row items-center gap-3"
                    >
                      <View className="w-9 h-9 rounded-md bg-info/10 items-center justify-center">
                        <Icon name="calendar-outline" size={18} color="info" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text variant="subhead" weight="semibold" numberOfLines={1}>
                            {item.Name}
                          </Text>
                          {isActive && (
                            <Text variant="caption2" weight="bold" color="warning">
                              LÄUFT
                            </Text>
                          )}
                        </View>
                        <Text variant="caption1" color="muted">
                          {new Date(item.Date).toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {' · '}
                          {item.exercises?.length ?? 0} Übungen
                        </Text>
                      </View>
                      <Icon name="chevron-forward" size={16} color="muted" />
                    </Pressable>
                  );
                }}
              />
            </>
          )}

          {openTrainings.length === 0 && (
            <Text variant="footnote" color="muted" className="text-center py-4">
              Du hast noch kein anstehendes Training.
            </Text>
          )}

          <Text variant="caption1" color="muted" className="mt-3 mb-2 uppercase tracking-wide">
            Oder
          </Text>
          <Pressable
            onPress={handleCreateNew}
            className="border border-dashed border-primary/40 bg-primary/5 rounded-lg p-3 flex-row items-center gap-3"
          >
            <View className="w-9 h-9 rounded-md bg-primary/15 items-center justify-center">
              <Icon name="add" size={20} color="primary" />
            </View>
            <View className="flex-1">
              <Text variant="subhead" weight="semibold" color="primary">
                Neues Training erstellen
              </Text>
              <Text variant="caption1" color="muted">
                Mit dieser Übung als Start
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="primary" />
          </Pressable>
        </View>
      </BottomSheet>
    );
  }
);
```

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add components/sheets/TrainingPickerSheet.tsx
git commit -m "feat(sheet): add TrainingPickerSheet for single-exercise-add from library"
```

---

## Phase 4 · Library Normal-Mode Affordances

### Task 4.1 · "+" button on each Library card

**Files:**
- Modify: `app/(tabs)/library/index.tsx`

Mount `TrainingPickerSheet` inside the library screen. When not in pick-mode, each `ExerciseCard` gets a trailing "+" button that opens the sheet pre-loaded with that exercise.

- [ ] **Step 1: Add TrainingPickerSheet ref + mount**

Add to the imports of `library/index.tsx`:

```tsx
import { useRef } from 'react';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
```

Inside `LibraryListScreen`, near the other hooks:

```tsx
const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);
```

- [ ] **Step 2: Add "+" trailing in the non-pick-mode branch**

Replace the `trailing` prop on `ExerciseCard` inside `renderItem` with:

```tsx
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
```

Note: `e.stopPropagation?.()` prevents the card's `onPress` from also firing (which would otherwise navigate to detail). React Native's synthetic events don't reliably stopPropagation on all platforms — the optional-call is defensive.

- [ ] **Step 3: Mount the sheet**

At the bottom of the `<Screen>` return (after the FlatList `Pressable` wrapper), before the closing `</Screen>`:

```tsx
<TrainingPickerSheet ref={trainingPickerRef} />
```

- [ ] **Step 4: Typecheck + Commit**

```bash
npx tsc --noEmit
git add app/(tabs)/library/index.tsx
git commit -m "feat(library): add '+' quick-action on each card opening TrainingPickerSheet"
```

---

### Task 4.2 · Library detail bottom CTA

**Files:**
- Modify: `app/(tabs)/library/[id].tsx`

Add a fixed bottom button `+ Zum Training hinzufügen` that opens the same `TrainingPickerSheet`.

- [ ] **Step 1: Rewrite library/[id].tsx**

```tsx
import { useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Text, Badge, Card, Icon, Button } from '@/components/ui';
import { useExerciseDetail } from '@/lib/queries/useExercises';
import {
  TrainingPickerSheet,
  TrainingPickerSheetRef,
} from '@/components/sheets/TrainingPickerSheet';
import { COLORS } from '@/lib/theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading } = useExerciseDetail(id);
  const trainingPickerRef = useRef<TrainingPickerSheetRef>(null);

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  if (!exercise) {
    return (
      <Screen padding="base">
        <View className="flex-1 items-center justify-center">
          <Text variant="footnote" color="muted">Übung nicht gefunden</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Screen scroll padding="base">
        <Text variant="largeTitle" weight="bold" className="mb-3 mt-2">
          {exercise.Name}
        </Text>

        <View className="flex-row gap-2 mb-5">
          <Badge variant="muted">{`${exercise.Minutes} Min`}</Badge>
          {exercise.Difficulty && (
            <Badge variant="info-soft">{exercise.Difficulty}</Badge>
          )}
        </View>

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

      <View className="px-5 py-3 border-t border-border bg-background">
        <Button
          size="lg"
          className="w-full"
          leftIcon="add"
          onPress={() => trainingPickerRef.current?.present(exercise.documentId, exercise.Name)}
        >
          Zum Training hinzufügen
        </Button>
      </View>

      <TrainingPickerSheet ref={trainingPickerRef} />
    </Screen>
  );
}
```

Note the outer `<Screen>` wrapper (no scroll, no padding) creates the flex column; the inner `<Screen scroll padding="base">` fills the available space; the bottom `<View>` with border-t is the fixed footer.

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add app/(tabs)/library/[id].tsx
git commit -m "feat(library): add sticky bottom CTA to add exercise to training"
```

---

## Phase 5 · Filter System

### Task 5.1 · FilterChip primitive

**Files:**
- Create: `components/ui/FilterChip.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create FilterChip.tsx**

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils/cn';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export interface FilterChipProps {
  label: string;
  active?: boolean;
  leadingIcon?: IoniconsName;
  badge?: number;
  onPress?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  active,
  leadingIcon,
  badge,
  onPress,
  onRemove,
  className,
}: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border',
        active
          ? 'bg-primary/15 border-primary/40'
          : 'bg-surface-1 border-border',
        className
      )}
    >
      {leadingIcon && (
        <Icon name={leadingIcon} size={12} color={active ? 'primary' : 'muted'} />
      )}
      <Text variant="caption1" weight={active ? 'semibold' : 'regular'} color={active ? 'primary' : 'foreground'}>
        {label}
      </Text>
      {typeof badge === 'number' && badge > 0 && (
        <View className="bg-primary rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
          <Text variant="caption2" weight="bold" color="inverse">
            {badge}
          </Text>
        </View>
      )}
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          className="ml-0.5"
        >
          <Icon name="close" size={12} color={active ? 'primary' : 'muted'} />
        </Pressable>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 2: Export in components/ui/index.ts**

Append:
```ts
export { FilterChip } from './FilterChip';
export type { FilterChipProps } from './FilterChip';
```

- [ ] **Step 3: Typecheck + Commit**

```bash
npx tsc --noEmit
git add components/ui/FilterChip.tsx components/ui/index.ts
git commit -m "feat(ui): add FilterChip primitive"
```

---

### Task 5.2 · LibraryFilterSheet

**Files:**
- Create: `components/sheets/LibraryFilterSheet.tsx`

- [ ] **Step 1: Create the sheet**

```tsx
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import {
  BottomSheet,
  BottomSheetRef,
  Button,
  FilterChip,
  Text,
} from '@/components/ui';

export type DurationBucket = 'short' | 'medium' | 'long';

export interface LibraryFilterState {
  focus: string[];          // multi-select focus names
  difficulty: string | null; // single-select difficulty string, or null = alle
  duration: DurationBucket | null; // single-select bucket, or null = alle
}

export const EMPTY_FILTERS: LibraryFilterState = {
  focus: [],
  difficulty: null,
  duration: null,
};

export const DURATION_LABEL: Record<DurationBucket, string> = {
  short: 'bis 10 Min',
  medium: '10–20 Min',
  long: '20+ Min',
};

export interface LibraryFilterSheetRef {
  present: () => void;
}

interface Props {
  filters: LibraryFilterState;
  onChange: (next: LibraryFilterState) => void;
  availableFocus: string[];
  availableDifficulty: string[];
}

export const LibraryFilterSheet = forwardRef<LibraryFilterSheetRef, Props>(
  function LibraryFilterSheet(
    { filters, onChange, availableFocus, availableDifficulty },
    ref
  ) {
    const sheetRef = useRef<BottomSheetRef>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    const toggleFocus = (name: string) => {
      const next = filters.focus.includes(name)
        ? filters.focus.filter((f) => f !== name)
        : [...filters.focus, name];
      onChange({ ...filters, focus: next });
    };

    const setDifficulty = (value: string) => {
      onChange({
        ...filters,
        difficulty: filters.difficulty === value ? null : value,
      });
    };

    const setDuration = (value: DurationBucket) => {
      onChange({
        ...filters,
        duration: filters.duration === value ? null : value,
      });
    };

    const reset = () => onChange(EMPTY_FILTERS);

    return (
      <BottomSheet ref={sheetRef} snapPoints={['70%']} title="Filter">
        <View className="flex-1">
          <View className="flex-row justify-end mb-2">
            <Pressable onPress={reset}>
              <Text variant="footnote" color="warning" weight="semibold">
                Zurücksetzen
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {availableFocus.length > 0 && (
              <View className="mb-5">
                <Text variant="caption1" color="muted" className="uppercase tracking-wide mb-2">
                  Fokus
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableFocus.map((name) => (
                    <FilterChip
                      key={name}
                      label={name}
                      active={filters.focus.includes(name)}
                      onPress={() => toggleFocus(name)}
                    />
                  ))}
                </View>
              </View>
            )}

            {availableDifficulty.length > 0 && (
              <View className="mb-5">
                <Text variant="caption1" color="muted" className="uppercase tracking-wide mb-2">
                  Schwierigkeit
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableDifficulty.map((d) => (
                    <FilterChip
                      key={d}
                      label={d}
                      active={filters.difficulty === d}
                      onPress={() => setDifficulty(d)}
                    />
                  ))}
                </View>
              </View>
            )}

            <View className="mb-5">
              <Text variant="caption1" color="muted" className="uppercase tracking-wide mb-2">
                Dauer
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(DURATION_LABEL) as DurationBucket[]).map((b) => (
                  <FilterChip
                    key={b}
                    label={DURATION_LABEL[b]}
                    active={filters.duration === b}
                    onPress={() => setDuration(b)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View className="pt-3 pb-4 border-t border-border">
            <Button
              size="lg"
              className="w-full"
              onPress={() => sheetRef.current?.dismiss()}
            >
              Übernehmen
            </Button>
          </View>
        </View>
      </BottomSheet>
    );
  }
);
```

- [ ] **Step 2: Typecheck + Commit**

```bash
npx tsc --noEmit
git add components/sheets/LibraryFilterSheet.tsx
git commit -m "feat(sheet): add LibraryFilterSheet with focus/difficulty/duration dimensions"
```

---

### Task 5.3 · Wire filters into Library index

**Files:**
- Modify: `app/(tabs)/library/index.tsx`

Render a filter chip row below the search input: a "⚙ Filter" chip that opens the sheet with a badge-count of active filters, plus active-filter chips as tap-to-remove.

- [ ] **Step 1: Add filter state, sheet ref, and filter helpers**

Inside `LibraryListScreen`, under the existing `search` state:

```tsx
import {
  LibraryFilterSheet,
  LibraryFilterSheetRef,
  LibraryFilterState,
  EMPTY_FILTERS,
  DURATION_LABEL,
  DurationBucket,
} from '@/components/sheets/LibraryFilterSheet';
import { FilterChip } from '@/components/ui';

// ...inside LibraryListScreen:
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
```

Don't forget to add `useMemo` to the `react` imports.

- [ ] **Step 2: Add the filter chip row between the search and the list**

Right after the search `<View>` block:

```tsx
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
```

- [ ] **Step 3: Use `filtered` instead of `exercises ?? []` in the FlatList data prop**

Change:
```tsx
data={exercises ?? []}
```
to:
```tsx
data={filtered}
```

- [ ] **Step 4: Mount LibraryFilterSheet**

After the `TrainingPickerSheet` mount:

```tsx
<LibraryFilterSheet
  ref={filterSheetRef}
  filters={filters}
  onChange={setFilters}
  availableFocus={availableFocus}
  availableDifficulty={availableDifficulty}
/>
```

- [ ] **Step 5: Typecheck + Commit**

```bash
npx tsc --noEmit
git add app/(tabs)/library/index.tsx
git commit -m "feat(library): add filter chip row + LibraryFilterSheet wiring"
```

---

## Phase 6 · Create-Training Redesign

### Task 6.1 · Preselect + returnTo route params

**Files:**
- Modify: `app/(tabs)/trainings/new.tsx`

- [ ] **Step 1: Read current new.tsx** to preserve the existing form state

- [ ] **Step 2: Read params, initialize state, switch onSuccess nav**

At the top of `NewTrainingScreen`:

```tsx
import { useLocalSearchParams, router } from 'expo-router';

// ...
const { preselect, returnTo } = useLocalSearchParams<{
  preselect?: string;
  returnTo?: string;
}>();

const [name, setName] = useState('');
const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
const [exerciseIds, setExerciseIds] = useState<string[]>(
  preselect ? [preselect] : []
);
const [playerIds, setPlayerIds] = useState<string[]>([]);
```

Change `handleCreate`:

```tsx
const handleCreate = () => {
  createTraining.mutate(
    { name, date, exerciseIds, playerIds },
    {
      onSuccess: (newTraining) => {
        toast.success('Training erstellt');
        if (returnTo === 'library') {
          router.replace('/library');
        } else {
          router.replace({
            pathname: '/trainings',
            params: { scrollToId: newTraining.documentId },
          });
        }
      },
      onError: () => toast.error('Training konnte nicht erstellt werden'),
    }
  );
};
```

- [ ] **Step 3: Typecheck + Commit**

```bash
npx tsc --noEmit
git add app/(tabs)/trainings/new.tsx
git commit -m "feat(new-training): support preselect and returnTo route params"
```

---

### Task 6.2 · Inline rich list for Übungen

**Files:**
- Modify: `app/(tabs)/trainings/new.tsx`

Replace the current "3 ausgewählt" text with a real list of ExerciseCard rows (rich density) with remove buttons. Use `useExercises('')` (already present as a hook in the codebase) to resolve ids → exercise objects.

- [ ] **Step 1: Import ExerciseCard, useExercises, Pressable, Icon and build the lookup**

At the top of `new.tsx`:

```tsx
import { Pressable } from 'react-native';
import { ExerciseCard, Icon } from '@/components/ui';
import { useExercises } from '@/lib/queries/useExercises';
```

Inside `NewTrainingScreen`, after the state declarations:

```tsx
const { data: allExercises } = useExercises('');

const selectedExercises = useMemo(() => {
  const byId = new Map((allExercises ?? []).map((ex: any) => [ex.documentId, ex]));
  return exerciseIds
    .map((id) => byId.get(id))
    .filter(Boolean) as any[];
}, [allExercises, exerciseIds]);

const removeExercise = (id: string) =>
  setExerciseIds((prev) => prev.filter((x) => x !== id));
```

- [ ] **Step 2: Replace the Übungen section render**

Find the block:
```tsx
<View className="mb-5">
  <View className="flex-row justify-between items-center mb-2">
    <Text variant="subhead" weight="semibold">
      Übungen ({exerciseIds.length})
    </Text>
    <Button
      variant="ghost"
      size="sm"
      leftIcon="search-outline"
      onPress={() => exerciseSheetRef.current?.present()}
    >
      Auswählen
    </Button>
  </View>
  <Text variant="footnote" color="muted">
    {exerciseIds.length === 0
      ? 'Noch keine Übungen gewählt'
      : `${exerciseIds.length} ausgewählt`}
  </Text>
</View>
```

Replace with:

```tsx
<View className="mb-5">
  <View className="flex-row justify-between items-center mb-2">
    <Text variant="subhead" weight="semibold">
      Übungen ({exerciseIds.length})
    </Text>
    <Button
      variant="ghost"
      size="sm"
      leftIcon="search-outline"
      onPress={handleOpenExercisePicker}
    >
      Auswählen
    </Button>
  </View>

  {exerciseIds.length === 0 && (
    <Text variant="footnote" color="muted">Noch keine Übungen gewählt</Text>
  )}

  {selectedExercises.map((ex) => (
    <ExerciseCard
      key={ex.documentId}
      exercise={ex}
      compact
      className="mb-1.5"
      trailing={
        <Pressable
          onPress={() => removeExercise(ex.documentId)}
          hitSlop={6}
          className="w-7 h-7 rounded-full bg-destructive/10 items-center justify-center"
        >
          <Icon name="close" size={14} color="destructive" />
        </Pressable>
      }
    />
  ))}
</View>
```

Note: `handleOpenExercisePicker` is defined in Task 7.1. For this task only, use a placeholder that still opens the old sheet so the screen remains functional:

```tsx
// Temporary: keep old sheet trigger until Task 7.1 wires the Library picker
const handleOpenExercisePicker = () =>
  exerciseSheetRef.current?.present();
```

- [ ] **Step 3: Typecheck + Commit**

```bash
npx tsc --noEmit
git add app/(tabs)/trainings/new.tsx
git commit -m "feat(new-training): render selected Übungen as rich inline list"
```

---

### Task 6.3 · Inline minimal list for Spieler

**Files:**
- Modify: `app/(tabs)/trainings/new.tsx`

- [ ] **Step 1: Add usePlayers + selectedPlayers lookup**

```tsx
import { usePlayers } from '@/lib/queries/usePlayers';

// ...inside NewTrainingScreen:
const { data: allPlayers } = usePlayers();

const selectedPlayers = useMemo(() => {
  const byId = new Map((allPlayers ?? []).map((p: any) => [p.documentId, p]));
  return playerIds
    .map((id) => byId.get(id))
    .filter(Boolean) as any[];
}, [allPlayers, playerIds]);

const removePlayer = (id: string) =>
  setPlayerIds((prev) => prev.filter((x) => x !== id));
```

- [ ] **Step 2: Replace the Spieler section render**

Find the block:
```tsx
<View className="mb-2">
  <View className="flex-row justify-between items-center mb-2">
    <Text variant="subhead" weight="semibold">
      Spieler ({playerIds.length})
    </Text>
    <Button
      variant="ghost"
      size="sm"
      leftIcon="search-outline"
      onPress={() => playerSheetRef.current?.present()}
    >
      Auswählen
    </Button>
  </View>
  <Text variant="footnote" color="muted">
    {playerIds.length === 0
      ? 'Noch keine Spieler gewählt'
      : `${playerIds.length} ausgewählt`}
  </Text>
</View>
```

Replace with:

```tsx
<View className="mb-2">
  <View className="flex-row justify-between items-center mb-2">
    <Text variant="subhead" weight="semibold">
      Spieler ({playerIds.length})
    </Text>
    <Button
      variant="ghost"
      size="sm"
      leftIcon="search-outline"
      onPress={() => playerSheetRef.current?.present()}
    >
      Auswählen
    </Button>
  </View>

  {playerIds.length === 0 && (
    <Text variant="footnote" color="muted">Noch keine Spieler gewählt</Text>
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
          hitSlop={6}
          className="w-6 h-6 items-center justify-center"
        >
          <Icon name="close" size={14} color="muted" />
        </Pressable>
      </View>
    );
  })}
</View>
```

- [ ] **Step 3: Typecheck + Commit**

```bash
npx tsc --noEmit
git add app/(tabs)/trainings/new.tsx
git commit -m "feat(new-training): render selected Spieler as minimal inline list"
```

---

## Phase 7 · Wire-Up + Cleanup

### Task 7.1 · Create-Form "Auswählen" uses Library pick-mode

**Files:**
- Modify: `app/(tabs)/trainings/new.tsx`

Replace the temporary ExercisePickerSheet trigger with the Library pick-mode navigation. The Spieler picker (PlayerPickerSheet) stays as-is per spec.

- [ ] **Step 1: Import pickModeStore and remove ExercisePickerSheet import**

At the top of `new.tsx`:

```tsx
import { usePickModeStore } from '@/lib/store/pickModeStore';
```

Remove this import block entirely:
```tsx
import {
  ExercisePickerSheet,
  ExercisePickerSheetRef,
} from '@/components/sheets/ExercisePickerSheet';
```

- [ ] **Step 2: Remove the ref and the sheet mount**

Delete:
```tsx
const exerciseSheetRef = useRef<ExercisePickerSheetRef>(null);
```

And delete from the JSX:
```tsx
<ExercisePickerSheet
  ref={exerciseSheetRef}
  selectedIds={exerciseIds}
  onChange={setExerciseIds}
/>
```

- [ ] **Step 3: Replace handleOpenExercisePicker with Library nav**

Replace the temporary handler added in Task 6.2:

```tsx
const handleOpenExercisePicker = () => {
  usePickModeStore.getState().start(exerciseIds, setExerciseIds);
  router.push('/library?mode=pick');
};
```

Note: `usePickModeStore.getState()` is intentional — we don't want to subscribe this component to the store (it only writes, it doesn't read), which avoids re-rendering the create form while the user is in the library.

- [ ] **Step 4: Typecheck + Commit**

```bash
npx tsc --noEmit
git add app/(tabs)/trainings/new.tsx
git commit -m "feat(new-training): wire Übungen Auswählen to Library pick-mode"
```

---

### Task 7.2 · Delete ExercisePickerSheet

**Files:**
- Delete: `components/sheets/ExercisePickerSheet.tsx`

- [ ] **Step 1: Verify no references remain**

Run:
```bash
grep -r "ExercisePickerSheet" app components lib --include="*.ts" --include="*.tsx"
```
Expected: no matches (or only matches in the file we're about to delete).

- [ ] **Step 2: Delete the file**

```bash
rm "components/sheets/ExercisePickerSheet.tsx"
```

- [ ] **Step 3: Typecheck + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "chore(sheets): delete ExercisePickerSheet (replaced by Library pick-mode)"
```

---

## Phase 8 · Final Validation

### Task 8.1 · Flow-Testing + polish pass

- [ ] **Step 1: Cold-boot on web**

```bash
npx expo start --clear --web
```

- [ ] **Step 2: Walk through every flow**

Test each flow explicitly:

**Flow 1 — Multi-Select from Create-Form:**
1. Trainings-Tab → `+` → lands on `/trainings/new`
2. Tap "Auswählen" bei Übungen → Library opens with `Auswählen` header, `Fertig (0)` right
3. Tap 2 exercises → Fertig counter updates → each card shows filled checkmark
4. Tap Fertig (2) → back to create form → 2 exercises appear as rich rows
5. Tap "×" on one → list shortens, count updates

**Flow 2 — Single-Add existing training from Library:**
1. Library tab → tap `+` on a card → TrainingPickerSheet opens
2. Pick an existing draft training → Toast "Zu … hinzugefügt" → sheet closes
3. Navigate to that training → verify exercise is in the list

**Flow 3 — Single-Add via Library detail + Neu:**
1. Library → tap card (navigate to detail)
2. Bottom CTA "Zum Training hinzufügen" → TrainingPickerSheet
3. Tap "Neues Training erstellen" → `/trainings/new` with exercise pre-filled
4. Fill Name, Datum, Spieler → Submit
5. Navigates back to `/library` (not to Trainings tab)
6. Toast "Training erstellt"

**Flow 4 — Cancel pick-mode:**
1. `/trainings/new` → "Auswählen" → Library pick-mode
2. Tap 1 exercise → Fertig (1)
3. Swipe-back or tap Abbrechen → back to create form → **no change** in exercise list
4. Reopen picker → previously-un-selected exercise is NOT checked

**Flow 5 — Filters:**
1. Library (normal) → tap Filter chip → sheet opens
2. Select 1 focus + 1 difficulty → Apply
3. Chip-row shows Filter with badge "2" + two active chips
4. Tap one active chip's "×" → chip removed, list re-filters
5. Open Filter sheet → tap "Zurücksetzen" → all chips cleared

**Flow 6 — Empty-state TrainingPicker:**
1. Delete or complete all drafts → Library → `+` on card
2. Sheet shows "Du hast noch kein anstehendes Training." + only "Neues Training erstellen" option

- [ ] **Step 3: Apply fixes for any issues found**

Common issues that may surface:
- iOS swipe-back during pick-mode doesn't fire `useFocusEffect` cleanup → explicit cancel on back press
- FilterChip tap area too small → adjust padding
- ExerciseCard `trailing` click bubbles to card onPress → confirm `stopPropagation` in Pressable works on iOS

Commit any fixes as `polish(library-picker): …`.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 5: Verify in Expo Go iOS**

```bash
npx expo start --clear
```

Scan QR, walk Flow 1–6 on a physical device. Pay special attention to:
- Swipe-back gesture during pick-mode clears store and preserves original selection
- Haptics on FilterChip tap
- BottomSheet behaviour of TrainingPickerSheet (snap, dismiss)

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "polish(library-picker): final consistency pass"
```

---

## Acceptance Verification

Before pushing / opening PR:

- [ ] `npx tsc --noEmit` zero errors
- [ ] `grep -r "ExercisePickerSheet" app components lib` finds no references
- [ ] Library in `?mode=pick` shows Fertig(N) header and checkmarks
- [ ] Library in normal mode shows + buttons and opens TrainingPickerSheet
- [ ] Library detail has fixed bottom CTA
- [ ] Filter chip + active filter chips work, filter sheet resets cleanly
- [ ] `/trainings/new?preselect=<id>` initializes exercise in the inline list
- [ ] `/trainings/new?returnTo=library` returns to `/library` after Submit
- [ ] Create-Screen shows rich Übungen list + minimal Spieler list, both with remove
- [ ] All 6 manual flows pass on web and Expo Go iOS

Push:
```bash
git push -u origin feature/library-picker
gh pr create --title "feat: Library-integrated exercise picker + create-form inline lists" \
  --body-file docs/superpowers/specs/2026-04-23-library-picker-flow-design.md
```

---

## Out of Scope (goes to future cycles)

- Wizard flow ("Vorhand verbessern", "Topspin") — opens Library with pre-applied filters
- Spieler-picker refactor (full-screen pick experience) — separate small cycle
- Server-side Strapi filters — performance optimization
- Swipe-to-delete on inline lists — motion cycle
- Exercise-creation inside Library — future feature
- Long-press detail preview inside pick-mode — if user feedback demands it

---

## Post-Implementation Deviations (2026-04-24)

What actually shipped differs in several ways from the plan above. Captured here so the doc matches the code for future reference.

### Architecture

**Cross-tab navigation via `?mode=pick` was abandoned.** Pushing `/library?mode=pick` from a different tab (Trainings) silently drops out of the source-tab stack, so `router.back()` had nowhere sensible to go and the `?mode=pick` query stuck in the Library-tab state after navigation. Same problem surfaced for `/trainings/new` when opened from Library.

Every flow that needs to cross tabs is now its own root-stack modal route outside `(tabs)`:

- `app/exercise-picker.tsx` — exercise picker
- `app/player-picker.tsx` — player picker
- `app/training-new.tsx` — draft-training create form (moved out of `(tabs)/trainings/new.tsx`)
- `app/exercise-detail/[id].tsx` — exercise detail (moved out of `(tabs)/library/[id].tsx`)

All four are registered in `app/_layout.tsx` with `presentation: 'modal'` and `headerShown: true`. `router.back()` pops cleanly regardless of which tab the user was on.

### Exercise-picker: single-add, not multi-select

The plan called for `Fertig (N)` confirmation at the end of a multi-select flow. After testing, the UX was reworked to mirror the Library's browse-and-add pattern instead:

- Card tap → `/exercise-detail/[id]`
- `+` button on card → fires per-tap `onAdd` callback from the store (API call + toast for live-training / detail cases; local state update for training-new)
- No `Fertig` header, no `selectedIds` state
- `sessionAddedIds` accumulates this-session adds and renders a compact `✓ N` badge in the header-right
- Cards with ids passed via `?excludeIds` (already-in-target-training) render pre-checked

**Player-picker still uses multi-select with `Fertig`** — a name list doesn't need detail drill-down, so the single-add model adds no value there.

### `pickModeStore` dual-mode

`lib/store/pickModeStore.ts` grew a second start method:

- `start(initial, onConfirm)` — multi-select (used by player-picker)
- `startAdd(onAdd, addContextLabel?)` — single-add (used by exercise-picker). `addContextLabel` lets the caller set the detail-screen CTA text (e.g. "Zum Live-Training hinzufügen" from execute, plain "Zum Training hinzufügen" elsewhere)

`confirm()` is async — awaits the callback before closing so the Fertig-button can show a spinner during the bulk-mutation in player-picker.

`cancel()` runs from `navigation.addListener('beforeRemove')`, not `useFocusEffect`. The latter fires when another screen pushes on top (e.g. opening detail from inside the picker) and would wipe the active selection; `beforeRemove` only fires on actual dismissal.

### Strapi schema alignment

The original type assumptions (`Difficulty` enum, `focus[]` relation) didn't match the real schema. Replaced with three relations — `focusareas`, `playerlevels`, `categories` — each typed as `Tag { documentId, Name }`. `useExercises`, `useTrainings`, `useTrainingDetail`, and `useTrainingsHistory` all populate these explicitly; Strapi v5's `populate='*'` only walks one level, which was why pills showed on Library cards (direct `/exercises` query) but not on live-training cards (nested via training.exercises).

### ExerciseCard visual

Three iterations landed here:

1. Initial: round initial-letter avatar + Minutes + Difficulty + single focus badge.
2. Dropped the avatar, hash-colored pills per tag. Too noisy (5 random colors per card).
3. **Final**: title on its own line (wraps to 2 lines, never truncated) + `ExercisePills` row below. Minutes gets a dedicated slot with a right-border separator. Playerlevels carry a semantic gradient (Beginner = success / Intermediate = warning / Advanced+Expert = destructive). Categories always `primary-soft`. Focusareas always `muted`. Description lives only on the detail screen.

`components/ui/ExercisePills.tsx` is the shared primitive — used by ExerciseCard, exercise-detail, and the execute-screen cards.

### Execute-screen cards

Match the ExerciseCard layout: title on its own wrappable line, pills row below it, controls (checkbox / minutes input / remove) on the next row. Minutes `TextInput` has a fixed 28px width because RN Web expands inputs to fill unused row space otherwise.

### Completion screen

Reverted from the hero-single-points design back to the 4-stat row (Dauer / Teilnehmer / Abgehakt / Punkte). Live counts (`completedCount` + `sessionDuration`) flow through as route params set by `useCompleteTraining`'s onSuccess, so the "abgehakt" value reflects what the user actually ticked off instead of the training's total exercises.

### Cross-cutting fixes

- `router.dismiss(2)` instead of `dismissAll()` after direct-add from detail — dismissAll wiped the training-new modal when the user came from the draft-creation flow.
- `useStartTraining.onSuccess` invalidates `['trainings']` (not just the single key) so the TrainingPickerSheet doesn't render stale status.
- `TrainingPickerSheet.present()` invalidates `['trainings']` on open as defense-in-depth.
- FlatList inside a `BottomSheetView` can collapse to zero height on web; the sheet uses a plain `.map()` now.
- `headerShown: true` is explicit on every modal route — the root stack default is `false`, and inherited silently hides the `headerLeft` close button.

### Deleted

- `components/sheets/ExercisePickerSheet.tsx`
- `components/sheets/AddExercisesSheet.tsx`
- `components/sheets/AddPlayersSheet.tsx`
- `components/sheets/PlayerPickerSheet.tsx` (replaced by `/player-picker` modal route)

### Still pending (carried from original "Out of Scope")

Everything in the Out-of-Scope list above still applies. Manual flow validation on Expo Go iOS is not done.
