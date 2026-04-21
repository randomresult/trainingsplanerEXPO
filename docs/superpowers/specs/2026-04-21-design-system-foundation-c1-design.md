---
name: Design System Foundation - C1
description: Token-Stack, Primitives, Motion-Setup, Bottom-Sheet & Toast, plus migration of existing screens to new UI layer
type: design
date: 2026-04-21
---

# Design System Foundation (C1) Design

## Overview

Foundation pass for the Expo app's UI layer. Establishes a shared component library, token system, motion baseline, and migrates all existing screens onto the new primitives. This is explicitly a visual-quality and consistency pass — **no feature changes**.

Goal: every screen built after C1 looks premium from commit one, without a second polish pass later.

### In Scope (C1)

- Emojis → Ionicons across the entire UI.
- Tailwind token system: colors, surfaces, spacing, typography (iOS HIG 11-variant scale), radii.
- Fonts: SF Pro on iOS (system default), Inter via `expo-font` on Android/Web.
- Haptics helper + Safe Area wrapper baked into primitives.
- Nine custom primitives: `Screen`, `Text`, `Button`, `Card`, `Badge`, `Chip`, `ListItem`, `Avatar`, `Icon`.
- Two overlay primitives: `BottomSheet` (via `@gorhom/bottom-sheet`), `Toast` (via `sonner-native`).
- Migration of two modal routes (`trainings/create`, `trainings/[id]/add-exercises`) to bottom-sheets.
- Migration of all 9 existing screens to the new primitives. TanStack queries, Zustand store, and mutations remain untouched.

### Out of Scope (C2 — future pass)

- Spring animations on stack navigation / shared element transitions.
- Layout animations when lists grow/shrink.
- Skeleton loaders replacing spinners.
- Swipe actions (swipe-to-delete) on cards.
- Header blur on scroll + pull-to-refresh across lists.
- Skia-based visual highlights (animated rings, progress visualizations).

### Also Out of Scope

- Dark/light mode switching — Dark-only is fine for now (user-confirmed).
- Multiple brand-accent theme presets — single primary accent (existing `hsl(252 62 63)` violet).
- UI component libraries (Tamagui, Gluestack, NativeWindUI). Pure custom primitives on NativeWind.
- iPad-responsive multi-column layouts — covered in a later SP.

## 1. Token System

All tokens live in `tailwind.config.js` (extend block). No separate theme module — NativeWind reads directly from the config.

### Colors

Existing:
```
background, foreground, card, card-foreground,
primary, primary-foreground, muted, muted-foreground,
border, success, warning, destructive, destructive-foreground, info
```

Added:
```
surface-1  // slightly lighter than card, for sheets / overlays
surface-2  // one level deeper still, for active/pressed cards
surface-3  // modal backdrops
accent     // subtle hover/press tint, usually primary at low opacity
```

### Typography (iOS HIG 11-variant scale)

`fontSize` extends mapped to named presets. Each entry is `[size, { lineHeight, fontWeight }]`:

| Variant | Size | Line-Height | Weight |
|---|---|---|---|
| `largeTitle` | 34 | 41 | 400 |
| `title1` | 28 | 34 | 400 |
| `title2` | 22 | 28 | 400 |
| `title3` | 20 | 25 | 400 |
| `headline` | 17 | 22 | 600 |
| `body` | 17 | 22 | 400 |
| `callout` | 16 | 21 | 400 |
| `subhead` | 15 | 20 | 400 |
| `footnote` | 13 | 18 | 400 |
| `caption1` | 12 | 16 | 400 |
| `caption2` | 11 | 13 | 400 |

### Font Families

```
fontFamily: {
  sans: Platform.select({
    ios: 'System',          // SF Pro on iOS
    default: 'Inter',       // loaded via expo-font
  }),
}
```

Inter is loaded as `Inter-Regular`, `Inter-Medium`, `Inter-SemiBold`, `Inter-Bold` in `assets/fonts/`. `lib/fonts.ts` exports a `useAppFonts()` hook that wraps `useFonts()` from `expo-font`, returning a ready-flag consumed by the root layout.

### Spacing & Radii

Tailwind default spacing scale is sufficient. Radii extend to include `sm: 6, md: 10, lg: 14, xl: 18, 2xl: 24`.

## 2. File Layout

New additions:
```
components/ui/
  Screen.tsx
  Text.tsx
  Button.tsx
  Card.tsx
  Badge.tsx
  Chip.tsx
  ListItem.tsx
  Avatar.tsx
  Icon.tsx
  BottomSheet.tsx
  Toast.tsx
  index.ts          // re-exports
lib/
  haptics.ts
  fonts.ts
assets/fonts/
  Inter-Regular.ttf
  Inter-Medium.ttf
  Inter-SemiBold.ttf
  Inter-Bold.ttf
```

Existing `components/ExerciseSelector.tsx` and `components/PlayerSelector.tsx` stay where they are but are internally migrated to use the new primitives.

## 3. Primitive APIs

### `<Screen>`

SafeArea wrapper for every screen. Encapsulates `SafeAreaView` + background color + optional scroll.

```tsx
<Screen scroll? edges?={['top','bottom']} padding?="base"|"none">
  {children}
</Screen>
```

### `<Text>`

Typography presets mapped to the 11 HIG variants. Color via tokens.

```tsx
<Text variant="body" color="foreground" weight?="semibold" align?="center" numberOfLines?={1}>
  {children}
</Text>
```

### `<Button>`

Variants: `primary | secondary | ghost | destructive`. Sizes: `sm (h-9) | md (h-11) | lg (h-14)`. Press-state scales to `0.97` with opacity `0.85` via Reanimated spring. Haptic feedback (`impactLight`) fires on press automatically unless disabled.

```tsx
<Button
  variant="primary"
  size="md"
  leftIcon?="add"
  rightIcon?="chevron-forward"
  loading?={isPending}
  disabled?={!canCreate}
  haptic?="light"|"medium"|"heavy"|"off"
  onPress={...}
>
  Training erstellen
</Button>
```

### `<Card>`

Variants: `elevated | flat | outline`. Optional left-accent strip (`accent="left"` + `accentColor="primary" | "warning" | "success" | "destructive"`). Pressable when `onPress` is provided, with the same press-state treatment as `Button`.

### `<Badge>`

Variants: `primary-soft | success-soft | warning-soft | destructive-soft | muted` (soft = token color at ~20% background + full saturation text).

### `<Chip>`

Filter-chip with `active`/`inactive` states. Used in the Trainings filter row (Anstehend / Abgeschlossen).

### `<ListItem>`

Row primitive. `leading` slot (Icon or Avatar), title + optional subtitle, `trailing` slot (chevron, badge, or custom). Pressable with haptic.

```tsx
<ListItem
  leading={<Avatar initials="HG" />}
  title="Harry Glatz"
  subtitle="Aktiv"
  trailing={<Icon name="chevron-forward" color="muted" />}
  onPress={...}
/>
```

### `<Avatar>`

Circle with either `src` (image) or fallback `initials`. Sizes: `sm (32) | md (48) | lg (64) | xl (96)`.

### `<Icon>`

Thin wrapper around `@expo/vector-icons/Ionicons`. Accepts color via token name instead of raw hex.

```tsx
<Icon name="calendar-outline" size={16} color="muted" />
```

### `<BottomSheet>`

Wrapper around `@gorhom/bottom-sheet`. Standardizes snap-points, backdrop, header styling, keyboard behavior.

```tsx
<BottomSheet
  snapPoints={['50%', '90%']}
  header={<Text variant="title2">Training erstellen</Text>}
  onClose={...}
>
  {children}
</BottomSheet>
```

`trainings/create` and `trainings/[id]/add-exercises` become bottom-sheets rather than modal stack routes.

### `<Toast>`

Wraps `sonner-native`. Mounted once in the root layout. Access via `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`. Replaces the current pattern of silent mutation success and `Alert.alert` for errors.

## 4. Screen Migration

Nine screens are migrated in scope:

1. `app/(auth)/login.tsx`
2. `app/(auth)/register.tsx`
3. `app/(tabs)/index.tsx` (dashboard placeholder — kept minimal)
4. `app/(tabs)/library/index.tsx`
5. `app/(tabs)/library/[id].tsx`
6. `app/(tabs)/trainings/index.tsx`
7. `app/(tabs)/trainings/[id]/index.tsx`
8. `app/(tabs)/trainings/[id]/execute.tsx`
9. `app/(tabs)/profile.tsx`

Plus two converted to bottom-sheet:

10. `app/(tabs)/trainings/create.tsx` → invoked as a sheet from the trainings list
11. `app/(tabs)/trainings/[id]/add-exercises.tsx` → invoked as a sheet from detail + execute

### Migration Rules

- **No logic changes.** TanStack hooks, Zustand store, and all mutation handlers stay identical. Only JSX structure and styling change.
- **All screens start with `<Screen>`** (no direct `<View className="flex-1 bg-background">` at screen level).
- **All text goes through `<Text>`** — no bare `<Text>` from `react-native`. Variant expresses intent.
- **Every interactive element uses `<Button>`, `<Card onPress>`, `<ListItem>`, or `<Chip>`**. No raw `<Pressable>` outside these primitives.
- **Emojis are replaced** with Ionicon equivalents:
  - 📅 → `calendar-outline`
  - 👥 → `people-outline`
  - 🏓 → `tennisball-outline` (or a custom asset if we add one)
  - 👤 → `person-outline`
  - ✓ → `checkmark`
  - × → `close`
  - ⏱ → `time-outline`
  - ⏸ / ▶ → `pause` / `play`
- **`Alert.alert` stays for destructive confirms** (delete training, remove exercise). Success/error surfaces move to Toast.

## 5. Dependencies

Installed during P1:

```
npx expo install \
  @expo/vector-icons \
  expo-haptics \
  expo-blur \
  expo-font \
  react-native-reanimated \
  react-native-gesture-handler \
  react-native-safe-area-context

npm install --legacy-peer-deps \
  moti \
  @gorhom/bottom-sheet \
  sonner-native
```

Babel-config update: add Reanimated's babel plugin as the last preset/plugin entry. This is required for Reanimated v3 worklets to compile.

Expo Go compatibility verified for all packages above (as of SDK 54, April 2026).

## 6. Implementation Phases

| Phase | Scope | Commit |
|---|---|---|
| **P1 · Infrastructure** | Deps install, Babel/Reanimated plugin, `expo-font` setup + Inter assets, Tailwind-Tokens extend, Ionicons sanity-check | `chore(ui): install design-system deps and configure tokens` |
| **P2 · Foundation Primitives** | `lib/haptics.ts`, `lib/fonts.ts`, `Screen`, `Text`, `Icon` | `feat(ui): add foundation primitives (Screen, Text, Icon)` |
| **P3 · Interactive Primitives** | `Button`, `Card`, `Badge`, `Chip`, `ListItem`, `Avatar` | `feat(ui): add interactive primitives` |
| **P4 · Overlays** | `BottomSheet` wrapper, `Toast` mount + helper | `feat(ui): add bottom-sheet and toast overlays` |
| **P5 · Auth + Tabs + Profile** | Migrate login, register, tab layout, profile | `refactor(screens): migrate auth and profile to ui primitives` |
| **P6 · Library** | Library list + detail | `refactor(screens): migrate library to ui primitives` |
| **P7 · Trainings Views** | List + detail + execute | `refactor(screens): migrate trainings views to ui primitives` |
| **P8 · Trainings Forms** | `create` + `add-exercises` → BottomSheets | `refactor(screens): convert training modals to bottom-sheets` |
| **P9 · Emojis + Alerts** | Replace all remaining emojis, move success/error to Toast | `refactor(ui): replace emojis with icons and alerts with toasts` |
| **P10 · Polish pass** | Screen-by-screen spacing/safe-area/padding audit | `polish(ui): final consistency pass` |

## 7. Acceptance Criteria

- `npx tsc --noEmit` clean.
- App launches on Web and iOS (Expo Go) without runtime errors.
- All pre-existing user flows pass: register → list → detail → create training → start → check exercises → complete → delete.
- Grep `/[\u{1F300}-\u{1F9FF}]/u` returns zero hits in `app/` and `components/` (no emojis in UI code).
- Grep for `from 'react-native'.*Text` returns zero hits in `app/` (all text imports come from `@/components/ui`).
- Grep for `<Pressable` in `app/` returns zero direct usages outside of internal primitive code.
- `Alert.alert` only appears in destructive-confirm handlers.
- Bottom-sheets open for Create-Training and Add-Exercises flows.
- Haptic feedback fires on every primary/secondary/destructive button press on iOS device.
- Inter font renders correctly on Android/Web, SF Pro on iOS.

## 8. Risks and Open Questions

- **Reanimated + Expo Go SDK 54 compatibility**: the worklets plugin occasionally needs manual `babel.config.js` adjustments. Mitigated by testing in P1 before further work.
- **`@gorhom/bottom-sheet` on Web**: degrades to a fullscreen modal, acceptable (documented).
- **`sonner-native` on Web**: renders as DOM toasts, styling may need minor tweaks.
- **iPad layouts**: not addressed in C1. Screens will look fine but are not iPad-optimized (covered later).
- **Migration risk**: touching 9 screens is surface-area. Mitigated by strict "no-logic-change" rule and running full user flow after each phase.
