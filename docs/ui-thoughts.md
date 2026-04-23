# UI/UX Thoughts

Loses Sammelheft für UI/UX-Gedanken, Ideen, Verbesserungen und Debt. Kein formaler Plan — Brainstorm-Stil, Einträge werden später in Specs/Plans überführt wenn sie angegangen werden.

**Struktur:**
- **Immediate Polish** — konkrete Bugs und Layout-Fixes, kleine Arbeit pro Punkt
- **UX Redesigns** — tiefere Umbauten, die Design-Entscheidungen brauchen bevor Code angefasst wird
- **Motion & Interactions (C2)** — bereits als Out-of-Scope im C1-Spec, eigener Zyklus
- **Feature-Ideen (SP2+)** — größere neue UX-Bereiche
- **Cross-Platform** / **Accessibility** / **Tech-Debt** — laufende Sorge

---

## Immediate Polish

Schnell umsetzbare Einzel-Fixes. Können in einer Sammelrunde gebündelt werden.

### Library
- **Bibliothek-Tab Layout-Debt:** Zwischen dem oberen "Übungsbibliothek"-Titel und dem darunterliegenden "Bibliothek"-Header ist zu viel Whitespace. Header-Hierarchie überprüfen — möglicherweise doppelter Titel.
- **Library-Detail / Anleitung — `<p>`-Tags im Content:** Kein FE-Bug, die Daten im Strapi enthalten tatsächlich HTML-Markup (`<p>...</p>`), weil das Feld ein Rich-Text ist und wir es als Plain-Text rendern. Zwei Wege:
  - **Strapi-Side:** Rich-Text-Feld ggf. auf Plain-Text / Textarea umstellen und Content bereinigen
  - **FE-Side:** Rich-Text mit `react-native-render-html` (oder vergleichbar) als echtes HTML rendern
  - Empfehlung: erst die Strapi-Content-Realität prüfen (welche Tags kommen tatsächlich?) bevor wir RN-HTML-Renderer einbauen — das ist eine schwere Dep
- **Tastatur-Dismiss:** Wenn die Suche fokussiert ist, muss man auf eine Übung tippen um das Keyboard wegzukriegen. Mehr Tap-Area zum Dismissen (tap-outside auf leerem Listenbereich oder ScrollView `keyboardShouldPersistTaps="handled"` prüfen).

### Trainings-Liste
- **"Neues Training erstellen"-Button-Position:** Aktuell im Sticky-Header. Besser als erster Eintrag IN der Liste:
  - Liste leer: Button mittig/prominent
  - Liste nicht leer: Button als erste Card, Trainings dadrunter
  - Gedanke: bei Filter "Abgeschlossen" evtl. Button ausblenden? (unsicher — oder immer zeigen, Kontext-agnostisch)
- **Filter verwirrend:** Aktuell zwei Chips "Anstehend" / "Abgeschlossen". Alternativen zu besprechen:
  - A) Keine Filter, alles in einer Liste
  - B) Toggle-Switch "Abgeschlossene anzeigen" an/aus
  - C) Beide Chips separat an-/ausschaltbar (Multiselect statt Exklusiv)
- **Bottom-Sheet "Training erstellen":** Unten abgeschnitten — der "Training erstellen"-Submit-Button berührt den Screen-Rand. Mehr Bottom-Padding / Safe-Area-Bottom.
- **Nach Create:** User soll automatisch in der Liste sein, die das neue Training zeigt. Aktuell: Sheet dismisst, aber wenn Filter "Abgeschlossen" aktiv war, ist das neu erstellte (draft) Training unsichtbar. Filter auf "Anstehend" zurücksetzen beim Create-Success oder Toast "Training erstellt — in Anstehend".

### Execute (Live-Training)
- **Bottom-Sheet Training-Abschluss:** Aktuell redirect zur Liste ohne Feedback. Braucht eigenen **Trainingsabschluss-Screen** (Summary: Anzahl Übungen, Dauer, Spieler, evtl. mit "Erneut" / "Fertig"-Actions).

---

## UX Redesigns

Tiefergehende Umbauten — brauchen Design-Diskussion bevor Code.

### Cross-Tab Style-Konsistenz
Bibliothek-Tab und Trainings-Tab fühlen sich stylistisch nicht aus einem Guss an. Unklar genau warum — evtl. lila-Nutzung, Header-Hierarchie, Card-Dichte, Abstände. **Brainstorm:** Wir machen einen Visual-Pass mit beiden Screens nebeneinander und ziehen die Abweichungen heraus. Könnte Einzel-Fix oder systematisch mit Token-Anpassung enden.

### Add-Exercises-Flow: Details vor dem Hinzufügen
Aktuell ist der Add-Exercises-Sheet nur eine Liste mit "Hinzufügen"-Button pro Zeile. User will Übungsdetails sehen können **bevor** er hinzufügt. Optionen:
- **A) Accordion pro Zeile** — Tap auf Zeile expandiert Details inline, Hinzufügen-Button bleibt rechts
- **B) Tap-to-Preview** — Tap öffnet zweites Sheet / Detail-View, Hinzufügen von dort
- **C) Split-Row** — Tap auf Infozeile öffnet Details, Tap auf Button direkt addet

Vote: **A)**, da es im Sheet bleibt ohne Navigations-Overhead. Animation: Height-Spring beim Expand.

### Spieler nachträglich hinzufügen
Create-Flow hat Exercise- + Player-Selector. Später kann man nur Exercises nachtragen, Spieler nicht. Braucht **AddPlayersSheet** analog zu AddExercisesSheet, verfügbar in Training-Detail (und evtl. Execute).

### Execute-Screen Layout-Springen
Aktuell: "Aktuelle Übung"-Karte oben → Tap auf eine andere Übung verschiebt die Karte → Complete lässt die Karte verschwinden → Layout hüpft.

Lösungsrichtungen:
- **A) Aktuelle-Übung-Block nach unten, unter die Liste** — Liste oben stabil, Detail unten ist sekundär
- **B) Aktuelle-Übung fixiert oben, nie verschwinden** — nach Complete bleibt sie sichtbar (mit visueller "erledigt"-Markierung), bis nächste ausgewählt
- **C) Nach Complete automatisch zur nächsten Übung springen** — keine explizite Neuauswahl nötig

Und: "Auf Übung tippen" ist als Interaktion unintuitiv, wenn der User nur Infos sehen will, ohne sie zu aktivieren. Evtl. braucht es zwei Actions:
- **Tap** → Info anzeigen (expanded state)
- **Langer Tap / Play-Icon** → Übung aktivieren

### Execute-Screen Timer-Logik vereinfachen
Aktuell: Session-Timer + individueller Übungstimer + Pause/Resume.

**Neuer Vorschlag für MVP:**
- Session-Timer behalten (misst Gesamt-Dauer)
- Individuellen Timer **weglassen** — stattdessen wird die **Default-Time der Übung** verwendet
- Default-Time am rechten Rand (da wo der Timer war) **editierbar** — User tippt drauf, kann korrigieren, falls nicht exakt eingehalten
- **Pause/Fortsetzen-Button weg** — braucht man für MVP nicht
- Beim Abschluss wird die Zeit (Default oder edit'd) als "tatsächliche Zeit" der Übung gespeichert (falls wir das überhaupt brauchen)

Kern-Gedanke: Live-Training ist eine **Checkliste mit Session-Timer**, nicht ein komplexer Stopwatch-Manager.

### Trainingsabschluss-Screen
Eigener Screen nach "Training beenden"-Bestätigung, bevor Liste kommt. Inhalt:
- Session-Dauer
- X von Y Übungen abgeschlossen
- Spieler-Übersicht mit Punkten
- Actions: "Zurück zur Liste" / "Dieses Training als Template speichern" (Later-Idea)

### Picker-Sheets (Übungen/Spieler im Create-Flow): Fertig-Button nicht erreichbar
Das `ExercisePickerSheet` / `PlayerPickerSheet` im `/trainings/new`-Screen öffnet sich als 90%-Bottom-Sheet. Auswählen funktioniert, aber der "Fertig (N)"-Footer-Button wird abgeschnitten / nicht sichtbar. Ein Fix-Versuch mit `flex: 1 / minHeight: 0`-Wrapper um den FlatList hat es nicht gelöst (wurde in Commit `fd72dfa` gesetzt und per Reset rückgängig gemacht). Root Cause noch unklar — Layout-Interaktion zwischen `@gorhom/bottom-sheet` + `BottomSheetView` + `FlatList` + NativeWind.

Lösungs-Richtungen zur Diskussion:
- **A) Auto-Add ohne Confirm** — jeder Tap addet/removed sofort, kein "Fertig"-Button nötig. Schlank, aber fehlt "Mehrfach-Auswahl bestätigen". Matches user's first idea.
- **B) Top-Right Confirm** — wie ein "Done" in iOS-NavBars, im Sheet-Header rechts neben dem Close-X. Keep-alive unter allen Layout-Zuständen. Meine Empfehlung (falls A zu einschränkend).
- **C) Eigene Page statt Sheet** — `/trainings/new/pick-exercises` als vollflächiger Screen mit nativem Stack-Header. Gleiches Problem gelöst durch "nicht-Sheet". Konsistent mit `/trainings/new` selbst, das schon ein Screen ist.
- **D) Gorhom `BottomSheetFlatList` + `BottomSheetFooter`** — offizielle API-Bausteine nutzen statt Plain-FlatList. Löst Layout sauber, aber Abhängigkeit auf Gorhom-interne Components wächst.
- **E) Fix-Button unten, Liste scrollt darüber** (eigentlich Variante D implementiert) — klingt wie aktuelle Absicht, scheiterte bisher an Sizing.

Vote: **B oder D**. B ist minimaler Aufwand, D ist architekturell sauberer. A nur wenn Multi-Tap ohne Confirm sich gut anfühlt — testen.

---

## Motion & Interactions (geplant als C2)

Siehe `docs/superpowers/specs/2026-04-21-design-system-foundation-c1-design.md` Section 1.3:

- Spring-Animations bei Stack-Navigation / Shared-Element-Transitions
- Layout-Animations bei Listen (Hinzufügen/Entfernen mit Spring)
- Skeleton-Loader statt ActivityIndicator
- Swipe-Actions auf Training-Karten (swipe-to-delete / swipe-to-archive)
- Header-Blur beim Scrollen
- Pull-to-Refresh auf allen Listen
- Skia-basierte Highlights (Dashboard-Progress-Ring, Animationen)

---

## Feature-Ideen (SP2+)

- **Player-Rolle / Player-App-View** — Mock `mvp-training-list-player.html` wartet
- **Dashboard** (Home-Tab) — aktuell Placeholder
- **Library-Aggregation** — "Spieler X hat Übung Y N-mal gemacht"
- **Multi-Club-Picker** — Trainer mit mehreren Clubs
- **iPad-Split-Layout** — Liste + Detail nebeneinander
- **Profile-Features** — Avatar-Upload, Settings, Abonnement
- **Player-Invite-Flow** — QR-Code / Link zum Spielerkonto
- **Library-Quick-Filter** — nach Kategorien / Focus Areas (die Exercise-Schema hat `focus`-Relation). Ggf. oben unter der Suche als horizontale Chips.
- **Training-Templates** — Training aus dem aktuellen Training als Template speichern

---

## Cross-Platform Consistency

- `Alert.alert` auf react-native-web: `onPress` fired nicht → wir haben `window.confirm` Fallback, fehleranfällig. Evtl. Custom-Confirm-Modal-Component bauen.
- Bottom-Sheet auf Web: degradiert zu Fullscreen-Modal. OK, aber Keyboard-/Scroll-Handling anders.
- Haptics auf Web no-op: könnte via subtile Scale-Animation kompensiert werden.
- FlatList in BottomSheet: Scroll-Gesten-Konflikt möglich — bei Bedarf `BottomSheetFlatList` swappen.

---

## Accessibility (für später)

- `accessibilityLabel` / `accessibilityRole` auf allen Pressables
- Color-Contrast gegen WCAG validieren (Dark-Theme ungeprüft)
- Dynamic-Type iOS (Text skaliert mit Systemeinstellung)
- VoiceOver-Flows testen
- Reduced-Motion-Präferenz

---

## Tech-Debt

- Register-Screen Confirm-Password entfernt in C1 — ggf. wieder rein
- Font-Fallback iOS: Inter statt SF Pro (vereinfacht nach Build-Issue). Falls SF Pro gewünscht: Workaround ohne Platform-Import in tailwind.config nötig
- `!border-primary`-Overrides im Execute-Screen sind Code-Smell. Card mit explizitem `borderColor`-Prop sauberer.
- `useTrainings` sortiert client-side — bei vielen Trainings evtl. Server-side + Pagination
