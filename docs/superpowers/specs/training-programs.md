# Training-Programs / Lernreihen — Design Spec (Skizze)

**Status:** Draft — noch nicht geplant, keine Implementation-Tickets
**Angelegt:** 2026-04-24
**Scope-Warnung:** Explizit **Post-MVP**. Dieses Dokument hält Ideen fest, damit das Datenmodell der nahen Features (Spielerprofil, Training-Execute) die Richtung nicht unnötig verbaut.

## Was ist eine Lernreihe?

Eine kuratierte Sequenz aufbauender Übungen, die ein Spieler über mehrere Trainings hinweg durchläuft. Beispiel: „Topspin Grundlagen" — 6 Sessions, Woche 1 = Griff & Stand, Woche 2 = Schwungbahn, Woche 6 = Situativer Einsatz. Anders als ein wiederkehrendes Training (Cadence: *wann*) definiert eine Lernreihe den *Inhalt und die Reihenfolge* — die beiden Achsen sind orthogonal.

## Zentrale Designfrage: Wo hängt eine Lernreihe?

Drei Kandidaten mit echten Unterschieden:

### Option A — Lernreihe hängt am Spieler *(Empfehlung, vom User präferiert)*

```
PlayerProgramEnrollment
  ├─ player           relation
  ├─ program          relation  (Template mit sessions[])
  ├─ currentStepIndex number
  ├─ startedAt, completedAt
  ├─ status           active | paused | completed
  └─ reflections[]    optional — Notizen, Bewertungen, „Problem-Tags"
```

**UX-Flow:**
1. Trainer (oder Spieler selbst) aktiviert eine Program-Template für einen Spieler → Enrollment entsteht, `currentStepIndex = 0`.
2. Im Live-Training sieht der Trainer: „3 Spieler mit aktiver Lernreihe" — kann die aktuellen Steps direkt als Übungs-Block ins Training ziehen, optional nacheinander.
3. Spieler arbeitet an der Übung, Trainer gibt Feedback.
4. Am Ende des Steps entscheidet Trainer oder Spieler „ready für next step" → `currentStepIndex++`.
5. Optional: Reflection-Eintrag (Was lief gut? Wo gab's Probleme? 1–5 Sterne?) — speist späteren Progress-View.

**Vorteile:** Individueller Pfad pro Spieler. Passt zu Coaching-Realität („Lea ist bei Woche 3, Max bei Woche 1").
**Nachteile:** UI im Gruppentraining komplex, wenn 6 Spieler 6 unterschiedliche Program-Steps haben. Lösung fürs MVP-Plus-1: nur 1 Spieler-Program pro Training sichtbar, oder „Solo-Slots" im Trainingsplan.

### Option B — Goal-basiert, kein fester Pfad

Spieler hat Ziele („Topspin verbessern", „Rückhand stabilisieren"). App schlägt beim Trainings-Planen passende Übungen aus der Library vor (matching über `focusareas`/`categories`). Kein starrer Schritt-für-Schritt-Pfad.

**Vorteile:** Flexibel, passt zu erfahrenen Spielern. Niedriger Content-Aufwand (keine Templates nötig).
**Nachteile:** Kein „Aufbauen", keine Sequenz — für Anfänger schlechter. Nur so gut wie die Tags der Übungen.

### Option C — Eigener Spieler-Bereich, komplett entkoppelt

Lernreihe ist ein dedizierter Tab im Spielerprofil, unabhängig von Trainings. Spieler kann selbst üben (z. B. mit Video-Anleitung der Übung), Trainer sieht nur Fortschritt. Trainings und Lernreihe laufen parallel ohne Integration.

**Vorteile:** Simpelste Architektur, kein Konflikt mit Gruppentraining-UI.
**Nachteile:** Verschenkt den Wert des Trainers als Coach. In einem Verein, der physisch zusammen trainiert, fühlt sich das losgelöst an.

## Empfehlung (vorläufig)

**Kombination A + leichte Züge von B:** Enrollment am Spieler, aber Trainer kann während der Training-Planung sehen „welche Spieler sind in aktiven Lernreihen" und gezielt deren aktuellen Step in die Übungsliste ziehen. Reflection/Bewertung kommt als Phase 2.

Option C kann parallel existieren, wenn später gewünscht (Solo-Übungs-Modus) — bricht nichts am A-Modell.

## Datenmodell-Skizze (nur Richtung, nicht final)

```
Program (Template, club- oder global-scoped)
  ├─ name              "Topspin Grundlagen"
  ├─ description
  ├─ targetLevel       relation(playerlevel) — optional
  ├─ focusareas        relation[] — was die Reihe trainiert
  └─ steps[]           ordered
       ├─ order        1, 2, 3 …
       ├─ name         "Griff & Stand"
       ├─ description
       ├─ exercises    relation(exercise)[] — die Übungen dieses Steps
       └─ successCriteria  "3× ohne Fehler" / freier Text

PlayerProgramEnrollment
  ├─ player            relation
  ├─ program           relation
  ├─ currentStepIndex  number
  ├─ status            active | paused | completed
  ├─ startedAt
  ├─ completedAt
  ├─ enrolledBy        relation(user) — Trainer oder Spieler selbst
  └─ reflections[]     { stepIndex, note, rating, problems[], createdAt }
```

## Kombinierbar mit anderen Features

| Feature | Zusammenspiel |
|---------|---------------|
| Wiederkehrende Trainings | Orthogonal. Schedule = wann, Program = was. Kein Konflikt. |
| Spieler-Beitritts-Flow | Enrollments gehören zum Spieler — nach Beitritts-Approval kann Trainer sofort Programs zuweisen. |
| Club-Admin | `club_admin` kann club-interne Programs erstellen; globale Programs ggf. app-weit. |
| Execute-Screen | Bekommt optional einen „Program-Step"-Block pro beteiligtem Spieler. Pflicht ist das nicht. |

## Non-Goals (für dieses Spec)

- Generierung von Programs durch die App (KI-Vorschläge) — Ferne Zukunft.
- Video-Tutorials oder App-interne Solo-Übungsmodi.
- Gamification / Badges / Leaderboards.
- Konkrete UI-Designs.

## Offene Fragen

1. **Program-Scope:** Global (alle Vereine teilen) oder per Club? Vorschlag: per Club, aber mit optionalem „Official Content"-Flag für globale Templates.
2. **Wer darf Programs erstellen?** Nur `club_admin`? Jeder Trainer? Spieler? → Vorschlag: `club_admin` erstellt, Trainer weist zu.
3. **Step-Advancement:** Wer darf `currentStepIndex` erhöhen — nur Trainer, nur Spieler, beide? → Vorschlag: beide, aber Trainer-Bestätigung required bevor „completed".
4. **Reflection-Scope:** Nur Notiz, oder strukturierte Bewertung (Rating, Problem-Tags)? → Start simpel (nur Text), später ausbauen.
5. **Gruppentraining-UI:** Wie zeigen wir 6 aktive Programs in einem einzigen Live-Training? → Designfrage, eigener Cycle.
