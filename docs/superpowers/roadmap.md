# Roadmap — nächste Cycles

**Stand:** 2026-04-25
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

### 2. MÜRs — Methodische Übungsreihen (Lernpfade) — NEXT UP
**Warum vorgezogen:** Recurring-Trainings wurden als Idee verworfen. MÜRs sind das wertvollere Feature — strukturierte Lernpfade für Spieler, persistent über Trainings hinweg, Grundlage für Badges/Achievements.

**Konzept (aus Original-Spec 2026-04-19):**
- Wrapper aus mehreren Übungen in Reihenfolge (z.B. "Vorhand Topspin Basics")
- Fortschritt läuft parallel zu Trainings — Übung in Training abgehakt → MÜR-Progress aktualisiert
- Tab 2 (Bibliothek): Toggle zwischen Übungen ↔ Methodische Reihen
- Erstellen/Editieren: Web-only, nur Trainer
- Badge-Kandidaten: "Erste MÜR abgeschlossen", "MÜR-Meister" etc.

**Scope (zu klären in Brainstorm):**
- Strapi Content Type `exercise_series` / `muers`
- Library-Integration (Toggle, Liste, Detail)
- Progress-Tracking via `PlayerProgress`
- Verknüpfung mit Training-Flow ("Ganze Reihe zu Training hinzufügen")

**Spec nötig:** `specs/YYYY-MM-DD-muers-design.md` — in Brainstorm aktuell.

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
