# Series-to-New-Training — Design Spec

**Date:** 2026-04-28
**Branch:** `feature/series-to-new-training`

## Goal

Make adding a Lernpfad (methodicalSeries) to a *new* training work — currently only
adding to an *existing* training works. As part of that, fix the legacy in-screen
picker in `training-new.tsx` (which still pushes to the deleted `/exercise-picker`
route) and drop the mandatory-Spieler check.

## Problem

Three flows are broken or missing:

| # | Flow | Status today |
|---|---|---|
| 1 | Library → Übung-Detail → "Neues Training" (`?preselect=<id>`) | ✅ works |
| 2 | Library → Series-Detail → "Neues Training" (`?preselectSeries=<id>`) | ❌ `training-new.tsx` ignores the param, modal opens empty |
| 3 | Inside `training-new` → "Auswählen"-Button | ❌ pushes to `/exercise-picker` which was deleted in the picker-unification cycle |

Plus: `canCreate` requires `playerIds.length > 0` — Spieler should be optional.

## Why now

The View+Container split shipped in `feature/library-view-container-split` was the
prerequisite. Adding a third container variant (draft-mode, no mutations) is now
cheap because `LibraryView` is pure and `library-filters.ts` + the `pickHeader` API
are reusable.

## Architecture

### New components

**`app/library-pick-draft.tsx`** — thin route, renders `<LibraryDraftPickerContainer />`. Push route, modal-stacked over `training-new`.

**`components/screens/LibraryDraftPickerContainer.tsx`** — third container alongside `LibraryBrowseContainer` and `LibraryPickerContainer`. Owns query hooks for `useExercises` and `useMethodicalSeries`. **No mutations.** Add-actions fire callbacks held in `draftPickStore`. Detail-navigations push to `exercise-detail` / `series-detail` without `trainingId`. Renders `LibraryView` with a `pickHeader` block.

**`lib/store/draftPickStore.ts`** — Zustand store for the handoff between `training-new`, `library-pick-draft`, and the detail screens.

```typescript
interface DraftPickStore {
  active: boolean;
  initialExerciseIds: Set<string>;       // checkmark seeds (parent's current state)
  initialSeriesIds: Set<string>;
  addedExerciseIds: Set<string>;         // grows on each onAddExercise call
  addedSeriesIds: Set<string>;           // grows on each onAddSeries call
  onAddExercise?: (id: string) => void;
  onAddSeries?: (seriesId: string, exerciseDocumentIds: string[]) => void;

  startDraftPick: (args: {
    initialExerciseIds: string[];
    initialSeriesIds: string[];
    onAddExercise: (id: string) => void;
    onAddSeries: (seriesId: string, exerciseIds: string[]) => void;
  }) => void;
  cancel: () => void;
}
```

The container reads the union `initialExerciseIds ∪ addedExerciseIds` (analogous
for series) for checkmarks. Side-effects (Set-mutation + parent callback) happen
inside the store action, not in the consumer.

### Modified components

**`app/training-new.tsx`** — full body rewrite:

- Reads URL params: `preselect` (single exercise id), `preselectSeries` (single series id), `seriesName`, `exerciseIds` (CSV).
- Local state: `name`, `date`, `exerciseIds: string[]`, `seriesIds: string[]`, `playerIds: string[]`, `seriesNameMap: Record<string, string>`.
- Initial state from URL params: `seriesIds = preselectSeries ? [preselectSeries] : []`, `exerciseIds = [preselect, ...exerciseIdsCsv]` (deduped).
- "Inhalt" section renders `MethodicalSeriesBlock` for each entry in `seriesIds`, then standalone exercises (those not belonging to any series in `seriesIds`) as `Card`s — same pattern as `app/(tabs)/trainings/[id]/index.tsx:170-244`. `MethodicalSeriesBlock` is invoked with `mode='edit'` and callbacks that mutate local state instead of calling APIs.
- "Auswählen"-Button → calls `draftPickStore.startDraftPick({ initialExerciseIds, initialSeriesIds, onAddExercise, onAddSeries })` then `router.push('/library-pick-draft')`.
- Spieler-Sektion stays. `canCreate = name.trim().length > 0 && exerciseIds.length > 0` (no players check).
- "Erstellen" → `useCreateTraining({ name, date, exerciseIds, methodicalSeriesIds: seriesIds, playerIds })`.
- On unmount: `draftPickStore.cancel()` (idempotent, only clears if still active — handles the case where user navigates away from `training-new` without ever opening the picker, or after picker close).

**`app/exercise-detail/[id].tsx`** — three modes determined at the top of the component:

```typescript
const draftActive = useDraftPickStore((s) => s.active);
const onAddDraft = useDraftPickStore((s) => s.onAddExercise);
const trainingId = params.trainingId;
const mode = draftActive && onAddDraft ? 'draft-pick' : trainingId ? 'training-pick' : 'view';
```

In `draft-pick` mode the "Hinzufügen"-CTA fires `onAddDraft(exerciseId)` + `router.dismiss()` instead of the mutation.

**`app/series-detail/[id].tsx`** — same three-mode pattern. Both the whole-series-add CTA and the per-exercise `+`-Buttons branch on the mode. In `draft-pick` mode, the whole-series add fires `draftPickStore.onAddSeries(seriesId, exerciseDocumentIds)`, and per-exercise `+` fires `onAddExercise(id)`.

**`lib/queries/useTrainings.ts` — `useCreateTraining`**:

```typescript
interface CreateTrainingInput {
  name: string;
  date: string;
  exerciseIds: string[];
  methodicalSeriesIds: string[];   // NEW
  playerIds: string[];
}

// In mutationFn POST body:
data: {
  Name, Date, training_status: 'draft', clubs,
  exercises: { connect: input.exerciseIds.map(id => ({ documentId: id })) },
  methodicalSeries: {
    connect: input.methodicalSeriesIds.map(id => ({ documentId: id })),
  },
  players: { connect: input.playerIds.map(id => ({ documentId: id })) },
}
```

Single POST connects both relations atomically. (Two-write split that
`useAddMethodicalSeriesToTraining` uses is only needed because of Strapi v5
quirks on UPDATE; for CREATE both relations can be set at once.)

**`lib/store/pickModeStore.ts`** — legacy cleanup:

- Remove `startAdd`, `onAdd`, `OnAddCallback` type
- Store reduces to multi-select-confirm only (used by `player-picker`)
- Remove the legacy comment "to be migrated in Series-to-New-Training task"

### Routes (`app/_layout.tsx`)

Add `library-pick-draft` to the Stack with `headerShown: true` (matching the style of `library-pick`).

## Data Flows

### Flow A: Series-Detail → "Neues Training" (URL pre-fill, no picker needed)

```
series-detail/X
  → "Hinzufügen" → TrainingPickerSheet → "Neues Training"
  → router.push('/training-new?preselectSeries=X&seriesName=...&exerciseIds=a,b,c')
training-new mounts
  → state init: seriesIds=[X], exerciseIds=[a,b,c], seriesNameMap={X: '<name>'}
  → renders MethodicalSeriesBlock for X
  → User fills Name + (optional) Datum + Spieler
  → "Erstellen" → useCreateTraining({ ..., methodicalSeriesIds: [X] })
```

### Flow B: Übung-Detail → "Neues Training" (existing, keep working)

```
exercise-detail/Y → "Hinzufügen" → TrainingPickerSheet → "Neues Training"
  → router.push('/training-new?preselect=Y')
training-new: state init exerciseIds=[Y], seriesIds=[]
```

### Flow C: In-screen picker inside training-new (replaces broken `/exercise-picker` push)

```
training-new → "Auswählen"
  → draftPickStore.startDraftPick({
      initialExerciseIds: new Set(exerciseIds),
      initialSeriesIds: new Set(seriesIds),
      onAddExercise: (id) =>
        setExerciseIds(prev => prev.includes(id) ? prev : [...prev, id]),
      onAddSeries: (sid, exIds) => {
        setSeriesIds(prev => prev.includes(sid) ? prev : [...prev, sid]);
        setExerciseIds(prev => [...new Set([...prev, ...exIds])]);
      },
    })
  → router.push('/library-pick-draft')

library-pick-draft → LibraryDraftPickerContainer
  → reads store, renders LibraryView with pickHeader
  → User taps + on Übung → store.onAddExercise(id) + store.addedExerciseIds.add(id) → ✓
  → User taps + on Series → store.onAddSeries(sid, exIds) → both Sets grow → ✓✓
  → User taps Card → router.push('/exercise-detail/[id]') (no trainingId)
       detail screen reads store.active → CTA fires onAddExercise + dismisses
  → "Fertig" → router.back() → back to training-new (or back to library-pick-draft from a deeper detail screen — single-pop semantics avoid dismissing the training-new modal)
training-new sees updated local state, re-renders MethodicalSeriesBlocks
```

## Edge Cases

- **App crash / hardware-back from training-new without "Erstellen":** No backend writes happen during the flow, no draft trash. Local state is gone.
- **`preselectSeries` with invalid id:** silently dropped at init time — if `useMethodicalSeries` returns no entry for that id after mount, `seriesIds` filters it out and `exerciseIds` from the CSV remain (since we can't tell which CSV ids belong to the bad series). Effectively the user lands in training-new with the standalone exercises only. Same fallback for `preselect` with invalid exercise id.
- **Direct navigation to `/library-pick-draft` without prior `startDraftPick`:** Container detects `!store.active` on mount, calls `router.back()` (and logs a dev warning).
- **Hardware-back from `library-pick-draft`:** No explicit `cancel()` — the store stays "live" so detail screens can still consume callbacks if user navigated to one. `cancel()` only happens on `training-new` unmount.
- **Re-opening picker after entering some IDs:** `startDraftPick` is called fresh each time with current `exerciseIds`/`seriesIds`. The store's `addedExerciseIds`/`addedSeriesIds` Sets are reset at start. No stale-state risk.
- **Doppel-Add:** the `prev.includes(id)` guards inside the parent callbacks make adds idempotent.
- **Removing a series in training-new (X on `MethodicalSeriesBlock`):** removes the series from `seriesIds` AND filters its exercises from `exerciseIds` (matching the existing `useRemoveMethodicalSeriesFromTraining` semantics, but local).
- **Removing a standalone exercise:** filters from `exerciseIds` only. (If that exercise also belongs to a not-picked series, it stays unaffected — same logic as the existing training detail.)

## Risks

1. **Detail-screen mode-branching complexity.** Three modes (`draft-pick`, `training-pick`, `view`) in `exercise-detail` and `series-detail`. Mitigation: compute `mode` once at the top of each screen, branch CTA-handlers off it; everything else stays mode-agnostic.
2. **Backend single-POST for both relations.** Strapi v5 should accept connecting `exercises` and `methodicalSeries` in one POST, but if it returns 400, fallback to two-step (POST training without series, PUT to connect series). Verify in implementation.
3. **`draftPickStore` cancellation timing.** Cancel happens on `training-new` unmount. If a future flow opens `library-pick-draft` from somewhere other than `training-new`, the store needs that callsite to also handle `cancel()`. Note in store JSDoc.

## Test Plan (manual)

Pflichtflows:

- [ ] Library-Tab → Übung-Card `+` → TrainingPickerSheet → "Neues Training" → preselect-Übung sichtbar im Form, Erstellen funktioniert
- [ ] Library-Tab → Series-Card `+` → TrainingPickerSheet → "Neues Training" → preselectSeries: Series + alle ihre Übungen sichtbar als `MethodicalSeriesBlock`, Erstellen connectet beides im Backend
- [ ] training-new → "Auswählen" → library-pick-draft öffnet → +Übung, +Series funktioniert mit Checkmarks → Fertig → zurück, neue Items im Form
- [ ] In library-pick-draft: Card-Tap → exercise-detail → "Hinzufügen"-CTA → schließt zurück, Übung im training-new
- [ ] In library-pick-draft: Card-Tap → series-detail → "Hinzufügen"-CTA → schließt zurück, Series + Übungen im training-new
- [ ] In library-pick-draft → series-detail → einzelne Übung mit `+` adden → Übung im training-new (ohne Series)
- [ ] training-new ohne Spieler erstellbar (canCreate ohne playerIds.length-Check)
- [ ] X-Button auf `MethodicalSeriesBlock` in training-new entfernt Series + dazugehörige Übungen aus lokalem State
- [ ] X-Button auf Standalone-Übung entfernt nur diese
- [ ] Hardware-Back aus library-pick-draft → kommt zurück zu training-new ohne Crash, Form-State intakt
- [ ] "Abbrechen" auf training-new → keine Backend-Spuren (kein Draft hinterlassen)

Regression-Checks:

- [ ] Existing-training-pick (von einem bestehenden Training aus Library hinzufügen) funktioniert noch — `LibraryPickerContainer` unverändert
- [ ] Player-Picker (Multi-Select) funktioniert noch — `pickModeStore` ohne `startAdd`-Teil
- [ ] Library-Browse-Mode (Tab) funktioniert noch — `LibraryBrowseContainer` unverändert
- [ ] exercise-detail aus Library-Tab geöffnet (no trainingId, no draft) → kein Add-CTA, nur read-only
- [ ] series-detail aus existing-training-pick → Add-CTA mutate-mode (alter Pfad)

## Out of Scope

- Test-Setup / Storybook (deferred, separater Cycle)
- `MethodicalSeriesBlock` Refactoring (verwenden wie es ist)
- Andere Entry-Points zu `library-pick-draft` als `training-new` (kein anderer Caller geplant)
- Migration der bestehenden leeren Drafts (gibt's noch keine, weil bisheriger Flow eh broken war)
