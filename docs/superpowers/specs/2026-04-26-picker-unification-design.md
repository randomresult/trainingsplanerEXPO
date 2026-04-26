# Library / Picker Unification — Design Spec

**Date:** 2026-04-26
**Branch:** `feature/picker-unification`

## Goal

Merge `exercise-picker.tsx` and `library/index.tsx` into a single shared `LibraryScreen` component so that every UI improvement (filters, series support, skeleton loaders) is maintained in one place instead of two.

## Problem

Two screens do the same job:
- `app/(tabs)/library/index.tsx` — browse mode, `+` opens `TrainingPickerSheet` to choose a training
- `app/exercise-picker.tsx` — pick mode (from training screens), `+` adds directly to a known training via `usePickModeStore.onAdd`

Any change must currently land in both. `exercise-picker` has no series (Lernpfade) tab, so adding a whole series from inside a training is impossible today.

## Architecture

### New shared component

**`components/screens/LibraryScreen.tsx`**

```typescript
interface LibraryScreenProps {
  trainingId?: string;
  trainingName?: string;
}
```

Single component, two modes driven by whether `trainingId` is set.

### Two thin route wrappers

**`app/(tabs)/library/index.tsx`** — renders `<LibraryScreen />` (no props). Tab screen, `headerShown: false`.

**`app/library-pick.tsx`** — push route. Reads `trainingId` and `trainingName` from `useLocalSearchParams`, renders `<LibraryScreen trainingId={...} trainingName={...} />`.

### Route registration (`app/_layout.tsx`)

- Remove `exercise-picker` Stack.Screen
- Add `library-pick` Stack.Screen (push, dark header, same options as exercise-picker today)

---

## LibraryScreen behaviour by mode

### Browse mode (`trainingId` undefined)

- No header (tab screen owns the header externally via `headerShown: false`)
- Übungen tab: exercise `+` → `trainingPickerRef.current?.present(exerciseId, name)`
- Lernpfade tab: series `+` → `trainingPickerRef.current?.presentSeries(seriesId, name, exerciseIds)`
- Exercise card tap → `router.push('/exercise-detail/[id]', { id })` (no training context)
- `TrainingPickerSheet` rendered at bottom

### Pick mode (`trainingId` set)

- Header: `title: trainingName ?? 'Hinzufügen'`, custom `headerLeft` back button (chevron-back on native, close on web — same pattern as exercise-detail and series-detail)
- Übungen tab: exercise `+` → `useAddExerciseToTraining` directly; tracks `sessionAddedIds` for ✓ state
- Lernpfade tab: series `+` → `useAddMethodicalSeriesToTraining` directly (new capability vs. exercise-picker)
- Exercise card tap → `router.push('/exercise-detail/[id]', { id, trainingId, trainingName })` — threads pick context into detail
- No `TrainingPickerSheet` rendered

---

## exercise-detail CTA threading

`app/exercise-detail/[id].tsx` currently reads `onAdd` and `addContextLabel` from `usePickModeStore`. After unification, both come from route params.

```typescript
const { id, trainingId, trainingName } = useLocalSearchParams<{
  id: string;
  trainingId?: string;
  trainingName?: string;
}>();
```

- `trainingId` present → show direct "Zum Training hinzufügen" CTA using `useAddExerciseToTraining`
- `trainingId` absent → show regular `TrainingPickerSheet` button

`usePickModeStore` import removed from exercise-detail.

---

## Callsite changes — training screens

Three screens currently call `store.startAdd(...)` then navigate to `/exercise-picker`. All three replace that with a single push:

```typescript
router.push({
  pathname: '/library-pick',
  params: { trainingId: id, trainingName: training.Name },
})
```

Affected files:
- `app/(tabs)/trainings/[id]/index.tsx`
- `app/(tabs)/trainings/[id]/execute.tsx`

The `excludeIds` query param is removed. The library-pick screen derives "already added" state from its own `sessionAddedIds` local state (same pattern as exercise-picker today, without needing a URL param).

---

## Store changes (`lib/store/pickModeStore.ts`)

Remove exercise-specific fields (no longer needed):
```typescript
// Removed:
onAdd?: (id: string) => void | Promise<void>
addContextLabel?: string
startAdd(onAdd, addContextLabel?): void
```

Keep player-picker multi-select fields (unchanged):
```typescript
active: boolean
selectedIds: string[]
onConfirm?: (ids: string[]) => void | Promise<void>
start(initial, onConfirm): void
toggle(id): void
confirm(): Promise<void>
cancel(): void
```

`player-picker.tsx` and training screens that call `store.start()` for player selection are untouched.

---

## Deletions

- `app/exercise-picker.tsx` — deleted entirely
- `exercise-picker` Stack.Screen in `app/_layout.tsx` — removed

---

## Out of scope

- `app/training-new.tsx` exercise-add flow — uses `startAdd` with an in-memory callback for an unsaved training. Left untouched for this cycle; addressed in the Series-to-New-Training task (Roadmap X).
- Player picker — untouched throughout.
- Any new filter or UI improvements — this is a pure structural refactor, no feature changes.

---

## Success criteria

- `exercise-picker.tsx` and the exercise-specific store methods are deleted
- All training screens open the library-pick route directly (no store calls)
- Pick mode supports both exercises and series (Lernpfade tab)
- Exercise detail shows direct CTA when opened from pick mode
- Browse mode (library tab) behaviour is unchanged
- `npx tsc --noEmit` passes
