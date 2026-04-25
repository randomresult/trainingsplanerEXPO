# Roadmap — nächste Cycles

**Stand:** 2026-04-26
**Kontext:** Library-Picker ist shipped & merged. Dies ist die geplante Reihenfolge der nächsten Arbeits-Cycles. Bitte in dieser Reihenfolge angehen, außer ein neuer Blocker kommt dazwischen.

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

### 2. MÜRs — Methodische Übungsreihen (Lernpfade) — DESIGN COMPLETE, READY TO IMPLEMENT

**Docs:**
- Spec: `specs/2026-04-25-muers-design.md`
- Plan: `plans/2026-04-26-muers.md`
- Card mockup: `mockups/series-card-variants.html` (C-1 selected)

**Was entschieden:**
- Datenmodell: both-arrays — `training.exercises[]` = alle Übungen (source of truth), `training.methodicalSeries[]` = Gruppierungsmetadata
- Karten-Design: C-1 (category chip + progress pill oben, Name + Ziel, Divider, Übungsanzahl + `+`-Button)
- Fortschritt auf Karte (`3/6`-Pill): cross-training via `PlayerProgress` — für initial MVP deferred, Pill bleibt hidden bis Query gebaut
- `+`-Button auf Karte → `TrainingPickerSheet` (muss für Series erweitert werden — Task 6b im Plan)
- Kein Series-Support im `exercise-picker.tsx` — Library-Tab ist der Add-Flow
- Library/Picker-Unification: bewusst ausgelagert (siehe Item X unten)

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

### X. Library / Picker Unification (nach MÜRs, eigenständiger Cycle)
**Kontext:** Aktuell existieren zwei separate Screens mit ähnlicher UI:
- `app/(tabs)/library/index.tsx` — Library-Tab, `+` → TrainingPickerSheet (wähle Training)
- `app/exercise-picker.tsx` — Modal, `+` → fügt direkt zum bekannten Training hinzu (via `usePickModeStore`)

**Idee:** Library-Screen als einheitliche Basis, mit optionalem `trainingId`-Param:
- Kein `trainingId` (Tab-Navigation) → `+` öffnet TrainingPickerSheet wie bisher
- Mit `trainingId` (aus Training geöffnet) → `+` fügt direkt hinzu, kein Sheet nötig

**Vorteil:** Verbesserungen (neue Filter, Series-Support, Skeleton-Loader) müssen nur einmal gepflegt werden. Kein Silent-Divergence-Problem mehr.

**Warum nicht jetzt:** Berührt bestehenden Add-Exercise-Flow, `usePickModeStore`, alle Training-Screens die den Picker öffnen. Klarer eigenständiger Refactor-Cycle — nicht in MÜRs mischen.

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
