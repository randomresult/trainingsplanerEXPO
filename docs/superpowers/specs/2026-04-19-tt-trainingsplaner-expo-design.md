# TT Trainingsplaner — Expo App Design Spec
**Datum:** 2026-04-19  
**Status:** Approved  
**Repo:** trainingsplanerEXPO

---

## Übersicht

Vollständige Neuentwicklung des TT-Trainingsplaners als Expo-basierte Multiplatform-App (iOS + Android + Web). Die bestehende Nuxt-App wird vollständig abgelöst. Das Strapi-Backend (`trainingsplaner-strapi.onrender.com`) bleibt unverändert.

---

## Ziel & Nutzer

**Primäre Nutzer:** Tischtennistrainer und Spieler (inkl. Kinder/Jugendliche)

**Nutzertypen:**
- **Trainer:** Vereins-Kontext, Spieler verwalten, Trainings und Reihen für Spieler erstellen
- **Spieler:** Eigenes Dashboard, eigene Trainings erstellen (nur für sich), Fortschritt tracken
- **Trainer = Spieler:** Ein Strapi-Account kann beides sein — ein verlinktes Spielerprofil + Trainer-Rolle

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
- **MMKV** — Persistenter Storage für Auth-Token + User (schneller als AsyncStorage)
- **Zustand** — Globaler State: aktiver Club, User, Permissions

### Backend (unverändert)
- **Strapi v5.1.1** auf `trainingsplaner-strapi.onrender.com`
- REST API mit `documentId`-Pattern
- JWT Authentication via Strapi Users & Permissions

---

## Rollen & Permissions

```
Jeder authentifizierte User
├── Hat Strapi-Rolle "Authenticated" / "Admin"?
│   → isTrainer = true
│   → Zugang: Club-Verwaltung, Spieler verwalten,
│              Übungen erstellen (Web only), Methodische Reihen erstellen
│
├── Hat verlinktes Spielerprofil (user.player)?
│   → isPlayer = true
│   → Zugang: Eigenes Dashboard, Spielerlog, Fortschritt,
│              Eigene Trainingshistorie, Training für sich erstellen
│
└── Beides → Beide Bereiche sichtbar in einer App
```

**Technische Umsetzung:**
- `useAuth()` Hook: liefert `isTrainer`, `isPlayer`, `hasPlayerProfile`, `activeClub`
- Expo Router Guards: blocken Trainer-Screens für reine Spieler
- UI-Komponenten: rendern Buttons/Sektionen bedingt per Permission-Check
- Gleiche Logik wie Nuxt-Auth-Store, portiert nach Zustand

---

## Navigation & Screen-Struktur

### Auth (nicht eingeloggt)
- `/login` — E-Mail + Passwort, JWT von Strapi
- `/register` — Club wählen, Name, wartet auf Trainer-Bestätigung

### Tab 1 — Dashboard `/`
- Nächstes Training (eigenes oder zugewiesenes)
- Mein Fortschritt (wenn Spieler)
- Club-Übersicht + offene Spieler-Anfragen (wenn Trainer)
- Aktiven Club wechseln (wenn mehrere Clubs)

### Tab 2 — Übungen `/exercises`
- Liste mit Filter (Kategorie, Spielerlevel, Fokusbereich) + Suche
- `/exercises/[id]` — Detail: Schritte, YouTube-Video (online only), Hinweise
- `/exercises/create` — **Web only, nur Trainer**
- `/exercises/[id]/edit` — **Web only, nur Trainer**

### Tab 3 — Training `/trainings`
- Liste gefiltert nach Status (draft / in_progress / completed)
- `/trainings/[id]` — Detail: Übungen abhaken, nachträglich loggen, abschließen
- `/trainings/create` — **Alle Nutzer**
  - Spieler: nur sich selbst als Teilnehmer, aus Übungsbibliothek wählen
  - Trainer: beliebige Spieler zuweisen, für Club sichtbar
- `/trainings/[id]/edit` — Ersteller kann eigenes Training anpassen
- `/trainings/[id]/session` — **Phase 2:** Session Host für Gruppen

### Tab 4 — Methodische Reihen `/series`
- Reihen-Liste
- `/series/[id]` — Detail: Übungen in Reihenfolge, eigener Fortschritt
- `/series/create` — **Web only, nur Trainer**

### Tab 5 — Profil `/profile`
- Eigenes Spielerprofil (QTTR, Material, Spielerlog) — wenn Spieler
- Meine Trainingshistorie
- `/profile/players` — Spielerliste des Clubs — **nur Trainer**
- `/profile/players/[id]` — Spielerprofil eines Vereinsspielers — **nur Trainer**
- `/profile/club` — Vereins-Settings — **nur Trainer**

---

## Trainings-Workflow (Tagebuch-Modell)

Kein Live-Tracking-Zwang. Spieler und Trainer loggen nachträglich:

```
Zuhause / mit Internet:
  → Training erstellen (Übungen aus Bibliothek wählen)
  → Status: draft

In der Halle (Training durchführen, App optional):
  → Training auf "in_progress" setzen wenn gewünscht

Nach dem Training (zuhause oder mit Internet):
  → Übungen abhaken was gemacht wurde
  → Notizen hinzufügen
  → Training auf "completed" setzen
```

Live-Session (Phase 2): Ein Host (Trainer oder Lead-Spieler) markiert Übungen für alle Teilnehmer. Kein Echtzeit-Sync nötig — Host-Aktionen werden nach Session gesynct und für alle Teilnehmer gezählt.

---

## Offline-Verhalten

**Entscheidung: Online-Only** — mobiles Internet ist Voraussetzung.

TanStack Query liefert automatisch **In-Session-Cache**: einmal geladene Daten bleiben innerhalb einer App-Sitzung verfügbar ohne Re-fetch. Kein persistenter Offline-Cache, keine Write-Queue.

**YouTube-Videos:** Funktionieren nur online. In der Halle ohne Internet: Video-Player zeigt Hinweis, alle anderen Inhalte (Schritte, Bilder, Text) sind in-session verfügbar.

---

## Datenmodell (Strapi — unverändert)

Bestehende Content Types werden direkt genutzt:

| Entity | Wichtigste Felder |
|---|---|
| Exercise | Name, Description, Hint, Steps (Component), Videos (YouTube-Links), Categories, Focusareas, Playerlevels |
| Training | Name, Date, training_status, Players (M2M), Exercises (M2M), Clubs (M2M) |
| Player | Name, QTTR, Playerlog (Dynamic Zone), Material, Club, User (1:1) |
| Club | Name, ClubId, Managers, Players, Trainings |
| Methodical Series | Name, Description, Goal, Category, Exercises (M2M), PlayerProgresses |
| Player Progress | CompletedExercises, Mastered, Player, MethodicalSeries |

Alle Queries nutzen `documentId` (String) statt numerischer ID — gleich wie Nuxt.

---

## API-Layer Pattern

```typescript
// Beispiel: TanStack Query Hook
export function useExercises(filters?: ExerciseFilters) {
  return useQuery({
    queryKey: ['exercises', filters],
    queryFn: () => api.get('/exercises', { params: { populate: '*', ...filters } }),
  })
}

// Axios Instance mit Auth-Interceptor
const api = axios.create({ baseURL: 'https://trainingsplaner-strapi.onrender.com/api' })
api.interceptors.request.use(config => {
  const token = mmkv.getString('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

---

## Phase 2 — Future Features (nicht MVP)

- **Live-Session Host-Modell:** Trainer/Lead-Spieler markiert Übungen für Gruppe → sync für alle nach Session
- **Plan teilen:** Training per Link/Code an anderen Spieler senden
- **Trainingsgruppen:** Mehrere Spieler, gemeinsamer Trainingskontext
- **AI-Trainingsassistent via n8n:** Nutzer beschreibt Ziel → n8n-Workflow holt Übungen aus Strapi → Claude API erstellt Trainingsreihen-Vorschlag → Nutzer bestätigt und speichert
- **Match-Analyse:** Spielergebnisse und Gegneranalyse (in Strapi vorhanden, nicht im MVP der App)

---

## Nicht in Scope (bewusst ausgeschlossen)

- Offline-First / Write-Queue / lokale SQLite-DB
- YouTube-Video Download für Offline
- Echtzeit-Sync zwischen Geräten (WebSocket)
- Neue Strapi Content Types (Backend bleibt unverändert für Phase 1)
- Exercises erstellen/editieren auf Mobile (Web-only)
- Match-Analyse (Phase 2)
