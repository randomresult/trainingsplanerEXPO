# TT Trainingsplaner — Expo App Design Spec
**Datum:** 2026-04-19  
**Status:** Approved  
**Repo:** trainingsplanerEXPO

---

## Übersicht

Vollständige Neuentwicklung des TT-Trainingsplaners als Expo-basierte Multiplatform-App (iOS + Android + Web). Die bestehende Nuxt-App wird vollständig abgelöst. Das Strapi-Backend (`trainingsplaner-strapi.onrender.com`) bleibt unverändert für Phase 1.

---

## Ziel & Nutzer

**Primäre Nutzer (MVP):** Trainer für strukturierte Trainingsplanung mit Gruppen

**Nutzertypen MVP:**
- **Superuser (Admin):** Volle Kontrolle über System, Übungen erstellen, Vereine verwalten
- **Trainer:** Gruppen-Trainings planen (Jugend, Erwachsene, etc.), Spieler verwalten, Anwesenheit bestätigen
- **Spieler:** Zugewiesene Trainings sehen, Fortschritt tracken, eigene Stats

**Wichtig:** 
- **Verein = Container** (z.B. "TTC Musterstadt") — übergeordnete Struktur für Spieler, Trainer, Gruppen
- **Training = flexible Gruppe** (z.B. "Jugendtraining", "Erwachsene Montag", "Leistungsgruppe") — kann 4 Spieler oder 15 Spieler sein

**Phase 2 (später):**
- **Eigentraining:** Spieler erstellen eigene Trainings, Trainingsgruppen ohne Trainer
- **Spieler = Trainer:** Ein Account kann beides sein

**MVP-Fokus:** Trainer plant für beliebige Gruppen im Verein - Jugend, Erwachsene, kleine Runden, große Gruppen.

---

## Plattformen

| Plattform | Ziel | Navigation |
|---|---|---|
| iOS | ✅ Phase 1 | Tab Bar (bottom) |
| Android | ✅ Phase 1 | Tab Bar (bottom) |
| Web (Browser) | ✅ Phase 1 (ersetzt Nuxt) | Sidebar (fixed left) |

Expo Router erkennt Plattform automatisch — gleicher Code, plattformspezifisches Layout.

---

## Tech Stack

### Frontend (Expo App)
- **Expo SDK 52** + **Expo Router v4** (file-based routing)
- **React Native** (iOS/Android) + **React Native Web** (Browser)
- **NativeWind v4** (Tailwind CSS für React Native) — einheitliches Styling
- **TanStack Query v5** — Data Fetching, Caching, Loading/Error States
- **Axios** — HTTP Client mit JWT Auth-Interceptor
- **MMKV** — Persistenter Storage für Auth-Token + User
- **Zustand** — Globaler State: aktiver Club, User, Permissions

### Backend (Phase 1 unverändert)
- **Strapi v5.1.1** auf `trainingsplaner-strapi.onrender.com`
- REST API mit `documentId`-Pattern
- JWT Authentication via Strapi Users & Permissions
- **Neu in Phase 1:** `certificate-template` Content Type (Admin-only)

---

## Rollen & Permissions (MVP vereinfacht)

```
Strapi-User (hat IMMER ein Player-Profil)
├── Superuser (Admin-Rolle)
│   → Vollzugriff: Übungen/Lernpfade erstellen, Vereine verwalten, alles sehen
│   → Hat auch Player-Profil: kann an Trainings teilnehmen
│
├── Trainer (Authenticated + Trainer-Flag)
│   → Trainings planen, Spieler verwalten, Anwesenheit bestätigen
│   → Übungen/Lernpfade erstellen (nur Web)
│   → Hat Player-Profil: kann an Trainings anderer Trainer teilnehmen
│   → Sieht eigene Stats wie jeder Spieler
│
└── Spieler (Authenticated mit Player-Profil)
    → Zugewiesene Trainings sehen, eigenen Fortschritt tracken
    → Bibliothek durchsuchen (read-only)
```

**Wichtig:** 
- **Trainer = Spieler + erweiterte Rechte** — keine getrennten Accounts
- Trainer kann bei Trainings anderer Trainer mitmachen
- Jeder User hat Player-Profil (QTTR, Material, Stats, etc.)

**Gruppen-Zuordnung:**
- User sieht in Profil: "Mitglied in Gruppen: Jugend, Erwachsene Montag"
- Gruppe zeigt: "Mitglieder: Max, Anna, Tom, ..." (dynamisch pro Training)
- Keine festen Gruppen — flexible Spieler-Auswahl pro Training

**Technische Umsetzung:**
- `useAuth()` Hook: liefert `role`, `isTrainer`, `isSuperuser`, `activeClub`, `playerProfile`
- Expo Router Guards: blocken Trainer-Screens für reine Spieler
- UI-Komponenten: rendern Features per Permission-Check

**Phase 2 Erweiterung:**
- Spieler können eigene Trainings erstellen (Eigentraining-Feature)
- Trainingsgruppen ohne Trainer (Simple User Workflows)

---

## Navigation & Screen-Struktur

**4 Tabs (MVP)** — Tab Bar auf Mobile, Sidebar auf Web (Expo Router automatisch).

### Auth (nicht eingeloggt)
- `/login` — E-Mail + Passwort, JWT von Strapi
- `/register` — Club wählen, Name, E-Mail (Trainer muss freischalten)

### Tab 1 — Dashboard `/`

**Für alle Spieler (inkl. Trainer):**
- **Header:** Name + Vereinsname links · Streak-Badge rechts (nur wenn vorhanden)
- **Personal Stats-Card:**
  - Gesamt-Punkte (aus Gruppentrainings)
  - Trainings-Counter
  - Gesamte Trainingszeit
  - Aktueller Streak (🔥 Tage in Folge)
  - **Kein Ranking** — nur persönliche Zahlen
- **Nächstes Training:** Name, Datum, Uhrzeit, Übungsanzahl · Button "Öffnen"
- **Aktive Lernpfade:** Fortschrittsbalken pro Reihe (X/Y Übungen)
- **Letzte Badges:** 2-3 zuletzt erhaltene · Link zu allen

**Zusätzlich für Trainer:**
- **Club-Button** im Header mit Badge-Counter (offene Aktionen: Anwesenheit bestätigen, etc.)
- Öffnet Trainer-Bereich (siehe unten)

### Tab 2 — Bibliothek `/library`
Übungen und Lernpfade in einem Tab — Toggle oben.

**Übungen:**
- Liste mit Filter (Kategorie, Spielerlevel, Fokusbereich) + Suche
- `/library/exercises/[id]` — Detail: Steps nummeriert, YouTube-Video (online only), Trainer-Tipp
- ⭐ Favorit-Stern auf Listeneinträgen + Detailseite (alle Nutzer)
- Punkte-Badge "+2 Pkt" rechts in Listeneinträgen (zeigt Belohnung bei Abschluss)
- **MVP: Nur Ansehen** — kein "Zu meinem Training" (kommt Phase 2 mit Eigentraining)
- `/library/exercises/create` — **Web only, nur Trainer/Superuser**
- `/library/exercises/[id]/edit` — **Web only, nur Trainer/Superuser**

**Lernpfade** (ehem. Methodische Reihen):
- Liste mit Kategorie-Filter (Technik/Taktik/Kondition/Mental)
- ⭐ Favorit-Stern auf Listeneinträgen + Detailseite (alle Nutzer)
- Fortschrittsbalken pro Lernpfad + Status-Indikator ("Aktiv X/Y")
- Completed Counter "✓ Nx abgeschlossen" (wie oft der Pfad durchlaufen wurde)
- Punkte-Badge "+50 Pkt" rechts in Listeneinträgen (Belohnung bei Abschluss)
- `/library/paths/[id]` — Detail: Übungen in Reihenfolge, aktueller Step hervorgehoben
- **MVP: Read-only für Spieler** — Trainer fügt Lernpfade zu Trainings hinzu
- `/library/paths/create` — **Web only, nur Trainer/Superuser**

### Tab 3 — Training `/trainings`

**MVP: Nur Gruppentraining** (Trainer-organisiert, keine Eigentraining-Funktion)

Status-Filter (Anstehend / Aktiv / Abgeschlossen)

**Spieler-Ansicht:**
- Liste zugewiesener Trainings (nächstes prominent)
- `/trainings/[id]` — Detail: Trainer, Datum, Ort, Gruppe (Teilnehmerliste), geplante Übungen/Lernpfade
- Training starten → Übungen abhaken, Timer pro Übung
- Nach Training: Fortschritt wird gespeichert, Punkte gutgeschrieben
- Anwesenheit muss vom Trainer bestätigt werden

**Trainer-Ansicht (zusätzlich):**
- Button "Neues Training erstellen" → `/trainings/create`
- `/trainings/create`:
  - Name (z.B. "Jugendtraining", "Erwachsene Montag"), Datum, Uhrzeit, Ort
  - **Spieler auswählen** aus Verein (flexible Gruppe: 4 Spieler, 15 Spieler, egal)
  - **Trainer kann sich selbst als Teilnehmer hinzufügen** (nimmt am Training teil + trackt eigenen Fortschritt)
  - **Übungen hinzufügen** aus Bibliothek (Drag-to-Reorder)
  - **Lernpfade hinzufügen** (alle Übungen des Pfads werden eingefügt)
  - Summary: Gesamtdauer, Übungsanzahl, mögliche Punkte, Teilnehmerzahl
- Während/Nach Training: Anwesenheit bestätigen pro Spieler (inkl. eigene wenn mitgemacht)
- Training abschließen → Punkte werden verteilt

**Naming-Philosophie:**
- "Gruppentraining" statt "Vereinstraining" (flexibler, weniger formal)
- Verein = übergeordneter Container, Training = beliebige Gruppe

### Training Execution — Step-Layout

Einheitliches Design für beide Sections (Lernpfade + Übungen), beide Modi (live + nachträglich):

**1 Zeile pro Step** (gleiche Höhe für alle Status):
```
[✓ Checkbox] [Name der Übung] [⏱ 15m ✎] [+2 Pkt Badge]
```

- **Checkbox** markiert "gemacht / nicht gemacht" — kein separater "Fertig"-Button
- **Name** durchgestrichen wenn erledigt
- **⏱ Timer Pill** — bei erledigten/aktuellen editierbar (✎ Icon)
- **Punkte-Badge** rechts — zeigt Belohnung
- Wiederholungen werden über **längere Zeit** abgebildet (2× = 30m statt 15m)
- Aktueller Step: gelber Highlight-Rahmen
- Header-Block zeigt Gesamtfortschritt + Punkte-Summe oben

**Abgeschlossene eigene Trainings** bleiben editierbar (Timer nachträglich anpassen).
**Gesamt-Trainingszeit** kann ebenfalls nachträglich angepasst werden (z.B. wenn Live-Timer nicht exakt war — Pausen, vergessenes Stoppen).

### Tab 4 — Profil `/profile`
- Eigenes Spielerprofil (QTTR, **Material**, Spielerlog)
- **Material-Sektion:** Schläger (Holz, VH-Belag, RH-Belag), Spielweise (OFF/ALL/DEF), Belaghärte
- **Gruppen-Übersicht:** Häufig trainiert mit: "Jugend (12x)", "Erwachsene Montag (8x)" (dynamisch aus Trainings-Historie)
- Meine Trainingshistorie (Gruppentrainings mit Datumsfilter)
- Achievements + Badges

### Trainer-Bereich (Header-Button, nur für Trainer sichtbar)
Ein "🎓 Club" Button im Dashboard-Header mit Badge-Counter für offene Aktionen.
Öffnet einen eigenen Screen mit allen Trainer-Funktionen:
- **Anwesenheit bestätigen** (App + Web) — pro Training Spieler abhaken
- **Training anpassen / abschließen** (App + Web)
- **Spieler verwalten** — Liste, Profile, Registrierungs-Anfragen bestätigen (App + Web)
- **Übungen / Lernpfade erstellen** → **Web only**
- Training erstellen (siehe Tab 3)

**Phones bleiben weg während Vereinstraining** — kein Live-Tracking, kein Zwang zur App-Nutzung während der Session. Alles wird vor oder nach dem Training erledigt.

---

## Trainings-Workflow (Tagebuch-Modell)

Online-Only. Trainer-gesteuertes Gruppentraining im MVP.

```
Vor Training: Trainer erstellt Training → wählt Spieler (flexible Gruppe) + Übungen/Lernpfade
Im Training: Spieler sehen Training in App, können live Übungen abhaken (optional)
Nach Training: Trainer bestätigt Anwesenheit → Punkte werden gutgeschrieben
```

**Verein als Container:**
- Verein = "TTC Musterstadt" (übergeordnete Struktur)
- Trainer gehören zu Verein
- Spieler gehören zu Verein
- Training = beliebige Gruppe aus diesem Verein (Jugend, Erwachsene, 4er-Runde, etc.)

### Zeit-Tracking
- Jede Übung hat `Minutes` in Strapi (Schätzwert, z.B. 15 Min)
- Beim Abhaken wird der Schätzwert übernommen
- Spieler kann Dauer optional anpassen ("hat eigentlich 20 Min gedauert")
- Gesamtdauer Training = Summe aller Übungs-Minutes
- Basis für Achievements: Trainingsstunden gesamt, Stunden pro Woche

**Phase 2 Eigentraining:**
- Spieler kann eigene Trainings erstellen (Quick-Start Timer, freestyle)
- Trainingsgruppen ohne Trainer (Spieler-organisiert)
- Nachträgliches Loggen

---

## Lernpfade

Strukturierter Lernpfad, unabhängig vom Training-System:

```
Lernpfad "Vorhand Topspin Basics"
  └── Übung A: "Aufschlag Grundform" (15 Min, Steps 1-4)
  └── Übung B: "Topspin passiv" (15 Min, Steps 1-3)
  └── Übung C: "Topspin aktiv" (20 Min, Steps 1-5)

PlayerProgress: welche Übungen abgeschlossen, mastered?
```

- Lernpfad-Fortschritt läuft parallel und persistent zu Trainings
- Wenn Übung aus einem Lernpfad in einem Training abgehakt wird → Lernpfad-Progress automatisch aktualisiert
- Quick-Link von Lernpfad-Schritt zur einzelnen Übung zum Hinzufügen in Custom Training

---

## Progress-System (MVP: Personal Only)

**Kernprinzip Phase 1:** Persönlicher Fortschritt, keine Ranglisten. Nur Gruppentraining (Trainer-organisiert) im MVP.

### Gruppentraining (Trainer-organisiert)
- Anwesenheit vom Trainer bestätigt
- Übungen abgehakt → Punkte
- Lernpfad-Übungen → Punkte + **Lernpfad-Badge möglich**
- Lernpfad komplett abgeschlossen → Badge ✅

**Metadaten für spätere Features tracken:**
- `group_training_count`, `group_training_minutes`, `group_points`
- Ermöglicht später: Eigentraining-Track, Freunde/Vereins-Leaderboard

---

## Achievement & Zertifikat-System (MVP: Personal Progress)

### Punkte-System (MVP: Nur Gruppentraining)
Effort-based, skill-agnostisch — Beginner und Profi verdienen gleich:

| Aktion | Punkte | Context |
|---|---|---|
| Gruppentraining besucht | +15 | Anwesenheit bestätigt |
| Übung abgehakt | +2 | Im Training |
| Lernpfad abgeschlossen | +50 | Im Training |
| Badge erhalten | +25 | Automatisch |
| 7-Tage-Streak | +30 | Gruppentrainings |

**Punkte-Verwendung:**
- MVP: Nur persönliche Anzeige, Milestone-Badges
- Phase 2: Eigentraining-Punkte, Freunde/Vereins-Leaderboard (opt-in)

### Anwesenheit & Streaks
- **Persönlich:** Counter ("28 Trainings besucht") + Streak ("🔥 5 Tage in Folge")
- **Streak zählt für:** Gruppentraining (MVP), später auch Eigentraining
- **Kein Club-Ranking in MVP** — nur persönliche Stats

### Badges (vollautomatisch, kein Approval)
Skill-agnostisch — gleiche Badges für alle Level:

| Badge | Kriterium |
|---|---|
| 🔥 Streak | 7 / 14 / 30 Tage in Folge trainiert |
| 💪 Fleißig | 10 / 50 / 100 Trainings absolviert |
| 📚 Übungsmacher | 50 / 200 / 500 Übungen gemacht |
| ✅ Lernpfad abgeschlossen | Beim Abschluss eines Lernpfads |
| ⏱ Trainingszeit | 10h / 50h / 100h gesamt |

---

## Offline-Verhalten

**Online-Only** — mobiles Internet ist Voraussetzung.
TanStack Query liefert In-Session-Cache (innerhalb einer Sitzung kein Re-fetch).
YouTube-Videos: nur online. Alle anderen Inhalte in-session verfügbar.

---

## Datenmodell (Strapi)

### Bestehende Content Types (unverändert genutzt)

| Entity | Wichtigste Felder |
|---|---|
| Exercise | Name, Description, Hint, Steps, Videos (YouTube), Categories, Focusareas, Playerlevels, Minutes, assignedPlayers |
| Training | Name, Date, training_status, Players (M2M), Exercises (M2M), Clubs (M2M), startedAt |
| Player | Name, QTTR, Playerlog, **Material** (JSON: Holz, VH/RH-Belag, Spielweise, Härte), Club, User (1:1) |
| Club | Name, ClubId, Managers, Players, Trainings |
| Methodical Series | Name, Description, Goal, Category, Exercises (M2M), PlayerProgresses |
| Player Progress | CompletedExercises, Mastered, Player, MethodicalSeries |

### Neu in Phase 1

Keine neuen Content Types in MVP - alle bestehenden Strapi-Entities bleiben unverändert.

**Wichtig für spätere Features — vorbereiten in Datenstruktur:**
```javascript
// Training Model - erweitert:
{
  training_type: "club" | "own",  // match kommt Phase 2
  
  // Metadaten für späteres Leaderboard:
  source_points: {
    club_points: number,    // aus Vereinstraining
    own_points: number      // aus Eigentraining
  },
  
  // Für Freunde-Feature Phase 2:
  visibility: "private" | "friends" | "club",
  
  // Trainer-Verifikation:
  verified_by: User | null,
  verified_at: DateTime | null
}

// Player Stats - aggregiert:
{
  total_points: number,           // Summe aller
  club_training_stats: {...},     // getrennt tracked
  own_training_stats: {...},      // getrennt tracked
  current_streak: number,
  longest_streak: number
}
```

---

## Offen / To Be Refined

Folgende Themen sind bewusst geparkt und werden in einem späteren Design-Zyklus verfeinert:

- **Trainer-geführtes vs. selbstorganisiertes Training** — Unterschied zwischen Kinder-Training (Trainer managed alles) und Erwachsenen-Gruppen (Spieler mit Spezialrolle laden ein)
- **Lernpfad-Zuweisung durch Trainer** — Trainer schlägt einzelnen Spielern Lernpfads vor und trackt deren Fortschritt
- **Training-Locking** — wer darf ein Training bearbeiten/abschließen
- **Trainingsgruppen Details** (Eigentraining mit mehreren Spielern):
  - Wie werden Spieler eingeladen? (In-App Invite vs. Link teilen)
  - Können Eingeladene ablehnen?
  - Notifications für Einladungen und Training-Updates
  - Kann Host nachträglich Teilnehmer hinzufügen/entfernen?
  - Sieht Host den Fortschritt aller Teilnehmer live?
  - Was wenn Host Training löscht — wird es für alle gelöscht?
  - Können Teilnehmer das Training verlassen?
  - Punkte-Verteilung bei Gruppen-Eigentraining — gleich wie Solo?
- **Herausforderungs-System Details** (Phase 2 Leaderboard-Feature):
  - Wann verfallen Herausforderungen? (z.B. nach 7 Tagen)
  - Kann man mehrere offene Challenges gleichzeitig haben?
  - Notification-System für neue Challenges
  - Wie wird Ergebnis erfasst? (Trainer-Bestätigung vs. Self-Report)
  - Was passiert bei No-Show?
  - Challenge-Historie sichtbar?
  - Können Challenges zurückgezogen werden?

---

## Phase 2 — Future Features

- **Eigentraining:** Spieler erstellen eigene Trainings (Quick-Start Timer, freestyle logging)
- **Trainingsgruppen:** Spieler können andere einladen, einer plant für alle (ohne Trainer)
- **Freunde/Vereins-Leaderboard:** Opt-in Ranglisten (Punkte nach Quelle filterbar: Verein/Eigen)
  - **Herausforderungs-System:**
    - Spieler kann andere Spieler **max. 3 Ränge höher** herausfordern
    - Pro Training max. **2 Herausforderungen annehmen** (Spam-Schutz)
    - Herausforderung = kurzes Match (Best-of-3 oder Best-of-5)
    - Bei Sieg: Plätze tauschen in Rangliste
    - Bei Ablehnung: keine Penalty (freiwillig)
    - Trainer kann Herausforderungen während Training koordinieren
    - Challenge-Status: Offen / Angenommen / Abgelehnt / Erledigt
- **Social Features:** Freunde hinzufügen, Trainings teilen, gegenseitig motivieren
- **Zertifikate / Urkunden:** Trainer vergibt offizielle Zertifikate (Bronze/Silber/Gold) mit PDF-Druck
- **Match-Tracking:** Wettkämpfe loggen, zählt für Streak und Punkte
- **Gegnerdatenbank:** Gegner-Profile mit Stärken/Schwächen, Match-Historie
- **Match-Analyse detailliert:** Spielergebnisse auswerten, Statistiken, Stärken/Schwächen tracken

- **Live-Session Host-Modell:** Host markiert Übungen für Gruppe → sync für alle nach Session
- **Plan teilen:** Training per Link/Code senden
- **Trainingsgruppen:** Gemeinsamer Trainingskontext
- **AI-Trainingsassistent via n8n + Claude**

---

## Nicht in Scope Phase 1 (MVP)

- **Eigentraining / Simple User Features** (Spieler erstellen eigene Trainings)
- **Trainingsgruppen ohne Trainer** (Spieler laden sich gegenseitig ein)
- **Ranglisten / Leaderboards** (kommt Phase 2 mit opt-in)
- **Zertifikate-System** (Trainer-Approval, PDF-Druck)
- **Match-Tracking & Gegnerdatenbank** (komplettes Feature-Set für Phase 2)
- Offline-First / Write-Queue / SQLite
- YouTube-Video Download
- Echtzeit-Sync (WebSocket)
- Exercises / Lernpfads erstellen auf Mobile (Web-only)
