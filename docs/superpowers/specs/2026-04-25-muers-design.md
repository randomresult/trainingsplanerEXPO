---
name: MÜRs — Methodische Übungsreihen
description: Structured exercise sequences (Lernpfade) as blocks in Library and Training views
type: design
date: 2026-04-25
---

# MÜRs — Methodische Übungsreihen (C3)

## Overview

MÜRs (Methodische Übungsreihen) are named containers of ordered exercises that form a learning path. Example: "Vorhand Topspin auf Unterschnitt" with 6 exercises (MÜR 1–6) that build on each other.

**Goal:** Surface MÜRs in the Library as browsable learning paths, and let trainers add them as grouped blocks into trainings — while keeping individual exercise use unchanged.

**Not in scope:** Creating or editing MÜRs in the app. MÜRs are authored in Strapi by trainers (web-only).

---

## Data Model

### Strapi (existing)

`methodische-reihen` content type already exists:
- `name`, `description`, `goal`, `category`
- `exercises[]` — ordered list of exercises in this MÜR

Every exercise already has a back-relation `methodicalSeries[]` (Strapi bidirectional). Empty for standalone exercises, populated for MÜR exercises:
```json
{ "Name": "MÜR 1: Schattenschläge", "methodicalSeries": [{ "id": 1, "name": "Vorhand Topspin auf Unterschnitt" }] }
```

### Strapi (new — one change)

Add `methodicalSeries[]` relation to the `trainings` content type (relates to `methodische-reihen`).

### Frontend Training type

```typescript
export interface MethodicalSeriesRef {
  documentId: string;
  name: string;
}

export interface MethodicalSeries {
  documentId: string;
  name: string;
  description?: string;
  goal?: string;
  category?: string;
  exercises: Exercise[];
}

export interface Exercise {
  // ... existing fields ...
  methodicalSeries?: MethodicalSeriesRef[];  // back-relation, already exists in Strapi
}

export interface Training {
  // ... existing fields ...
  exercises: Exercise[];                   // ALL exercises — MÜR and standalone
  methodicalSeries: MethodicalSeriesRef[]; // which series blocks are in this training (grouping only)
}
```

### Key invariant

- `training.exercises[]` = **all** exercises in the training (single source of truth for execute/progress)
- `training.methodicalSeries[]` = which MÜRs were added as blocks — used only for UI grouping, does NOT populate exercises
- Grouping is derived: exercises where `exercise.methodicalSeries[0].documentId` matches a MÜR in `training.methodicalSeries[]` are shown in that block; rest are standalone

---

## Adding to a Training

### Adding a MÜR as a block
Two writes in one action:
1. Connect MÜR to `training.methodicalSeries[]` (for grouping)
2. Connect all MÜR exercises to `training.exercises[]` (so they participate in execute/progress)

### Adding a single MÜR exercise
- Goes to `training.exercises[]` as standalone
- If `exercise.methodicalSeries[]` is populated, show prompt: "Als Einzelübung oder ganzen Block 'X' hinzufügen?"

---

## Execute Flow (unchanged)

`useTrainingExecution` stays completely untouched. `training.exercises[]` already contains everything:

```typescript
useTrainingExecution(training.exercises);  // no merge needed
```

Progress tracking (PlayerProgress per exercise) is unaffected.

---

## Removing from a Training

### Remove single exercise from a MÜR block
- Disconnect exercise from `training.exercises[]` — same mutation as removing any exercise
- Block counter updates: `(X/total)` where total = MÜR's exercise count, X = how many remain in `training.exercises[]`
- MÜR block header remains, block shrinks

### Remove whole MÜR block
Two writes:
1. Disconnect MÜR from `training.methodicalSeries[]`
2. Disconnect all its exercises from `training.exercises[]`

---

## Library — MÜR Tab

### Toggle
Library screen gets a toggle above the list: **Übungen | Methodische Reihen**

- Default: Übungen (existing view, unchanged)
- Methodische Reihen: new list of MÜR cards

### MÜR List
Larger, visually engaging cards (bigger than exercise cards). **Chosen design: C-1** (see `mockups/series-card-variants.html`).

Card layout:
- **Top row**: category chip (left) · progress pill (right, hidden when 0 exercises done)
  - Partial: lime pill `"3 / 6"` 
  - Complete: green pill `"✓ Fertig"`
- **Body**: series name (prominent, large) · goal text (muted, 2 lines max)
- **Divider**
- **Bottom row**: exercise count `"6 Übungen"` (left) · circular `+` button (right)
- Subtle ghost-number watermark (exercise count, very low opacity behind the card)

Interactions:
- Tap card body → series detail screen
- Tap `+` button → `TrainingPickerSheet` (add whole series to a training, same sheet as exercises)

Progress pill derives from `PlayerProgress`: count of series exercises the current user has ever completed across all trainings.

### MÜR Detail Screen
Route: `app/(tabs)/library/muers/[id].tsx`

- Hero area: MÜR name + goal + description
- Overall progress indicator (`3 / 6 abgeschlossen`)
- Ordered list of exercises (numbered 1–N), each row shows:
  - Exercise name
  - Completion indicator (✓ done / ○ not yet) — derived from PlayerProgress across all trainings
  - Tappable → exercise detail screen
- `+` button / "Ganze Reihe hinzufügen" CTA always visible (opens TrainingPickerSheet)

### MÜR exercises in Übungen tab
MÜR exercises appear normally in the Übungen list. A small generic indicator (icon or label "MÜR") marks them as part of a learning path — no MÜR name shown inline to keep the list clean.

From the **exercise detail screen** only: show a tappable section "Teil der Methodischen Reihe: Vorhand Topspin Basics" that navigates to the MÜR detail.

---

## Training Views — MÜR Block Component

A `MuerBlock` component renders a collapsible grouped block:

```
┌── Vorhand Topspin Basics (4/6) ──────── [•••] ┐
│  ○ MÜR 1: Schattenschläge Vorhand             │
│  ○ MÜR 2: Topspin gegen gehaltenen Ball       │
│  ○ MÜR 3: Topspin gegen Zuspiel               │
│  ○ MÜR 4: Schupf-Topspin Grundrhythmus        │
└───────────────────────────────────────────────┘
```

- Collapsible (tapping header toggles expanded/collapsed)
- `(4/6)` = how many of the MÜR's exercises are present in this training / total exercises in the MÜR
- `[•••]` action menu: "MÜR entfernen"
- Each exercise in the block has an individual remove button (edit/detail mode only)
- In execute mode: exercises show checkboxes. Completion is tracked in the global counter at the top of the execute screen (not per-block)

Used in:
- Training detail (view mode)
- Training edit (with remove actions)
- Execute screen

---

## Queries

### New: `useMethodischeReihen`
```typescript
// List all MÜRs
GET /api/methodische-reihen?populate[exercises][populate]=*

// Single MÜR detail
GET /api/methodische-reihen/:documentId?populate[exercises][populate]=*
```

### Updated: `useTrainingDetail`
Add `populate[methodicalSeries][populate][exercises]=*` to existing training detail query.

---

## Progress Tracking

MÜR completion is derived client-side: a MÜR block is "complete" when all its exercises have a matching PlayerProgress entry for this training.

No Strapi changes needed. The existing `PlayerProgress` model already has a `methodicalSeries` relation field (currently unused — can be populated in the future for badge/achievement queries).

---

## Out of Scope

- Creating or editing MÜRs in the app (Strapi web only)
- Progress badges / achievements (future, foundation is ready)
- Reordering exercises within a MÜR block
- Partial MÜR progress persisted to Strapi (client-side only for now)
- MÜR-based filtering in the Übungen tab

---

## Acceptance Criteria

- `npx tsc --noEmit` clean
- Library toggle Übungen ↔ Methodische Reihen works
- MÜR list loads and shows all MÜRs from Strapi
- MÜR detail shows ordered exercises
- MÜR exercises in Übungen tab show "Teil von: X" badge
- Adding a MÜR as block writes only to `training.methodicalSeries[]`
- Adding a single MÜR exercise writes to `training.exercises[]` (with prompt)
- Training detail renders MÜR blocks collapsible
- Execute screen receives flat merged list, progress tracking unchanged
- Removing single exercise shows partial block (X/Y)
- Removing whole block removes MÜR from training
