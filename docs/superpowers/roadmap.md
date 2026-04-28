# Roadmap — nächste Cycles

**Stand:** 2026-04-26
**Kontext:** Picker-Unification (Item Y) ist shipped & merged. Series-to-New-Training (Item X) ist jetzt unblocked. Dies ist die geplante Reihenfolge der nächsten Cycles. Bitte in dieser Reihenfolge angehen, außer ein neuer Blocker kommt dazwischen.

## Reihenfolge

### ✅ 1. Motion / Polish Cycle (C2) — SHIPPED 2026-04-25
**PR #6** merged to main.

**Was shipped:**
- ✅ Skeleton-Loader mit Shimmer-Animation (Library, Trainings, Exercise Detail)
- ✅ Pull-to-Refresh (Library, Trainings)
- ✅ Empty/Error States mit Spring-Animationen
- ✅ Shared Animation Configs (`lib/animations.ts`)
- ✅ Größere Touch-Targets für +/- Buttons
- ✅ Filter-Navigation-Fix (Push statt Modal für iOS)
- ✅ Counter-Badge entfernt (Exercise-Picker)

**Was skipped:**
- ❌ Swipe-to-Delete (nach Test reverted — UX nicht überzeugend)
- ❌ Header-Blur beim Scroll (nicht implementiert)

**Docs:** `specs/2026-04-25-motion-polish-c2-design.md`, `plans/2026-04-25-motion-polish-c2.md`

### ✅ 2. MÜRs — Methodische Übungsreihen (Lernpfade) — SHIPPED 2026-04-26

**Docs:**
- Spec: `specs/2026-04-25-muers-design.md`
- Plan: `plans/2026-04-26-muers.md`
- Card mockup: `mockups/series-card-variants.html` (C-1 selected)

**Was entschieden:**
- Datenmodell: both-arrays — `training.exercises[]` = alle Übungen (source of truth), `training.methodicalSeries[]` = Gruppierungsmetadata
- Karten-Design: C-1 (category chip + progress pill oben, Name + Ziel, Divider, Übungsanzahl + `+`-Button)
- Fortschritt auf Karte (`3/6`-Pill): cross-training via `PlayerProgress` — für initial MVP deferred, Pill bleibt hidden bis Query gebaut
- `+`-Button auf Karte → `TrainingPickerSheet` (muss für Series erweitert werden — Task 6b im Plan)
- Library/Picker-Unification: bewusst ausgelagert → in Item Y gelandet

**Was bewusst nicht in Scope:**
- Erstellen/Editieren von MÜRs (Strapi web-only)
- Progress-Badges / Achievements
- Fortschritts-Pill auf Karte (deferred — braucht cross-training PlayerProgress Query)

### 3. Trainings-Erstellungs-UX (Quick-Create + Blueprint)
**Warum danach:** Setzt MÜRs voraus ("Reihe zu Training hinzufügen"), macht dann mehr Sinn.

**Scope (Ideen):**
- Quick-Create Button "Nächster Dienstag / Freitag" (basierend auf Club-Trainingszeiten)
- Blueprint-Training: gutes altes Training als Vorlage wiederverwenden
- Offenes Training: ohne Vordefinition (Datum, Übungen offen)

### 4. Club-Admin-Rolle & Spieler-Beitritts-Flow
**Warum jetzt:** Datenmodell-Foundation für alle folgenden Features. Migration von `user.clubs` zu `club_memberships` passiert einmal — danach lassen sich Rollen, Einladungen, Approval-Flows sauber draufbauen.

**Scope:** Siehe `specs/club-administration.md` Draft. Kern:
- `club_memberships` Collection (user × club × role)
- Rolle `club_admin` mit Permissions-Matrix
- Spieler-Beitritts-Queue + Approval-UI
- Trainer-Einladungs-Flow

**Spec existiert als Draft** — braucht noch konkrete Design-Phase (UI, Migrationsplan).

### 5. Training-Programs / Lernreihen (optional — kann auch später)
**Warum zuletzt:** Setzt auf Club-Admin auf (Programs sind club-scoped), inhaltlich die Königsdisziplin. Könnte auch mit dem Wizard kombiniert werden.

**Scope:** Siehe `specs/training-programs.md` Draft. Empfohlenes Modell: Player-Program-Enrollment mit optionaler Goal-Suggest-Integration. Explizit als Post-MVP markiert.

### 6. Trainings-Liste UX — Today-Highlights / Date-Grouping
**Kontext:** `app/(tabs)/trainings/index.tsx` rendert aktuell nur das chronologisch erste anstehende Training in der `hero`-Variante, alle anderen `compact`. Wenn an einem Tag zwei oder mehr Trainings anstehen, kriegt nur eins den Hero-Look.

**Open Question (für Brainstorming):**
- (a) Alle heutigen Trainings bekommen `hero`-Variante (statt nur das erste). Geht ohne neue Section-Logik.
- (b) Zusätzlich Section-Header einführen: „Heute" / „Diese Woche" / „Dieser Monat" / „Später" als Gruppierung. Mehr Struktur, mehr Code (FlatList-Sections statt flach).
- (c) Kombination: heute-Highlights + Section-Header.

**Scope (klein):** isolierte Änderung in `(tabs)/trainings/index.tsx` plus evtl. eine kleine Zeitbereichs-Helper-Funktion. Keine Backend-Änderungen.

**Brainstorming nötig:** Wann ist ein Training „heute"? (Datum-Vergleich vs. Zeit-Stempel.) Was zählt als „diese Woche" — kalendarisch oder rollende 7 Tage? Section-Headers nur zeigen, wenn die Sektion was enthält?

### ✅ X. Series-to-New-Training — UNBLOCKED, bereit für nächsten Cycle
**Kontext:** `TrainingPickerSheet` zeigt existierende Trainings. Wenn der User stattdessen ein neues Training mit einer ganzen Reihe erstellen will, fehlt der Flow. `training-new.tsx` kennt nur `?preselect=<exerciseId>`, kein `?preselectSeries=`.

**War blockiert durch:** Picker-Unification (Item Y) — jetzt erledigt.

**Scope:**
- `TrainingPickerSheet` bekommt "Neues Training erstellen"-Option, die zu `training-new.tsx?preselectSeries=<id>&seriesName=<name>&exerciseIds=<csv>` navigiert
- `training-new.tsx` liest `preselectSeries`-Param und füllt Exercises + methodicalSeries beim Erstellen vor

### ✅ Y. Library / Picker Unification — SHIPPED 2026-04-26

**Docs:**
- Spec: `specs/2026-04-26-picker-unification-design.md`
- Plan: `plans/2026-04-26-picker-unification.md`
- Mockup: `mockups/exercise-card-actions.html`

**Was shipped:**
- ✅ `exercise-picker.tsx` gelöscht, `usePickModeStore` vereinfacht
- ✅ `app/library-pick.tsx` — einheitlicher Pick-Mode-Entry mit `trainingId`-Param
- ✅ `components/screens/LibraryScreen.tsx` — gemeinsame Basis für Tab + Pick-Mode
- ✅ `app/series-detail/[id].tsx` — root-level Route mit Pick-Mode-Support (festes CTA, Einzel-Übung `+`)
- ✅ `pickSessionStore` — no-duplicate-adds, server-seeding bei App-Restart, Session-Persistenz über Picker-Re-Opens
- ✅ `exercise-detail` — Pick-Mode-CTA mit `trainingId`-Param; `readOnly`-Param unterdrückt CTA in Training-Draft
- ✅ `MethodicalSeriesBlock` — neues Header-Design (collapsed/expanded, Details-Button, X-Button), X auf Übungen in Execute-Mode
- ✅ Live-Training-Verbesserungen: größerer Done-Button (w-14), `TimePickerModal` für Dauer, Collapse-Chevron pro Übung, Pills unterhalb Action-Row (ohne Dauer-Pill)
- ✅ Training-Draft: Nummern-Prefix entfernt, Tap auf Übung öffnet Read-Only-Detail

**Was bewusst nicht in Scope:**
- ❌ Series-to-New-Training Flow (→ Item X, jetzt unblocked)

## Was bewusst draußen bleibt

Aus den Non-Goals der bisherigen Cycles — hier nur zur Übersicht, nicht zum Angehen:
- **Wizard-Flow** („Vorhand verbessern") — überlappt mit Training-Programs, vielleicht ein gemeinsames Feature
- **Spieler-Picker-Refactor** zu voller Library-Experience — nur wenn Bedarf entsteht
- **Exercise-Creation direkt in der Library** — Future
- **Server-side Strapi-Filter** — nur wenn Performance-Problem auftaucht
- **Long-Press-Preview im Pick-Mode** — nur bei User-Feedback

## Orientierung bei neuem Kontext

Wenn du an einem anderen PC oder nach Pause wieder einsteigst:

1. Lies diese Datei zuerst.
2. Schau welcher Cycle aktuell läuft: `git branch` und letzter Commit geben Hinweis, ansonsten offener `plans/`-Eintrag.
3. Die Draft-Specs (`club-administration.md`, `training-programs.md`) sind **Skizzen** — wenn du einen davon startest, wird daraus ein echtes Design-Spec + Implementation-Plan.
4. `specs/` = Design, `plans/` = Implementation-Tickets.
