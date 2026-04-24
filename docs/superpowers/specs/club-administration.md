# Club Administration — Design Spec (Skizze)

**Status:** Draft — noch nicht geplant, keine Implementation Tickets
**Angelegt:** 2026-04-24
**Warum jetzt:** Datenmodell-Entscheidungen bei kommenden Features (wiederkehrende Trainings, Spieler-Beitritt, Trainings-Skalierung) müssen die Rolle mitdenken, auch wenn die Implementation später kommt.

## Goal

Vereinsübergreifende Aktionen (Spieler-Approval, wiederkehrende Trainings, Mitglieder- und Trainingsverwaltung) bekommen eine klare Rolle mit expliziter Berechtigung statt implizit „jeder Trainer eines Clubs darf alles".

## Rolle: `club_admin`

Neue Strapi-`users-permissions`-Rolle zusätzlich zu `trainer`. Ein User kann in Club A `club_admin` und in Club B nur `trainer` sein — die Rolle hängt am User-zu-Club-Link, nicht nur am User global.

### Datenmodell — offen zu entscheiden

Zwei Optionen, die wir später abwägen müssen:

- **A: Rollen-Feld direkt auf User** (global). Simpel, aber passt nicht zu Multi-Club.
- **B: Join-Collection `club_memberships`** mit Feldern `user`, `club`, `role` (`owner` | `admin` | `trainer`). Sauberer, erlaubt pro Club unterschiedliche Rolle. Aktuelle `user.clubs` Relation würde aufgelöst.

Empfehlung: **B**, auch wenn wir initial nur einen Club pro User unterstützen — macht Multi-Club später schmerzfrei.

### Permissions-Matrix

| Aktion                                | trainer | club_admin |
|---------------------------------------|---------|------------|
| Eigene Trainings erstellen/editieren  | ✓       | ✓          |
| Eigene Trainings löschen              | ✓       | ✓          |
| **Fremde** Trainings löschen          | —       | ✓          |
| Spieler-Beitrittsanfragen annehmen    | —       | ✓          |
| Spieler aus Verein entfernen          | —       | ✓          |
| Wiederkehrende Trainings definieren   | —       | ✓          |
| Trainer einladen / Rollen vergeben    | —       | ✓          |
| Vereinsdaten editieren (Name, Logo)   | —       | ✓          |
| Übungsbibliothek: globale Übungen     | ✓ (read)| ✓ (write)  |

Jeder Verein braucht mindestens einen `club_admin`. Beim Vereins-Gründen wird der Gründer automatisch `club_admin` und kann nicht herunterstufen bis ein anderer `club_admin` existiert.

## Features, die diese Rolle braucht

### 1. Spieler-Beitritts-Flow

Spieler fordert Beitritt an → landet in `pending` Queue → `club_admin` sieht Liste im Admin-Tab → Approve/Reject. Gehört in ein eigenes Spec, sobald angegangen.

### 2. Wiederkehrende Trainings

Neue Collection `training_schedules`:

```
{
  club: relation,
  name: "Dienstag-Training",
  weekday: 2,         // 0=Sonntag, 1=Montag, …
  startTime: "20:00",
  duration: 90,
  active: true,
  createdBy: relation(user),
  defaultExercises: relation(exercises)[],  // optional
  defaultPlayers: relation(players)[]       // optional
}
```

Ein Cron/Scheduler (oder on-demand Materializer) legt aus dem Schedule pro Woche ein konkretes `Training`-Dokument an — initial leer (keine Übungen), so dass der Trainer am Trainingstag nur noch „Plan" klickt statt alles von Null.

Offene Fragen (für späteren Spec):
- Ahead-Time: wie viele Wochen im Voraus materialisieren? (Vorschlag: 4 Wochen rollierend)
- Löschen einer Schedule-Instanz vs. Löschen des ganzen Schedules
- Trainer-Zuweisung bei mehreren Trainern pro Verein

### 3. Trainings-Listen-Skalierung

Mit Recurring wird die Liste schnell zu lang. Lösungsansatz in separatem Spec (`training-list-scaling.md`, noch nicht angelegt) — Kurzfassung: Kompakte Card-Variante für leere Drafts, Filter-Chips (Heute / Woche / Entwürfe), optional Wochen- oder Kalender-Ansicht als Toggle.

## Non-Goals (für dieses Spec)

- Konkrete UI-Designs — das ist Design-Arbeit pro Feature.
- Multi-Tenancy über Club-Grenzen hinweg (Vereins-Turniere, Ligen) — viel später.
- Audit-Log / History — optional, nicht für erste Version.
- Payment / Premium-Features pro Verein.

## Offene Fragen

1. **Migrationspfad:** Wenn wir zu `club_memberships`-Collection wechseln, müssen bestehende User/Club-Links konvertiert werden. Wer wird `club_admin` initial? → Vorschlag: Gründer, falls bekannt; sonst ältester Trainer pro Verein.
2. **Einladungen vs. Selbst-Registrierung:** Können Trainer sich selbst registrieren und einem Verein beitreten, oder brauchen sie immer eine Einladung vom `club_admin`? → Offen.
3. **Owner vs. Admin:** Brauchen wir eine dritte Rolle `owner` (kann Admin entfernen, Verein löschen), oder reicht `club_admin`? → Pragmatisch reicht `club_admin`, solange nur ein Verein pro Trainer existiert.
4. **Bibliothek-Trennung:** Ist die Übungsbibliothek global oder pro Verein? Aktuell alles global. Club-Admin-Write würde pro Verein erst sinnvoll, wenn die Bibliothek scoped ist.
