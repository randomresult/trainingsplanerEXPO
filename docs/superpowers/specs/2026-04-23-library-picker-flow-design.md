# Library-Picker Flow — Design Spec

**Datum:** 2026-04-23
**Branch:** `feature/library-picker` (wird aus `main` nach SP-Polish-Merge erstellt)
**Vorgänger:** `feature/sp-polish` (SP-Polish abgeschlossen, geht in diesen Cycle über)

## Goal

Die Übungsauswahl wird aus dem kaputten `ExercisePickerSheet` herausgelöst und in den bestehenden Library-Tab integriert. Die Library ist künftig **sowohl** der Browse-Screen als auch der Picker für alle Flows, die Übungen auswählen (Training erstellen, mid-session hinzufügen, später Wizard). Zusätzlich redesignen wir den Create-Training-Screen, so dass ausgewählte Übungen und Spieler als Inline-Liste mit Remove-Button sichtbar sind statt nur als Zähler.

## Non-Goals

- **Spieler-Picker-Refactor** — der aktuelle `PlayerPickerSheet` (Auto-Apply Bottom-Sheet) bleibt. Spieler-Verwaltung wird separat angegangen, wenn Bedarf für Filter kommt.
- **Wizard** („Vorhand verbessern", „Topspin") — bleibt zukünftig. Die Library-Pick-Architektur öffnet die Tür, der Wizard selbst ist ein eigener Cycle.
- **Exercise-Creation** (neue Übung direkt in der Library anlegen) — Future.
- **Swipe-to-Delete** auf den Inline-Listen — Remove-Button reicht für diesen Cycle, Swipe ist als `C2`/Motion-Cycle geplant.

## Architecture

### Route-Param als Modus-Trigger, Zustand-Store als State-Owner

Die Library-Screen wird durch `?mode=pick` in einen Selektions-Modus versetzt. Die tatsächliche Auswahl lebt in einem Zustand-Store (`usePickModeStore`). Der Caller initialisiert den Store beim Navigieren und bekommt das Ergebnis via Callback zurück.

```
Create-Form                         Library (mode=pick)
  │                                  │
  │ pickModeStore.start(              │
  │   currentIds,                     │
  │   (newIds) => setExerciseIds(...) )
  │                                  │
  │ router.push('/library?mode=pick')│
  │ ───────────────────────────────► │
  │                                  │ reads store, shows checkmarks
  │                                  │ tap toggles → store.toggle(id)
  │                                  │ tap Fertig(N) → store.confirm()
  │                                  │      │
  │                                  │      └─ calls onConfirm(newIds)
  │                                  │         clears store
  │                                  │         router.back()
  │ ◄────────────────────────────────│
  │ setState runs (closure captured) │
  │ sections re-render               │
```

### Library erhält doppelte Rolle

| Aspekt              | Normal-Modus                  | Pick-Modus                           |
|---------------------|-------------------------------|--------------------------------------|
| Header-Right        | *(leer)*                      | `Fertig (N)` — committed Auswahl     |
| Card-Trailing       | `+` → TrainingPickerSheet     | Checkmark (ausgewählt/nicht)         |
| Card-Tap            | → Detail-Screen               | Toggle Selektion                     |
| Detail-Screen CTA   | `+ Zum Training hinzufügen`   | *(Detail-Nav deaktiviert im Pick)*   |
| Filter              | aktiv (gleich)                | aktiv (gleich)                       |

Detail-Navigation im Pick-Mode ist deaktiviert, damit der User nicht aus Versehen aus dem Flow herausgleitet. Einziger Weg zurück: Fertig oder Cancel.

### Create-Form-Flow: Neues Training aus Library-Übung

User tippt `+` auf eine Übung in der normalen Library. Der `TrainingPickerSheet` öffnet sich mit existierenden draft/in-progress Trainings plus Option „Neues Training erstellen". Letzteres navigiert zu `/trainings/new?preselect=<exerciseId>&returnTo=library`. Der Create-Screen liest die Route-Params, fügt die Übung initial in seine Liste ein. Nach Submit navigiert `router.replace('/library')` zurück zum Ausgangspunkt plus Toast „Training X erstellt".

## User Flows

### Flow 1: Multi-Select aus Create-Training-Form

```
/trainings/new                       Library Tab
  │                                   │
  [Tap "Auswählen" bei Übungen]      │
  │  pickModeStore.start([P1,P2],    │
  │    setExerciseIds)               │
  │  router.push(                    │
  │    '/library?mode=pick')         │
  │ ────────────────────────────────►│
  │                                  [Header zeigt "Fertig (2)"]
  │                                  [P1, P2 haben Checkmark]
  │                                  [User tappt D → checked]
  │                                  [User tappt P1 → unchecked]
  │                                  [Header zeigt "Fertig (2)"]
  │                                  [Tap "Fertig (2)"]
  │                                  │  store.confirm()
  │                                  │  onConfirm([P2, D])
  │                                  │  store cleared
  │                                  │  router.back()
  │ ◄────────────────────────────────│
  [Liste zeigt P2, D als Rich-Row]   │
```

### Flow 2: Single-Add aus Library Normal-Modus

```
Library (normal)
  │
  [Tap "+" auf P]
  │
  <TrainingPickerSheet>
  │  - draft/in-progress Trainings (max 5 + scroll)
  │  - "Neues Training erstellen"
  │
  Option A: Tap existing Training T1
  │  useAddExerciseToTraining.mutate({trainingId: T1, exerciseId: P})
  │  Sheet schließt
  │  Toast: "Passspiel zu T1 hinzugefügt"
  │  User bleibt in Library
  │
  Option B: Tap "Neues Training erstellen"
  │  Sheet schließt
  │  router.push('/trainings/new?preselect=P&returnTo=library')
  │
  │  /trainings/new
  │    Form zeigt P als einzigen Übungs-Eintrag in der Liste
  │    User füllt Name, Datum, fügt Spieler hinzu
  │    [Submit "Training erstellen"]
  │    createTraining.mutate(...)
  │    onSuccess → router.replace('/library')
  │    Toast: "Jugendtraining erstellt · mit Passspiel"
```

### Flow 3: Single-Add aus Library Detail-Screen

```
Library Detail /library/P
  │
  [Übersicht mit Beschreibung, Steps, Videos]
  [Fester Bottom-CTA: "+ Zum Training hinzufügen"]
  [Tap CTA]
  │
  <TrainingPickerSheet>
  (gleich wie Flow 2)
```

## Component Changes

### New Files

```
lib/store/pickModeStore.ts
components/sheets/TrainingPickerSheet.tsx
components/ui/FilterChip.tsx            // kleine Helfer-Component
components/sheets/LibraryFilterSheet.tsx // das ⚙ Filter-Sheet
```

### Modified Files

```
app/(tabs)/library/_layout.tsx
app/(tabs)/library/index.tsx
app/(tabs)/library/[id].tsx
app/(tabs)/trainings/new.tsx
```

### Deleted Files

```
components/sheets/ExercisePickerSheet.tsx  // Library ersetzt ihn
```

## Data / State Model

### `lib/store/pickModeStore.ts`

```ts
import { create } from 'zustand';

type OnConfirmCallback = (ids: string[]) => void;

interface PickModeStore {
  active: boolean;
  selectedIds: string[];
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

  cancel: () =>
    set({ active: false, selectedIds: [], onConfirm: undefined }),
}));
```

### Library-Filter-State

Filter bleiben lokal im Library-Screen (useState / useReducer), unabhängig vom Pick-Mode. Sie persistieren während der Session via React-Query-Cache der gefilterten Suche, werden beim Tab-Wechsel nicht resettet.

Filter-Dimensionen:
- **Fokus** (multi-select): alle bekannten `focus.Name`-Werte, dynamisch aus den Daten
- **Schwierigkeit** (single-select): `Einfach` / `Mittel` / `Schwer` — direkt aus `Difficulty`-Feld
- **Dauer** (single-select): `bis 10 Min` / `10–20 Min` / `20+ Min` — client-seitige Range-Filter

Aktive Filter werden server-seitig abgeschickt wo möglich (Strapi v5 `filters` auf skalare Felder funktioniert), sonst client-seitig nach dem Fetch gefiltert. Erstmal alles client-seitig, Server-Filter ist Performance-Optimierung.

## Behavior Details

### Fertig / Cancel

- **Tap "Fertig (N)"** → `usePickModeStore.confirm()` → ruft `onConfirm(selectedIds)` → store geleert → `router.back()`
- **Tap "‹ Zurück" / Swipe-back / Hardware-Back** → `usePickModeStore.cancel()` → keine Änderung committed → store geleert → Nav zurück
- **Tab-Switch während Pick-Mode** → Store bleibt aktiv. User kann zurückkommen. Wenn der Caller-Screen inzwischen unmounted ist, feuert `onConfirm` einen State-Setter der nicht mehr existiert — React ignoriert das harmlos (die Closure ist weg). Edge-Case dokumentiert, keine Spezial-Handling.

### Library in Pick-Mode — Detail-Zugriff

Im Pick-Mode ist Tap-to-Detail deaktiviert (Card-onPress = Toggle statt Navigate). Grund: User ist in einem Selektions-Flow, Detail-Sicht würde den State-Management-Scope sprengen. Wenn User Details sehen will → Cancel → Normal-Modus → Tap-auf-Card → Detail → zurück → Pick-Modus neu starten.

Alternative nach Feedback: Long-Press im Pick-Mode öffnet Detail-Sheet (nicht Detail-Screen). Aus Scope raus für jetzt.

### Training-Picker-Sheet — Empty State

Wenn keine draft/in-progress Trainings existieren zeigt das Sheet nur „Neues Training erstellen" sichtbar, mit Hinweis-Text darüber: „Du hast noch kein anstehendes Training."

### `/trainings/new` pre-select

- Route-Param `preselect=<exerciseId>` wird beim Mount einmal gelesen, die Übung via Einzel-Query geladen und in `exerciseIds` initialisiert.
- Fehler (Übung existiert nicht / gelöscht): der Create-Screen öffnet trotzdem normal, der `preselect` wird stumm ignoriert.
- Route-Param `returnTo=library` steuert das `onSuccess`-Target der Create-Mutation: `router.replace('/library')` statt der standard `/trainings?scrollToId=...` Navigation.

### Create-Screen — Inline-Listen

#### Übungen-Section (rich)
```tsx
<View className="flex-row justify-between items-center mb-2 mt-4">
  <Text variant="subhead" weight="semibold">Übungen ({exerciseIds.length})</Text>
  <Button variant="ghost" size="sm" leftIcon="search-outline"
          onPress={() => openPickMode()}>Auswählen</Button>
</View>
{loadedExercises.map(ex => (
  <Card className="flex-row items-center gap-2 mb-1" key={ex.documentId}>
    <FocusDot color={focusColorFromName(ex.focus?.[0]?.Name)} initial={ex.Name[0]} />
    <View className="flex-1">
      <Text variant="footnote" weight="semibold">{ex.Name}</Text>
      <Text variant="caption1" color="muted">{ex.Minutes} Min · {ex.focus?.[0]?.Name}</Text>
    </View>
    <RemoveButton onPress={() => removeExercise(ex.documentId)} />
  </Card>
))}
{exerciseIds.length === 0 && (
  <Text variant="footnote" color="muted">Noch keine Übungen</Text>
)}
```

#### Spieler-Section (minimal)
```tsx
<View className="flex-row justify-between items-center mb-2 mt-4">
  <Text variant="subhead" weight="semibold">Spieler ({playerIds.length})</Text>
  <Button variant="ghost" size="sm" leftIcon="search-outline"
          onPress={() => openPlayerPicker()}>Auswählen</Button>
</View>
{loadedPlayers.map(p => (
  <View className="flex-row items-center py-1.5 border-b border-border" key={p.documentId}>
    <Text variant="footnote" className="flex-1">{p.firstname} {p.Name}</Text>
    <Pressable onPress={() => removePlayer(p.documentId)} hitSlop={6}>
      <Icon name="close" size={14} color="muted" />
    </Pressable>
  </View>
))}
```

Die `loadedExercises` / `loadedPlayers` werden im Create-Screen via `useExerciseById(id)` / `usePlayerById(id)` für jedes Element in `exerciseIds` / `playerIds` geladen. React-Query dedupliziert Requests und nutzt den Cache der Library/Spieler-Listen-Queries mit, wenn die Items schon dort geladen wurden. Falls die Item-Queries noch laufen, zeigt der Card-Placeholder einen Skeleton-Zustand (TextInput-Größe Card ohne Inhalt).

## Testing

Dieses Projekt hat keinen Test-Runner — Validierung erfolgt via:

- `npx tsc --noEmit` nach jedem Step
- Manuelles Testing auf Expo Web + Expo Go iOS
- Flow-Check: alle drei Flows (Multi-Select, Single-Add bestehend, Single-Add Neu)
- Edge-Cases: Cancel aus Pick-Mode, Tab-Switch während Pick, Empty-State Training-Picker, ungültige preselect-ID

## Out of Scope / Future

- Wizard-Flow (Vorhand verbessern etc.) — eigener Cycle, nutzt Library Pick-Mode als Baustein
- Spieler-Picker-Refactor (Library-artige Struktur für Spieler) — separate Diskussion
- Swipe-to-Delete auf Inline-Listen — Motion-Cycle (C2)
- Server-seitige Filter (Strapi `filters` API) — Performance-Optimierung, wenn nötig
- Exercise-Creation-Flow in Library — Future-Feature
- Library-Pick-Mode-Detail-Sheet (Long-Press zeigt Details) — Future wenn User-Feedback kommt

## Open Questions

- **Dauer-Filter-Buckets**: sind `bis 10 / 10–20 / 20+ Min` die richtigen Grenzen, oder doch `kurz / mittel / lang` ohne konkrete Minuten? → erstmal konkrete Minuten, iterierbar.
- **Training-Picker-Sheet — Limit der angezeigten Trainings**: alle draft+in_progress (kann viele werden) oder die nächsten 5 mit Scroll? → erstmal alle, FlatList virtualisiert sowieso.
- **Pre-Select-Duplikate**: Was wenn User mit `preselect=P` navigiert und P eh schon gewählt wurde (nicht der Fall bei Neu-Erstellung, aber generisch): idempotent, keine Duplikate.

## Acceptance Criteria

- [ ] `usePickModeStore` implementiert und via Zustand-Pattern testbar
- [ ] Library zeigt Filter-Chip („⚙ Filter") + aktive Filter-Chips
- [ ] Library im Normal-Modus zeigt `+`-Button auf jeder Karte
- [ ] Library im Pick-Modus zeigt Checkmark statt `+`, Header-Right „Fertig (N)"
- [ ] Library-Detail hat fixen Bottom-CTA „+ Zum Training hinzufügen"
- [ ] `TrainingPickerSheet` zeigt draft/in_progress Trainings + „Neues Training erstellen"
- [ ] `/trainings/new?preselect=<id>` initialisiert die Übung in der Liste
- [ ] `/trainings/new?returnTo=library` navigiert nach Submit zurück zur Library mit Toast
- [ ] Create-Screen zeigt Übungen als rich-Liste mit Remove-Button
- [ ] Create-Screen zeigt Spieler als minimal-Liste mit Remove-Button
- [ ] Pre-Selected Übung erscheint als normaler Listen-Eintrag, kein Spezial-Container
- [ ] `ExercisePickerSheet.tsx` gelöscht, keine Referenzen übrig
- [ ] `npx tsc --noEmit` zero errors
- [ ] Manuelles Testing auf Web + Expo Go iOS
