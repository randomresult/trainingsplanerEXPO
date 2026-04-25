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
export interface MethodischeReihe {
  documentId: string;
  name: string;
  description?: string;
  goal?: string;
  category?: string;
  exercises: Exercise[];
}

// Exercise gets optional back-relation
export interface Exercise {
  // ... existing fields ...
  methodicalSeries?: Pick<MethodischeReihe, 'documentId' | 'name'>[];
}

export interface Training {
  // ... existing fields ...
  exercises: Exercise[];           // standalone exercises only
  methodicalSeries: MethodischeReihe[];  // MÜR blocks (with exercises populated)
}
```

### Key invariant

- `training.exercises[]` = standalone exercises (individual adds, including individual MÜR exercises added solo)
- `training.methodicalSeries[]` = MÜR blocks added as a group (exercises NOT duplicated in exercises[])

---

## Adding to a Training

### Adding a MÜR as a block
1. Write MÜR to `training.methodicalSeries[]`
2. Do NOT add individual exercises to `training.exercises[]`

### Adding a single MÜR exercise
- Goes to `training.exercises[]` as a standalone exercise
- If the exercise has `methodicalSeries[]` populated, show prompt: "Als Einzelübung oder ganzen Block 'X' hinzufügen?"

---

## Execute Flow (unchanged)

`useTrainingExecution` stays untouched. The execute screen merges both sources before passing in:

```typescript
const allExercises = [
  ...training.methodicalSeries.flatMap(s => s.exercises),
  ...training.exercises,
];
useTrainingExecution(allExercises);
```

Progress tracking (PlayerProgress per exercise) is unaffected.

---

## Removing from a Training

### Remove single exercise from a MÜR block
- Exercise is removed from `training.methodicalSeries[i].exercises`
- MÜR block remains, header shows "(4/6 Übungen)"
- No confirmation dialog — trainer acts deliberately

### Remove whole MÜR block
- "MÜR entfernen" action on block header
- Removes MÜR from `training.methodicalSeries[]`

---

## Library — MÜR Tab

### Toggle
Library screen gets a toggle above the list: **Übungen | Methodische Reihen**

- Default: Übungen (existing view, unchanged)
- Methodische Reihen: new list of MÜR cards

### MÜR List
Larger, visually engaging cards (bigger than exercise cards). Each card shows:
- Background image or category-based visual
- MÜR name (prominent)
- Goal ("Ziel: …")
- Exercise count ("6 Übungen")
- Badge/reward indicator if player has completed this MÜR

Tapping a card → MÜR detail screen (no in-list accordion — detail screen is the right home for exercise list).

### MÜR Detail Screen
Route: `app/(tabs)/library/muers/[id].tsx`

- Hero area: MÜR name + goal + description
- Badge/reward shown if player has completed this MÜR
- Ordered list of exercises (numbered 1–6), each tappable → exercise detail
- "Ganze Reihe zum Training hinzufügen" CTA (only in pick mode)

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
