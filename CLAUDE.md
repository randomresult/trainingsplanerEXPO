# Claude Code — Project Notes

## Known Constraints

### BottomSheet does not work inside modal screens
`@gorhom/bottom-sheet` relies on `BottomSheetModalProvider` which lives in the root layout.
When a screen is presented as `presentation: 'modal'` (or `fullScreenModal`), the portal
renders beneath the modal surface — the sheet appears but touch events don't reach it,
or it doesn't render at all.

**Rule:** Never place a `BottomSheet` or `TrainingPickerSheet` inside a screen that has
`presentation: 'modal'` in `app/_layout.tsx`. Use push navigation instead.

Currently affected: `exercise-detail/[id]` was changed from modal → push for this reason.

---

## Architecture Notes

### Library View + Container split (shipped 2026-04-28)
The Library UI is split into a pure presentation component plus per-mode containers:
- `components/screens/LibraryView.tsx` — pure: data + callbacks via props, no hooks beyond local state. Renders search/filter/tab toggle/two FlatLists/`LibraryFilterSheet`.
- `components/screens/LibraryBrowseContainer.tsx` — tab mode. Owns query hooks. `+` → `TrainingPickerSheet`. No mutations.
- `components/screens/LibraryPickerContainer.tsx` — pick mode. Owns query hooks + add mutations + `pickSessionStore`. `+` adds directly to the training.
- `components/screens/library-filters.ts` — shared `tagNames`/`collectTagNames`/`filterExercises` helpers.
- Routes are thin wrappers: `app/(tabs)/library/index.tsx` → `<LibraryBrowseContainer />`, `app/library-pick.tsx` → `<LibraryPickerContainer trainingId={...} trainingName={...} />`.
- Header API on `LibraryView`: a single `pickHeader?: { title, onClose, onDone, doneLabel? }` prop. When set the View renders a pick-mode `Stack.Screen` header. When undefined the inline „Bibliothek" largeTitle renders.

**Pick-session state:** `lib/store/pickSessionStore.ts` tracks `addedExerciseIds` and `addedSeriesIds` for the current picker session. `LibraryPickerContainer` seeds the store via `startSession(trainingId, exerciseIds, seriesIds)` in a `useEffect` that fires whenever `useTrainingDetail` resolves/refetches — so the picker's checkmarks always reflect current server state, including after external removals. `markAdded`/`markSeriesAdded` provide instant optimistic feedback during in-flight mutations; the next refetch re-seeds on top.

`exercise-picker.tsx` and the single-add mode of `usePickModeStore` are deleted.

**Draft-pick state:** When creating a *new* training (`training-new.tsx`), the picker uses `lib/store/draftPickStore.ts` instead of mutations. `LibraryDraftPickerContainer` reads `initialExerciseIds`/`initialSeriesIds` (seeded by `training-new` from its local state) for checkmarks, and adds fire `addExercise`/`addSeries` actions on the store, which call back to `training-new`. Cancellation happens on `training-new` unmount; the store stays alive while the user is in `library-pick-draft` or a detail screen so callbacks remain consumable.

`exercise-detail` and `series-detail` have three modes: `draft-pick` (fires draft store callbacks), `training-pick` (mutates), `view` (read-only with `TrainingPickerSheet` for "Add to training"). Mode is computed once at the top of the file from `draftPickStore.active` + the `trainingId` URL param.

### Training data model (both-arrays)
`training.exercises[]` = ALL exercises, MÜR and standalone — single source of truth for execute/progress.
`training.methodicalSeries[]` = grouping metadata only, no exercises populated.
Grouping is derived client-side by matching `exercise.methodicalSeries[0].documentId`.

### Strapi populate
`populate='*'` only walks one level in Strapi v5. Always spell out nested relations explicitly
(see `TRAINING_POPULATE` in `lib/queries/useTrainings.ts`).

### Expo Router typed routes
New routes under `app/(tabs)/` are not in `.expo/types/router.d.ts` until the dev server
restarts. Use `'/(tabs)/your/route' as any` as a cast until the types regenerate.
