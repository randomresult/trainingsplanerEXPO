# Roadmap — nächste Cycles

**Stand:** 2026-04-24
**Kontext:** Library-Picker ist shipped & merged. Dies ist die geplante Reihenfolge der nächsten Arbeits-Cycles. Bitte in dieser Reihenfolge angehen, außer ein neuer Blocker kommt dazwischen.

## Reihenfolge

### 1. Motion / Polish Cycle (C2)
**Warum zuerst:** Klein, keine Datenmodell-Änderungen, sofort sichtbarer iOS-Feel-Gewinn. Niedriges Risiko, gute Momentum-Belohnung nach dem Library-Ship.

**Scope** (aus `specs/2026-04-21-design-system-foundation-c1-design.md` Out-of-Scope-Sektion, zu migrieren):
- Swipe-to-Delete auf Cards (Trainings, inline Übungen/Spieler)
- Skeleton-Loader statt Spinner
- Header-Blur beim Scroll
- Pull-to-Refresh auf Listen

**Wird wahrscheinlich zu:** Eigenem Plan `plans/YYYY-MM-DD-motion-polish-c2.md`.

### 2. Trainings-Listen-Skalierung + Recurring-Trainings
**Warum als nächstes:** Sobald Recurring-Trainings kommen, explodiert die Liste. Beides zusammen designen, damit die Wochenansicht und das Schedule-Template-Datenmodell zueinander passen.

**Scope:**
- Wochenansicht als primäre Trainings-Liste (siehe Diskussion — aktuelle Woche ohne Scroll, Wochen-Wechsler, Swipe)
- `training_schedules` Collection (weekday, startTime, duration, defaultExercises/players)
- On-demand-Materialisierung statt Cron (virtuelle Einträge mergen mit echten Training-Dokumenten)
- Filter-Chips über der Liste („Heute / Woche / Entwürfe")

**Eigenes Spec nötig:** `specs/training-list-scaling.md` — noch zu schreiben, inhaltlich im `club-administration.md`-Draft angeteast.

### 3. Club-Admin-Rolle & Spieler-Beitritts-Flow
**Warum jetzt:** Datenmodell-Foundation für alle folgenden Features. Migration von `user.clubs` zu `club_memberships` passiert einmal — danach lassen sich Rollen, Einladungen, Approval-Flows sauber draufbauen.

**Scope:** Siehe `specs/club-administration.md` Draft. Kern:
- `club_memberships` Collection (user × club × role)
- Rolle `club_admin` mit Permissions-Matrix
- Spieler-Beitritts-Queue + Approval-UI
- Trainer-Einladungs-Flow

**Spec existiert als Draft** — braucht noch konkrete Design-Phase (UI, Migrationsplan).

### 4. Training-Programs / Lernreihen (optional — kann auch später)
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
3. Die drei Draft-Specs (`club-administration.md`, `training-programs.md`, künftig `training-list-scaling.md`) sind **Skizzen** — wenn du einen davon startest, wird daraus ein echtes Design-Spec + Implementation-Plan.
4. `specs/` = Design, `plans/` = Implementation-Tickets.
