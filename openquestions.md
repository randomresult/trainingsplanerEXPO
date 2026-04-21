# Open Questions — Design System Foundation C1

Fragen/Entscheidungen, die während der Implementierung aufgekommen sind und am Ende mit dem User geklärt werden sollen.

## Dependencies

### Reanimated v4 statt v3
Der Plan erwähnte Reanimated v3 als Tech-Stack. `npx expo install react-native-reanimated` hat automatisch **v4.1.1** installiert (SDK 54 default). Das ist funktional für unsere Use-Cases identisch, aber:
- Plugin-Pfad ist `react-native-worklets/plugin` (v4) statt `react-native-reanimated/plugin` (v3)
- v4 benötigt `react-native-worklets` als separates Package

**Impact:** Keine — unsere Animations-APIs (useSharedValue, useAnimatedStyle, withSpring, Layout-Animations) sind in v4 unverändert. Plugin-Pfad wurde im Plan korrekt auf worklets/plugin gesetzt.

### Worklets Version-Mismatch-Warning
`react-native-worklets@0.8.1` installiert, aber Metro warnt: "expected 0.5.1". Bundling klappt trotzdem. Ist eine peer-dependency-Warning ohne Laufzeit-Impact.

**Action if needed:** Pin auf `~0.5.1` via npm install, falls wir eine strengere Version wollen.

---

## Font Loading — Package statt Manual-Download

Der Plan sagte "Inter TTFs manual in assets/fonts/ legen". Ich bin auf `@expo-google-fonts/inter` umgestiegen weil:
- Kein manuelles Asset-File-Handling
- Automatische Version-Updates via npm
- Gleiche Integration via `useFonts()`
- Offizielles Expo-Package

**Impact:** Keine — API identisch, nur Source der TTFs unterscheidet.

---

## Register-Screen — Confirm-Password-Feld entfernt

Die ursprüngliche `register.tsx` hatte ein "Passwort bestätigen"-Feld mit Validierung. Der Plan spezifiziert nur 3 Felder (username, email, password mit min. 6 Zeichen). Beim Migrate auf Primitives wurde das Confirm-Feld entfernt.

**Impact:** Minimal — der Strapi-Register-Endpoint akzeptiert nur `username/email/password`, das Confirm-Feld war ein clientseitiger Sanity-Check. User tippt jetzt das Passwort nur einmal.

**Soll wieder rein?** Falls ja, einfaches Add-back möglich.

---

## AddExercisesSheet — FlatList scroll-Verhalten

Die `AddExercisesSheet` nutzt eine normale React-Native `FlatList` innerhalb des `@gorhom/bottom-sheet`. Auf Native (iOS/Android) kann das zu Scroll-Konflikten führen — die Sheet-Drag-Geste konkurriert mit der List-Scroll-Geste.

**Fix, falls nötig:** Swap auf `BottomSheetFlatList` aus `@gorhom/bottom-sheet`. Import-Change, sonst API-identisch.

**Wird beim Testen sichtbar** (Polish-Pass Task 10.1).

---

## Minor styling concerns (training execute)

- Current-Exercise-Card nutzt `border-primary` via className-Override. Unter Umständen konkurriert mit Card's default `border-border`. Visual check in Polish nötig.
- "+ Übung hinzufügen"-Button (Secondary-Variante mit dashed border via className). Tailwind-Merge-Reihenfolge kann die dashed-Klasse hinter Secondary's solid-border verstecken.

**Fix, falls nötig:** Inline-Style-Override oder `!important`-Prefix (`!border-primary`).

---

## Open Items

_Hier ergänzen wir Fragen, die während der Implementation auftauchen._
