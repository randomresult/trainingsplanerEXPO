---
name: SP-Polish — UX Redesign + Polish Pass
description: Visual direction shift to "Fitness Immersive" (B), rework Trainings list / Library cards / Execute screen / sheets, plus polish backlog
type: design
date: 2026-04-23
---

# SP-Polish Design

## Overview

Following the C1 Design System Foundation (primitives + tokens + screen migration, already merged), this pass implements the accumulated UX redesigns and polish items from `docs/ui-thoughts.md`. The main shift: adopt a **"Fitness Immersive" visual direction (B)** — bigger cards, expressive typography, avatar-stacks, colored focus tags — in contrast to the earlier neutral Linear-style. Trainer workflow is reshaped: filter chips are dropped, completed trainings move to their own History screen, the live-training execute screen is simplified to a pure checklist with editable minute inputs, and a new completion screen replaces the immediate redirect-to-list.

### In Scope

- **Trainings list redesign** (Hero + Compact cards, no filter chips, agenda ordering)
- **History screen** (new, infinite scroll with month sections)
- **Create flow** (Plus-icon in header, hero ghost card empty-state, auto-scroll + pulse + toast on success)
- **Library redesign** (L1 compact-expressive cards with focus-area icons, header simplification)
- **Execute-Screen redesign** (EX1 pure checklist, no individual timers, no pause, editable minutes per row, flag-icon finish action, inline-expand with media thumbnails)
- **Completion screen** (new, hero-card AS1 style with checkmark-circle, stats, avatars, back-to-list CTA)
- **Add-Exercises / Add-Players sheets** (unified card style, Add-Players sheet is new, available on detail + execute)
- **PlayerSelector + ExerciseSelector refactor** (to card-style, consistent with sheets)
- **Tab-bar filled-when-active icons**
- **Polish** — Library double-header, keyboard dismiss, create-sheet bottom padding

### Out of Scope

- Motion pass (C2): spring-navigation, layout animations, skeleton loaders, swipe-actions, pull-to-refresh, header-blur, Skia highlights
- Strapi `<p>`-tag cleanup — user will handle content-side in Strapi admin, no FE regex strip
- Player-role / player-app view (SP2)
- Dashboard beyond current placeholder (SP2)
- Multi-club picker (SP2)
- Library aggregation "Spieler X hat Übung Y N-mal gemacht" (SP2)
- Archive pagination with explicit limit (YAGNI — reconsider when 500+ entries real)
- Dark/light mode switching (Dark-only stays)

## 1. Trainings Tab

### List Contents

- **Only upcoming and in_progress** trainings in the main list
- Completed trainings are never shown here; they live on the `/trainings/history` screen
- Empty state: no trainings → hero-sized ghost card centered, with `add` icon + "Dein erstes Training erstellen" text, tap opens CreateTrainingSheet

### Order

Chronological ascending — the soonest training is at the top. No section headers in this list (the list is expected short and purely future-facing).

### Card Structure (B1 — Hero + Compact Stack)

**First entry (soonest upcoming)** — Hero card:
- Container: elevated card, `rounded-2xl`, with a subtle violet-to-transparent linear gradient background from top-left to bottom-right (decorative, low-contrast)
- Title: Training name in `title1` weight-bold
- Eyebrow: "Morgen · 22.04." / "Heute · 20:00" etc., in `subhead` muted
- Avatar-Stack: up to 5 player initial-avatars overlapping (`size="md"`), "+N" circle if more
- Metadata row (icons + text, `footnote` muted): `calendar-outline` weekday/date, `people-outline` N Teilnehmer, `fitness-outline` M Übungen
- Bottom-right CTA text (plain, not a nested pressable): "Öffnen" or "Fortsetzen" depending on status
- Taps anywhere on the card open training detail
- In_progress: additional small `Badge variant="warning-soft"` "Läuft" top-right

**Subsequent entries** — Compact card (same visual language, ~80-100px tall):
- Title: Training name in `headline`
- Avatar-Stack: up to 3 avatars + "+N"
- Metadata row same as hero but tighter
- No gradient background

### Header

- Left: (no back button — this is a tab root)
- Title: `<Text variant="largeTitle" weight="bold">Training</Text>` in screen body top, no stack header (or stack header shown with same name; final decision: hide stack header, use in-screen largeTitle for visual impact, matches Apple Fitness / Mail pattern)
- Right in header: two icon buttons
  1. `time-outline` → navigate to `/trainings/history`
  2. `add` → open CreateTrainingSheet

### Create Flow Feedback

After successful create:
1. Sheet dismisses
2. List refetches (TanStack invalidate)
3. Automatic scroll to the new training's position in the list (via `FlatList.scrollToItem`)
4. Brief pulse animation on the new card (opacity + scale spring, 400ms)
5. Toast `toast.success('Training erstellt')`

## 2. History Screen

New screen at `/trainings/history`.

- Reached via `time-outline` icon in Trainings-Tab header
- Lists only **completed** trainings
- **Infinite scroll** using TanStack `useInfiniteQuery`, pageSize 30
- **Monats-section-headers** (`Juni 2026`, `Mai 2026`, etc.) as sticky section headers while scrolling the group
- Card style: same compact card as Trainings list (no hero, no gradient), chronologically descending within each month section
- Completed cards have `checkmark-circle` icon top-right instead of "Läuft" badge

### Header

- Left: standard back button (chevron-back) — navigates back to Trainings-Tab
- Title: "Verlauf" in stack header
- Right: no actions

## 3. Library Tab

### Header Fix

Current state: in-screen `<Text variant="largeTitle">Bibliothek</Text>` duplicates the stack header. Resolution: **hide the in-screen large title**, keep stack header "Bibliothek". The search input becomes the first row directly under the stack header.

### List Structure (L1 — Compact-Expressive Cards)

Each exercise is a card:
- Icon-circle left: 40×40 colored circle based on primary focus area (if any). Focus-area color mapping (see 3.1). If no focus, use `muted`-tint with first-letter of exercise name.
- Name: `headline`
- Description-preview: `footnote` muted, max 2 lines
- Metadata row: `time-outline` Minutes · Difficulty badge (if present) · Focus-Tag (first focus only) as small pill
- Tap navigates to `/library/[id]` (full-screen detail)

### Focus-Area Color Mapping (Deterministic)

Since focus-area names are user-generated in Strapi and we don't know the full set, derive color from name via deterministic hash:

- Palette: 6 fixed tokens (`primary`, `info`, `success`, `warning`, `destructive`, `muted`)
- Hash = sum of char codes of focus-area name, modulo 6 → index into palette
- Stable: same focus-area always gets same color

### Search / Keyboard Handling

- `FlatList` with `keyboardShouldPersistTaps="handled"` — tap a card doesn't require first dismissing keyboard
- `Pressable` wrapper on the FlatList's ContentContainer calling `Keyboard.dismiss()` on tap (tap empty area to close keyboard)

### Detail Screen

No structural change. Keep full-screen detail at `/library/[id]`. Rendering of Steps + Hint as already built in C1 (Card per step with numbered badge, Hint as warning-tinted card with `bulb-outline`). The Strapi `<p>`-tag issue is handled content-side in Strapi admin — frontend renders what it gets as-is.

## 4. Exercise Browsing (Unified — U4)

**Shared ExerciseCard component** used in:
- Library list
- AddExercisesSheet (with trailing Add-button)
- Other future exercise-listing places

Card dimensions identical in both contexts. Width adapts to container.

**Detail:**
- Library list → tap card → full screen `/library/[id]`
- AddExercisesSheet → tap card (anywhere except add-button) → also navigates to `/library/[id]` (stack-navigation from sheet allowed) OR remains in sheet with no detail (decision: **stay in sheet**, rely on card's always-expanded metadata for decision-making; user who needs deeper detail knows to use Library tab)

## 5. Execute Screen (EX1 — Expressive Checklist)

Complete redesign. Previous architecture (hero current-exercise card + exercise list + session/exercise timers + pause/resume) is gutted.

### Layout

**Header (sticky):**
- Left: `chevron-back` icon → `router.back()`
- Center: Training-Name in `subhead` bold + Session-Timer in `title1` bold, warning-color (orange) — matches the active/live connotation
- Right: `flag-outline` icon → "Training beenden?" confirm dialog → Abschluss-Screen

**Body (scrollable):**
- List of all training exercises as cards (always same card-size, matches library card style)
- Each card:
  - Left: Checkbox (tap toggles completed state; haptic)
  - Middle: Exercise name (`headline`), Description preview (2 lines `footnote` muted) when not expanded
  - Right: **editable minute input** (e.g. `TextInput` with numeric keyboard, styled as "15 min" chip; tap to edit, submit on blur)
  - Trailing chevron: tap on card (not checkbox, not minute input) expands/collapses inline
- When expanded: description full text + numbered Steps + Hint (warning-tinted inline block) + **media thumbnails**
- Only one card expanded at a time (expanding another closes the previous)

### Media in Expand (M2)

Steps/description may contain images or videos. Render as:
- Images: 120×80 thumbnail, tap opens fullscreen image-viewer modal with pinch-zoom
- Videos: 120×80 thumbnail with `play` overlay, tap opens fullscreen video-player modal

Fullscreen modals are new, minimal (`expo-image`'s viewer + `expo-av`'s Video component if not already present). If avoiding another dep: use React Native `Modal` + `Image`/`Video` manually.

### Editable Minute Input

Per-exercise minute defaults to `exercise.Minutes` from Strapi. User can tap to edit. On blur/submit, value is stored in local execution state. When training is ended, these edited minutes are persisted as part of the player-progress data (per-exercise-minute) — backend already accepts `completedExerciseIds`; we extend the payload to include per-exercise minutes. **This is a backend schema consideration**; if complex to add, defer to SP2 and only use edited minutes for display/session-level aggregation.

### No Pause/Resume

Gone. Session-Timer runs continuously from training start until finish.

### Session Timer

Single timer. Starts when training is started (on prior screen via `useStartTraining` mutation that sets `startedAt`). Displays elapsed since `startedAt` via interval. No pause-state; timer reflects wall-clock elapsed.

### End Training Action

Top-right `flag-outline` tap:
1. Web: `window.confirm('Training beenden?')`
2. Native: `Alert.alert('Training beenden?', 'Das Training wird abgeschlossen.')`
3. On confirm: trigger complete mutation (current `useCompleteTraining` backend call) → navigate to `/trainings/completed/[id]` (new route) → Abschluss-Screen

No sticky bottom "Training beenden" button.

### "+ Übung hinzufügen" During Execute

Remains — opens AddExercisesSheet (already built in C1). Placed as a secondary-styled Button at the bottom of the exercise list (no longer a special dashed-border override).

### "+ Spieler hinzufügen" During Execute

New — opens AddPlayersSheet. Accessible via a small button near the avatar-stack in the header (or as a secondary button below the exercise list, next to the Add-Exercise button).

## 6. Completion Screen (AS1)

New route: `/trainings/completed/[id]`.

### Layout

- Full-screen, centered-column layout
- `Screen` wrapper with `scroll`
- Top margin ~80px
- Icon: `checkmark-circle`, 96px size, success color, with `size="xl"` tokenized variant
- Title: `<Text variant="largeTitle" weight="bold">Training beendet</Text>`
- Subtitle: Training-Name in `title3` muted
- Stats-Row (horizontal): 3 equal columns
  - Column 1: `time-outline` 18px → Dauer ("45 Min") in `body` bold, label "Dauer" in `caption1` muted
  - Column 2: `people-outline` → Teilnehmer ("8") + "Teilnehmer"
  - Column 3: `fitness-outline` → Übungen ("6 / 8") + "Übungen" (completed / total)
- Avatar-Stack: all participants (size="md"), with names as tooltip (no native tooltip; show initials cleanly)
- Primary Button: "Zurück zur Trainings-Liste" → `router.replace('/trainings')`
- Secondary placeholder (disabled, for SP2): "Als Vorlage speichern" with muted styling and small "Bald verfügbar" tag

### Data

Reuses data from `useTrainingDetail(id)` (after completion, status is `completed` and `actualDuration` is set). No additional API needed.

## 7. Add-Players-Sheet (New — P1)

New component: `components/sheets/AddPlayersSheet.tsx`.

### Behavior

- Invoked from Training Detail (`/trainings/[id]`) and Execute (`/trainings/[id]/execute`)
- Bottom sheet with `snapPoints=['90%']`
- Title: "Spieler hinzufügen"
- Body: search input + scrollable list of club's players who are **not yet** in the training
- Each row = player card matching the unified style:
  - Avatar left (with initials)
  - Name (`headline`): `firstname` `Name`
  - Metadata (`footnote` muted): Club name if multiple clubs, Alter if available, otherwise blank
  - Trailing: Add-button (primary, small) "Hinzufügen"
- On add: `useAddPlayerToTraining` mutation (new hook, analogous to `useAddExerciseToTraining`) → `connect` on players relation
- Toast on success

### PlayerSelector / ExerciseSelector Refactor

The existing `components/PlayerSelector.tsx` and `components/ExerciseSelector.tsx` (used inside CreateTrainingSheet) are refactored to use the same card style as the Add-sheets. Each row uses the shared `<ExerciseCard>` / `<PlayerCard>` primitive (see next section).

## 8. Shared Card Primitives

New components to factor out:
- `components/ui/ExerciseCard.tsx` — renders one exercise row; used in Library list, AddExercisesSheet, ExerciseSelector
- `components/ui/PlayerCard.tsx` — renders one player row; used in AddPlayersSheet, PlayerSelector, Training Detail players section

Each accepts a `trailing` slot (for "Hinzufügen"-Button or Checkbox or Remove-X). Body is fixed per card type for visual consistency.

### ExerciseCard Props

```ts
interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;    // navigate to detail
  trailing?: React.ReactNode;  // Add-button, checkbox, etc.
  compact?: boolean;  // if true, smaller variant for dense contexts
}
```

### PlayerCard Props

```ts
interface PlayerCardProps {
  player: Player;
  onPress?: () => void;
  trailing?: React.ReactNode;
  compact?: boolean;
  showRemove?: boolean;   // for Training Detail's X-button
  onRemove?: () => void;
}
```

## 9. Tab Bar

- **Filled icons when active, outlined when inactive.** iOS-native feel.
- Icon names:
  - Home (active `home`, inactive `home-outline`)
  - Library (active `library`, inactive `library-outline`)
  - Trainings (active `fitness`, inactive `fitness-outline`)
  - Profile (active `person`, inactive `person-outline`)
- Active color: `primary` (violet). Inactive: muted.
- Use `focused` flag in `tabBarIcon: ({ focused, color, size }) => ...` to switch icon name.

## 10. CreateTrainingSheet Polish

- Bottom padding of the sheet content increased to respect iOS safe-area-bottom (use `useSafeAreaInsets().bottom` additive padding)
- Submit button "Training erstellen" has comfortable bottom spacing from sheet edge
- Exercise- and Player-selectors refactored to Card-style (as in section 8)

## 11. TrainingCard Component Consolidation

New: `components/ui/TrainingCard.tsx` with two variants:
- `hero`: for the top entry in the Trainings tab (larger, gradient option, more detail)
- `compact`: for subsequent entries and History-screen rows

Props:
```ts
interface TrainingCardProps {
  training: Training;
  variant: 'hero' | 'compact';
  onPress?: () => void;
}
```

The list in Trainings-Tab renders `<TrainingCard variant="hero">` for the first item and `<TrainingCard variant="compact">` for the rest. The History screen renders `<TrainingCard variant="compact">` for all.

## 12. Acceptance Criteria

- Trainings-Tab shows **only upcoming and in_progress** trainings, sorted chronologically ascending
- First entry is visually a Hero-Card; subsequent entries are Compact-Cards
- No filter chips anywhere in Trainings-Tab
- Header has `time-outline` + `add` icons on the right
- Empty state renders hero ghost card with `add` icon
- After successful training create: sheet dismisses, list auto-scrolls to new training with brief pulse, toast shown
- `/trainings/history` exists, renders completed trainings with month-section headers via `useInfiniteQuery`
- Library cards follow L1 style (colored-circle icon, metadata row with focus-tag)
- Library Tab has no duplicate title — stack header "Bibliothek" only; search is first content row
- Tapping Library-search does not require tapping a specific area to dismiss keyboard
- Execute screen has no individual timers and no pause/resume button
- Each exercise row in Execute has editable minute input (tap to edit)
- Expanded exercise in Execute shows Description + Steps + Hint + Media thumbnails
- Tap on image/video thumbnail opens fullscreen viewer
- Top-right `flag-outline` icon on Execute triggers confirm → navigates to new Completion-Screen
- No sticky bottom "Training beenden" button on Execute
- Completion screen exists at `/trainings/completed/[id]` with success-icon, stats-row, avatar-stack, primary-back-button
- AddPlayersSheet is invoked from Training Detail and Execute, analogous to AddExercisesSheet
- CreateTrainingSheet's Exercise- and Player-Selectors use the new shared card primitives
- Tab bar uses filled-when-active icons

## 13. Risks and Open Questions

- **Media fullscreen viewer:** requires either `expo-image` viewer component or manual Modal+Image. Video playback requires `expo-av`. Installing these adds native-module overhead — verify Expo Go 54 compatibility before including. If infeasible for Expo Go, defer media-fullscreen to a later pass (show thumbnails only, tap is no-op with a toast "Bald verfügbar").
- **Per-exercise-minute persistence:** backend may not currently accept per-exercise minutes in the complete payload. Verify; if schema-change needed, defer to SP2 and only show edited minutes client-side for the session.
- **FlatList-in-BottomSheet scroll gesture:** known concern on native (already in ui-thoughts). If scroll issues arise with the new sheets, swap to `BottomSheetFlatList`.
- **Empty-state Hero-Ghost-Card** might feel wrong if the user is a returning trainer with zero future trainings but many past — they'd see the ghost card despite having rich history. Possible mitigation: different empty-state copy ("Kein Training geplant. Letztes Training war am X."), but this requires extra data fetch. Defer.
- **Focus-Area color hash** could produce repeated colors when many focus-areas share the same 6-palette slot. Acceptable for MVP; revisit if user complains.
- **History-screen data-fetch strategy:** Strapi's pagination via `pagination[page]` + `pagination[pageSize]` must be configured. TanStack `useInfiniteQuery` wires `getNextPageParam` from Strapi's `pagination.pageCount`/`pagination.page` meta.

## 14. File Impact Summary

New files:
- `app/(tabs)/trainings/history.tsx`
- `app/(tabs)/trainings/completed/[id].tsx`
- `components/sheets/AddPlayersSheet.tsx`
- `components/ui/TrainingCard.tsx`
- `components/ui/ExerciseCard.tsx`
- `components/ui/PlayerCard.tsx`
- `lib/queries/useAddPlayerToTraining.ts` (or added to existing useTrainings.ts)
- `lib/utils/focusColor.ts` (focus-area color hash)

Modified:
- `app/(tabs)/trainings/index.tsx` (new layout, no filter chips, hero+compact)
- `app/(tabs)/trainings/_layout.tsx` (register history + completed routes)
- `app/(tabs)/trainings/[id]/index.tsx` (AddPlayersSheet integration, player cards use shared primitive)
- `app/(tabs)/trainings/[id]/execute.tsx` (full rewrite per EX1)
- `app/(tabs)/library/_layout.tsx` (title)
- `app/(tabs)/library/index.tsx` (L1 cards, search behavior, no duplicate title)
- `app/(tabs)/_layout.tsx` (filled icons)
- `components/ExerciseSelector.tsx` (refactor to shared ExerciseCard)
- `components/PlayerSelector.tsx` (refactor to shared PlayerCard)
- `components/sheets/CreateTrainingSheet.tsx` (uses refactored selectors + bottom padding fix)
- `components/sheets/AddExercisesSheet.tsx` (uses shared ExerciseCard)
- `lib/queries/useTrainings.ts` (useInfiniteQuery support for history; possibly new mutation for AddPlayer; complete mutation retains route change to completed screen)
