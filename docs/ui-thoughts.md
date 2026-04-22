# UI/UX Thoughts

Loses Sammelheft für UI/UX-Gedanken, Ideen, Verbesserungen und Debt. Kein formaler Plan — Brainstorm-Stil, Einträge werden später in Specs/Plans überführt wenn sie angegangen werden.

**Struktur:**
- **Immediate Polish** — konkrete Dinge, die an bestehenden Screens nicht stimmen, kleine Fixes
- **Motion & Interactions (C2)** — bereits im Design-System-C1-Spec als Out-of-Scope deklariert
- **Feature-Ideen** — größere UX-Direktionen, die neue Screens/Flows implizieren
- **Cross-Platform** — Unterschiede Web / iOS / iPad handhaben
- **Accessibility** — Barrierefreiheit, meist für später
- **Tech-Debt** — Primitives, die refaktorisiert werden sollten

---

## Immediate Polish

_Kleine UI-Punkte, die an bestehenden Screens nicht stimmen. Sammeln, in Batches abarbeiten._

- _(noch leer — User ergänzt)_

---

## Motion & Interactions (geplant als C2)

Siehe `docs/superpowers/specs/2026-04-21-design-system-foundation-c1-design.md` Section 1.3 "Out of Scope":

- Spring-Animations bei Stack-Navigation / Shared-Element-Transitions
- Layout-Animations bei Listen (Hinzufügen/Entfernen mit Spring)
- Skeleton-Loader statt ActivityIndicator
- Swipe-Actions auf Training-Karten (swipe-to-delete / swipe-to-archive)
- Header-Blur beim Scrollen
- Pull-to-Refresh auf allen Listen
- Skia-basierte Highlights (Dashboard-Progress-Ring, Animationen)

---

## Feature-Ideen (SP2+)

_Größere UX-Konzepte, eigene Plan-Zyklen wert._

- **Player-Rolle / Player-App-View** — der Mock `mvp-training-list-player.html` wartet
- **Dashboard** (Home-Tab) — aktuell Placeholder. "Nächstes Training", aktive Session, Wochen-Stats, letzte Completions
- **Library-Aggregation** — "Spieler X hat Übung Y N-mal gemacht", Sortieren nach Häufigkeit
- **Multi-Club-Picker** — Trainer mit mehreren Clubs kann zwischen Vereinen wechseln
- **iPad-Split-Layout** — Liste + Detail nebeneinander statt Stack-Navigation
- **Profile-Features** — Avatar-Upload, Settings (Sprache, Haptics off), Abonnement
- **Player-Invite-Flow** — QR-Code / Link zum Spielerkonto

---

## Cross-Platform Consistency

_Wo iOS, Android und Web unterschiedlich reagieren._

- **`Alert.alert`-Buttons** auf react-native-web ignorieren `onPress` → wir haben `window.confirm`-Fallback, aber das ist häufige Quelle von Bugs. Überlegen: Custom-Confirm-Modal-Component?
- **Bottom-Sheet auf Web** — `@gorhom/bottom-sheet` degradiert zu Fullscreen-Modal auf Web. Ist OK, aber keyboard- und scroll-handling anders.
- **Haptics** — auf Web no-op (haben wir), aber Feedback könnte stattdessen als subtile Scale-Animation kompensiert werden.
- **FlatList in BottomSheet** — kann auf Native Scroll-Gesten-Konflikte haben. Bei Bedarf auf `BottomSheetFlatList` swappen.

---

## Accessibility (für später)

- Alle Pressables brauchen `accessibilityLabel` / `accessibilityRole`
- Color-Contrast-Check (aktuelles Dark-Theme wurde nicht gegen WCAG validiert)
- Dynamic-Type-Support auf iOS (Text skaliert mit Systemeinstellung)
- VoiceOver-Flows testen (mindestens: Login, Training erstellen, Training beenden)
- Reduced-Motion-Präferenz respektieren (Animations-Intensität runterdrehen)

---

## Tech-Debt

- **Register-Screen Confirm-Password** wurde entfernt in C1 — ggf. wieder rein
- **Font-Fallback auf iOS** — aktuell nutzen wir Inter auf iOS statt SF Pro. Falls SF Pro gewünscht: wieder Platform-Unterscheidung, aber ohne `Platform` aus react-native in tailwind.config zu importieren (Workaround nötig)
- **Bottom-Sheet-Modal vs. Screen-Navigation** — wir haben 2 Flows auf Sheet umgestellt. Wenn sich einer davon als unpraktisch erweist (z.B. Tastatur-Handling), ist Revert möglich.
- **Current-Exercise Card** im Execute-Screen nutzt `!border-primary`-Overrides — solche `!`-Prefixe sind ein Code-Smell. Sauber wäre Card um einen `borderColor`-Prop zu erweitern.
