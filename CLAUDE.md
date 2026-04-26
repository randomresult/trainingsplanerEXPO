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

### Library / Picker split (to be unified — see roadmap Item X)
Two screens currently serve "add exercise to training":
- `app/(tabs)/library/index.tsx` — browse mode, `+` → TrainingPickerSheet
- `app/exercise-picker.tsx` — pick mode (from training screens), `+` → direct add via `usePickModeStore`

Any new filter, content type, or UI improvement must land in **both** until the unification
cycle is done. After unification, `exercise-picker.tsx` and `usePickModeStore` are deleted.

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
