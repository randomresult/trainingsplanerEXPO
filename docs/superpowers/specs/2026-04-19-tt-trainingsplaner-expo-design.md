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
- Nächstes Training (eigenes oder zugewiesenes)
- Mein Fortschritt + aktive MÜRs (wenn Spieler)
- Club-Übersicht + offene Spieler-Anfragen (wenn Trainer)
- Aktiven Club wechseln (wenn mehrere Clubs)

### Tab 2 — Bibliothek `/library`
Übungen und Methodische Reihen in einem Tab — Toggle oben.

**Übungen:**
- Liste mit Filter (Kategorie, Spielerlevel, Fokusbereich) + Suche
- `/library/exercises/[id]` — Detail: Schritte, YouTube-Video (online only), Hinweise
- "Zu Training hinzufügen" Button auf Detailseite
- `/library/exercises/create` — **Web only, nur Trainer**
- `/library/exercises/[id]/edit` — **Web only, nur Trainer**

**Methodische Reihen (MÜR):**
- Reihen-Liste mit Fortschrittsbalken pro Reihe (eigener Fortschritt)
- `/library/series/[id]` — Detail: Übungen in Reihenfolge, Fortschritt, Quick-Link zur einzelnen Übung
- MÜR-Fortschritt ist persistent — bleibt aktiv unabhängig vom Training-Status
- `/library/series/create` — **Web only, nur Trainer**

### Tab 3 — Training `/trainings`
- Liste gefiltert nach Status (draft / in_progress / completed)
- `/trainings/[id]` — Detail: Übungen abhaken, nachträglich loggen, abschließen
- `/trainings/create` — Alle Nutzer
  - "Übung hinzufügen" → voller Screen-Push mit Bibliothek-Picker
- `/trainings/[id]/session` — **Phase 2**

### Tab 4 — Profil `/profile`
- Eigenes Spielerprofil (QTTR, Material, Spielerlog) — wenn Spieler
- Meine Trainingshistorie
- Achievements + Badges + Zertifikate
- `/profile/players` — Spielerliste — **nur Trainer**
- `/profile/players/[id]` — Spielerprofil — **nur Trainer**
- `/profile/club` — Vereins-Settings — **nur Trainer**

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

## MÜR — Methodische Reihen

Strukturierter Lernpfad, unabhängig vom Training-System:

```
MÜR "Vorhand Topspin Basics"
  └── Übung A: "Aufschlag Grundform" (15 Min, Steps 1-4)
  └── Übung B: "Topspin passiv" (15 Min, Steps 1-3)
  └── Übung C: "Topspin aktiv" (20 Min, Steps 1-5)

PlayerProgress: welche Übungen abgeschlossen, mastered?
```

- MÜR-Fortschritt läuft parallel und persistent zu Trainings
- Wenn Übung aus einer MÜR in einem Training abgehakt wird → MÜR-Progress automatisch aktualisiert
- Quick-Link von MÜR-Schritt zur einzelnen Übung zum Hinzufügen in Custom Training

---

## Achievement & Zertifikat-System

### Zwei Progress-Tracks

**Track 1 — Vereinstraining** (Trainer-geführt, verifizierbar):
- Anwesenheit bei organisierten Trainings
- MÜR-Fortschritt während Vereinstraining
- Teilnahme-Metriken → Basis für Club-Rangliste

**Track 2 — Eigentraining** (selbst geloggt):
- Selbst erfasste Trainingsminuten
- Eigenständig abgeschlossene MÜRs
- Übungen mit Häufigkeit + Dauer (Metriken TBD)
- → Persönlicher Fortschritt, Spieler sieht es immer, Trainer optional

Beide Tracks fließen in Badges/Achievements — aber getrennt ausgewiesen im Profil.

### Badges (vollautomatisch)
Kein Approval, kein Mensch — System vergibt sofort wenn Kriterium erfüllt:

| Badge | Kriterium |
|---|---|
| 🔥 Streak | 7 / 14 / 30 Tage in Folge trainiert |
| 💪 Fleißig | 10 / 50 / 100 Trainings absolviert |
| 📚 Übungsmacher | 50 / 200 / 500 Übungen gemacht |
| ✅ Reihe abgeschlossen | Erste / jede MÜR fertig |
| ⏱ Trainingszeit | 10h / 50h / 100h gesamt |

### Punkte-System
Training absolviert: +10 · Übung gemacht: +2 · MÜR abgeschlossen: +50 · Badge erhalten: +25 · 7-Tage-Streak: +30 · Zertifikat erhalten: +100

### Club-Ranglisten (pro Verein)
Drei Leaderboard-Tabs, je mit Woche / Monat / Gesamt:
- **Punkte** — Gesamt-Punktestand
- **Trainings** — Anzahl absolvierter Trainings
- **Streak** — Längste aktuelle Trainingsstreak

### Zertifikate / Urkunden (Trainer-Approval)
Separates formales System, klar getrennt von Badges:

**Admin definiert global** (ein neuer Strapi Content Type `certificate-template`):
- Name (z.B. "Vorhand Topspin")
- Level: Bronze / Silber / Gold
- Prerequisites: min. Anzahl bestimmter Übungen oder MÜRs

**Flow:**
1. System prüft Prerequisites automatisch pro Spieler
2. Trainer sieht welche Spieler bereit sind ("Max kann VH Bronze erhalten")
3. Trainer bestätigt → Zertifikat freigeschaltet
4. Spieler sieht Zertifikat im Profil + Urkunde druckbar (PDF)

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
- **MÜR-Zuweisung durch Trainer** — Trainer schlägt einzelnen Spielern MÜRs vor und trackt deren Fortschritt
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
- Exercises / MÜRs erstellen auf Mobile (Web-only)
- Match-Analyse
- Club-Override für Zertifikate
