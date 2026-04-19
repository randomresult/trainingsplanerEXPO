# TT Trainingsplaner — Expo App Design Spec
**Datum:** 2026-04-19  
**Status:** Approved  
**Repo:** trainingsplanerEXPO

---

## Übersicht

Vollständige Neuentwicklung des TT-Trainingsplaners als Expo-basierte Multiplatform-App (iOS + Android + Web). Die bestehende Nuxt-App wird vollständig abgelöst. Das Strapi-Backend (`trainingsplaner-strapi.onrender.com`) bleibt unverändert für Phase 1.

---

## Ziel & Nutzer

**Primäre Nutzer:** Tischtennistrainer und Spieler (inkl. Kinder/Jugendliche)

**Nutzertypen:**
- **Trainer:** Vereins-Kontext, Spieler verwalten, Trainings und Reihen für Spieler erstellen
- **Spieler:** Eigenes Dashboard, eigene Trainings erstellen, Fortschritt tracken
- **Trainer = Spieler:** Ein Strapi-Account kann beides sein — verlinktes Spielerprofil + Trainer-Rolle

**Kernprinzip:** Ein Nutzer, eine App. Keine Moduswechsel. Features erscheinen je nach Strapi-Rolle und ob ein Spielerprofil verlinkt ist.

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

## Rollen & Permissions

```
Jeder authentifizierte User
├── Hat Strapi-Rolle "Authenticated" / "Admin"?
│   → isTrainer = true
│   → Zugang: Club-Verwaltung, Spieler verwalten,
│              Übungen erstellen (Web only), Reihen erstellen,
│              Zertifikate vergeben
│
├── Hat verlinktes Spielerprofil (user.player)?
│   → isPlayer = true
│   → Zugang: Eigenes Dashboard, Spielerlog, Fortschritt,
│              Eigene Trainingshistorie, Training erstellen
│
└── Beides → Beide Bereiche sichtbar in einer App
```

**Technische Umsetzung:**
- `useAuth()` Hook: liefert `isTrainer`, `isPlayer`, `hasPlayerProfile`, `activeClub`
- Expo Router Guards: blocken Trainer-Screens für reine Spieler
- UI-Komponenten: rendern Buttons/Sektionen bedingt per Permission-Check

---

## Navigation & Screen-Struktur

**4 Tabs** — Tab Bar auf Mobile, Sidebar auf Web (Expo Router automatisch).
Referenz-Pattern: Strong / Hevy. Übungen = eigener Tab (Lern-Content). Hinzufügen zu Training = voller Screen-Push.

### Auth (nicht eingeloggt)
- `/login` — E-Mail + Passwort, JWT von Strapi
- `/register` — Club wählen, Name, wartet auf Trainer-Bestätigung

### Tab 1 — Dashboard `/`

**Layout (gleich für alle):**
- **Header:** Name + Vereinsname links · Streak-Badge rechts (nur wenn vorhanden)
- **Club-Button** *(nur Trainer):* Eigene Card mit Badge-Counter (offene Aktionen) · getrennt von Stats
- **Stats-Card** (dynamisch):
  - 🏛 Verein-Zeile: Rank · Punkte · Trainings (immer sichtbar)
  - 🏠 Solo-Zeile: Rank · Punkte · Zeit (nur wenn Solo-Daten vorhanden)
- **Nächstes Training:** Name, Datum, Uhrzeit, Übungsanzahl/Spieleranzahl · Button "Öffnen"
- **Aktive Lernpfade:** Fortschrittsbalken pro Reihe (X/Y Übungen)
- **Letzte Badges:** 2-3 zuletzt erhaltene · Link zu allen

### Tab 2 — Bibliothek `/library`
Übungen und Lernpfade in einem Tab — Toggle oben.

**Übungen:**
- Liste mit Filter (Kategorie, Spielerlevel, Fokusbereich) + Suche
- `/library/exercises/[id]` — Detail: Steps nummeriert, YouTube-Video (online only), Trainer-Tipp
- ⭐ Favorit-Stern auf Listeneinträgen + Detailseite (alle Nutzer)
- Punkte-Badge "+2 Pkt" rechts in Listeneinträgen (zeigt Belohnung bei Abschluss)
- Buttons auf Detailseite:
  - "Start" — direkt tracken (alle Nutzer)
  - "Zu meinem Training" — zu eigener Planung hinzufügen (alle Nutzer)
  - "Zu Vereinstraining" — **nur Trainer** (Vereinstraining-Planung noch offen)
- `/library/exercises/create` — **Web only, nur Trainer**
- `/library/exercises/[id]/edit` — **Web only, nur Trainer**

**Lernpfade** (ehem. Methodische Reihen):
- Liste mit Kategorie-Filter (Technik/Taktik/Kondition/Mental)
- ⭐ Favorit-Stern auf Listeneinträgen + Detailseite (alle Nutzer)
- Fortschrittsbalken pro Lernpfad + Status-Indikator ("Aktiv X/Y")
- Completed Counter "✓ Nx abgeschlossen" (wie oft der Pfad durchlaufen wurde)
- Punkte-Badge "+50 Pkt" rechts in Listeneinträgen (Belohnung bei Abschluss)
- `/library/paths/[id]` — Detail: Übungen in Reihenfolge, aktueller Step hervorgehoben
- Button: "Start" / "Weiter" — Schritt für Schritt durchgehen, Step abhaken
- Lernpfad-Fortschritt ist persistent — unabhängig vom Training-Status
- Kein "Zu Training hinzufügen" — Lernpfad ist selbst schon ein strukturierter Plan
- `/library/paths/create` — **Web only, nur Trainer**

### Tab 3 — Training `/trainings`
Zwei Subtabs im selben Tab: **🏛 Vereinstraining** + **🏠 Mein Training**

Status-Filter (Anstehend / Fertig) — Aktiv wird direkt als Badge auf dem Item angezeigt.

**Vereinstraining** (vom Trainer erstellt, zugewiesen)
- Liste mit nächstem Training prominent (Trainer, Ort, Teilnehmer-Avatare)
- `/trainings/[id]` — Detail: Trainer, Ort, Teilnehmerliste, geplante Übungen 1-N, Punkte-Vorschau
- Detail zeigt **keine** Fokus/Dauer-Zeilen (Zeit steckt in den Übungen selbst)
- Wie Trainer Vereinstraining plant/editiert → **noch offen (To Be Refined)**

**Mein Training** (selbst erstellt, eigene Planung)
- Quick-Start Timer: "Freies Eigentraining" Button — Timer läuft, Übungen später taggen
- Liste eigener Pläne (Entwurf / Aktiv / Fertig)
- `/trainings/own/create` — Name, Datum, Uhrzeit + **zwei Sektionen:**
  - 📋 Lernpfade (grüne Card) — ganze Lernpfade hinzufügen (inkl. Fortschrittsbalken)
  - 💪 Übungen (lila Card) — einzelne Übungen aus Bibliothek
  - Drag-Handle (≡) zum Reordern
  - Summary: Dauer · Lp+Üb Count · mögliche Punkte
- `/trainings/own/[id]` — Zwei Modi: Live starten ODER nachträglich loggen

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
- Eigenes Spielerprofil (QTTR, Material, Spielerlog) — wenn Spieler
- Meine Trainingshistorie
- Achievements + Badges + Zertifikate

### Trainer-Bereich (Header-Button, nur für Trainer sichtbar)
Ein "🎓 Club" Button im Dashboard-Header mit Badge-Counter für offene Aktionen.
Öffnet einen eigenen Screen mit allen Trainer-Funktionen:
- Anwesenheit bestätigen (App + Web)
- Training anpassen / abschließen (App + Web)
- Extra Übungen zum Training hinzufügen + Spielern zuweisen (App + Web)
- Spieler verwalten — Liste, Profile, Anfragen bestätigen (App + Web)
- Zertifikate vergeben (App + Web)
- Übungen / Reihen erstellen → **Web only**

**Phones bleiben weg während Vereinstraining** — kein Live-Tracking, kein Zwang zur App-Nutzung während der Session. Alles wird vor oder nach dem Training erledigt.

---

## Trainings-Workflow (Tagebuch-Modell)

Online-Only. Kein Live-Tracking-Zwang — Spieler loggen nachträglich.

```
Zuhause: Training erstellen → Status: draft
In der Halle: optional "in_progress" setzen
Nach dem Training: Übungen abhaken, Notizen, "completed"
```

### Zeit-Tracking
- Jede Übung hat `Minutes` in Strapi (Schätzwert, z.B. 15 Min)
- Beim Abhaken wird der Schätzwert übernommen
- Spieler kann Dauer optional anpassen ("hat eigentlich 20 Min gedauert")
- Gesamtdauer Training = Summe aller Übungs-Minutes
- Basis für Achievements: Trainingsstunden gesamt, Stunden pro Woche

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

## Progress-Tracks

Zwei getrennte Tracks, Punkte fließen in eine gemeinsame Rangliste:

### Training-Track (Vereinstraining, verifiziert)
- Anwesenheit vom Trainer bestätigt
- Übungen im Vereinstraining abgehakt → Punkte
- Lernpfad-Übungen im Training → Punkte + **Lernpfad-Badge möglich**
- Lernpfad komplett abgeschlossen im Training → Badge ✅

### Own-Track (selbst geloggt, unverified)
- Timer-basiert: Start → Training läuft → Stop
- Art des Trainings taggen (predefined oder freestyle)
- Übungen/Lernpfad-Übungen loggen → **nur Punkte, keine Badges**
- Trainer sieht Own-Track für Coaching-Zwecke, aber kein Club-Ranking dafür

---

## Achievement & Zertifikat-System

### Punkte-System (beide Tracks fließen zusammen)
Effort-based, skill-agnostisch — Beginner und Profi verdienen gleich:

| Aktion | Punkte | Track |
|---|---|---|
| Vereinstraining besucht | +15 | Training |
| Übung abgehakt | +2 | Beide |
| Lernpfad abgeschlossen | +50 | Beide |
| Badge erhalten | +25 | Beide |
| 7-Tage-Streak | +30 | Beide |
| Zertifikat erhalten | +100 | Training |

### Anwesenheit
- **Persönlich:** Counter ("28 Trainings besucht") + Streak ("5 in Folge") im Profil
- **Club-Ranking:** Vereinsrangliste nach Anwesenheit (eigener Tab neben Punkte-Ranking)

### Club-Ranglisten (pro Verein)
**2 Haupt-Tabs · je 2 Subtabs · 3 Zeitfilter (Monat / 6 Monate / Gesamt)**

Fair für alle Spielertypen — reine Vereinsspieler konkurrieren nur gegen andere Vereinsspieler, Eigentrainer haben ihre eigene Rangliste.

**Punkte-Tab:**
- 🏛 Verein: Punkte nur aus Vereinstraining (Anwesenheit, Übungen, Lernpfads im Training)
- 🏠 Eigen: Punkte nur aus Eigentraining (selbst geloggt)
- Layout: Podium (Top 3) + Liste ab Platz 4 mit Fortschrittsbalken

**Anwesenheit-Tab:**
- 🏛 Verein: Anzahl Vereinstrainings besucht (X/Y) + Balken + Rate % + Streak
- 🏠 Eigen: Eigentraining-Stunden (h min) + Balken + Sessions + Übungen
- Kein Podium bei Anwesenheit — direkte Liste mit Balken

### Badges (vollautomatisch, kein Approval)
Skill-agnostisch — gleiche Badges für alle Level:

| Badge | Kriterium |
|---|---|
| 🔥 Streak | 7 / 14 / 30 Tage in Folge trainiert |
| 💪 Fleißig | 10 / 50 / 100 Trainings absolviert |
| 📚 Übungsmacher | 50 / 200 / 500 Übungen gemacht |
| ✅ Lernpfad abgeschlossen | Nur Training-Track (Trainer-Setup) |
| ⏱ Trainingszeit | 10h / 50h / 100h gesamt |

### Zertifikate / Urkunden (Trainer-Approval, hervorgehoben)
Klar getrennt von normalen Badges — spezielles visuelles Treatment (Gold-Rahmen, Animation).

**Admin definiert global** (`certificate-template` Content Type):
- Name, Level (Bronze / Silber / Gold)
- Prerequisites: min. Lernpfads / Übungen (automatisch geprüft)

**Flow:**
1. System prüft Prerequisites → Trainer sieht "Max bereit für VH Bronze"
2. Trainer entscheidet: direkt vergeben (wenn er Können sieht) ODER Prüfung durchführen
3. Prüfung ist optional — kein Pflichtschritt
4. Trainer bestätigt in App → spezielles Zertifikat-Badge + Urkunde druckbar (PDF)

Kein Club-Override — Admin-Definitionen gelten global.

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
| Player | Name, QTTR, Playerlog, Material, Club, User (1:1) |
| Club | Name, ClubId, Managers, Players, Trainings |
| Methodical Series | Name, Description, Goal, Category, Exercises (M2M), PlayerProgresses |
| Player Progress | CompletedExercises, Mastered, Player, MethodicalSeries |

### Neu in Phase 1

| Entity | Felder |
|---|---|
| certificate-template | Name, Level (Bronze/Silver/Gold), Prerequisites (JSON), Description |

---

## Offen / To Be Refined

Folgende Themen sind bewusst geparkt und werden in einem späteren Design-Zyklus verfeinert:

- **Trainer-geführtes vs. selbstorganisiertes Training** — Unterschied zwischen Kinder-Training (Trainer managed alles) und Erwachsenen-Gruppen (Spieler mit Spezialrolle laden ein)
- **Lernpfad-Zuweisung durch Trainer** — Trainer schlägt einzelnen Spielern Lernpfads vor und trackt deren Fortschritt
- **Training-Locking** — wer darf ein Training bearbeiten/abschließen
- **Gruppen-Training ohne Trainer** — Spezialrolle, Einladungssystem

---

## Phase 2 — Future Features

- **Live-Session Host-Modell:** Host markiert Übungen für Gruppe → sync für alle nach Session
- **Plan teilen:** Training per Link/Code senden
- **Trainingsgruppen:** Gemeinsamer Trainingskontext
- **AI-Trainingsassistent via n8n + Claude**
- **Match-Analyse:** Spielergebnisse und Gegneranalyse

---

## Nicht in Scope Phase 1

- Offline-First / Write-Queue / SQLite
- YouTube-Video Download
- Echtzeit-Sync (WebSocket)
- Exercises / Lernpfads erstellen auf Mobile (Web-only)
- Match-Analyse
- Club-Override für Zertifikate
