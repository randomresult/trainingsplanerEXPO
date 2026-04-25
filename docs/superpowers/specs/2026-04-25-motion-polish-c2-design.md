---
name: Motion & Polish - C2
description: Spring animations, skeleton loaders, swipe actions, header blur, and pull-to-refresh across the app
type: design
date: 2026-04-25
---

# Motion & Polish (C2) Design

## Overview

Second polish cycle focused on motion, micro-interactions, and loading states. C1 established the primitive layer — C2 makes it feel premium and responsive. This is explicitly a **quality-of-life and feel pass** — no new features, no data model changes.

**Goal:** iOS-level feel with spring physics, modern loading patterns, and gesture-based interactions.

### In Scope (C2)

**Motion & Transitions:**
- Layout animations when lists grow/shrink (add/remove items with spring)
- Shared element transitions (optional — if low effort)
- Improved stack navigation spring configs

**Loading States:**
- Skeleton loaders replacing all `ActivityIndicator` spinners
- Skeleton variants: Card, List, Detail-Header
- Stagger animation for skeleton grids

**Swipe Gestures:**
- Swipe-to-delete on Training cards (trainings list)
- Swipe-to-remove on inline Übungen/Spieler lists (create/edit forms)
- Visual feedback: slide-out animation + haptic

**Scroll Enhancements:**
- Header blur effect on scroll (Library + Trainings lists)
- Pull-to-refresh on all lists (Library, Trainings)
- Scroll-to-top on tab bar re-tap

**Other Polish:**
- Improved empty states with illustrations/animations
- Better error states (retry button + illustration)
- Loading button states (spinner inside button, not blocking overlay)

### Out of Scope (C3 or later)

- **Skia-based visual effects** (animated progress rings, custom graphics) — too heavy for C2
- **Spring animations on all pressables** — Button/Card already have scale animations from C1
- **Custom page transitions** between tabs — nice-to-have, not critical
- **Animated charts/graphs** — no dashboard yet
- **Lottie animations** — adds dependency, later if needed

### Also Out of Scope

- New features (still no new screens or data flows)
- Performance optimization (profiling, memoization) — separate tech-debt cycle
- Accessibility improvements (VoiceOver, reduced motion) — separate A11y cycle

## 1. Motion System

### Layout Animations

Use Reanimated's `Layout` presets for enter/exit animations when list items are added/removed.

**Where to apply:**
- Training cards in trainings list (add new → spring in, delete → spring out)
- Exercise rows in create/edit forms (add → spring in, remove → spring out)
- Player rows in create/edit forms (add → spring in, remove → spring out)

**Animation config:**
```tsx
import { LinearTransition } from 'react-native-reanimated';

// On list containers
<Animated.View layout={LinearTransition.springify().damping(15).stiffness(120)}>
  {items.map(item => <TrainingCard key={item.id} />)}
</Animated.View>
```

### Stack Navigation Spring

Override default stack animation with custom spring config for smoother feel.

**Implementation:** Custom transition in Stack.Navigator options
```tsx
<Stack.Screen
  options={{
    animation: 'spring',
    transitionSpec: {
      open: { animation: 'spring', config: { damping: 15, stiffness: 120 } },
      close: { animation: 'spring', config: { damping: 15, stiffness: 120 } }
    }
  }}
/>
```

### Shared Element Transitions (optional)

If trivial to implement: Exercise thumbnail from list → detail hero image.

**Evaluation criteria:** If requires >2h effort or complex navigation hacks, skip for C2.

## 2. Skeleton Loaders

Replace all `ActivityIndicator` with skeleton screens that match the layout of loaded content.

### Skeleton Variants

**SkeletonCard** (for Training/Exercise cards):
```tsx
<View className="bg-card p-4 rounded-xl border border-border">
  <SkeletonLine width="60%" height={20} className="mb-2" />
  <SkeletonLine width="40%" height={16} className="mb-4" />
  <View className="flex-row gap-2">
    <SkeletonPill width={60} />
    <SkeletonPill width={80} />
  </View>
</View>
```

**SkeletonList** (for list screens):
```tsx
<View className="gap-3">
  {Array(5).fill(0).map((_, i) => (
    <SkeletonCard key={i} delay={i * 100} /> // stagger
  ))}
</View>
```

**SkeletonDetail** (for detail headers):
```tsx
<View>
  <SkeletonLine width="80%" height={28} className="mb-2" />
  <SkeletonLine width="50%" height={16} className="mb-4" />
  <View className="flex-row gap-2">
    <SkeletonPill width={70} />
    <SkeletonPill width={90} />
    <SkeletonPill width={60} />
  </View>
</View>
```

### Animation

Shimmer effect with Reanimated:
```tsx
const opacity = useSharedValue(0.3);

useEffect(() => {
  opacity.value = withRepeat(
    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
    -1,
    true
  );
}, []);
```

### Where to apply

- **Library list** (`app/(tabs)/library/index.tsx`) — while `useExercises` is loading
- **Library detail** (`app/(tabs)/library/[id].tsx`) — while `useExerciseDetail` is loading
- **Trainings list** (`app/(tabs)/trainings/index.tsx`) — while `useTrainings` is loading
- **Training detail** (`app/(tabs)/trainings/[id]/index.tsx`) — while `useTrainingDetail` is loading
- **Execute screen** (`app/(tabs)/trainings/[id]/execute.tsx`) — initial load only

## 3. Swipe Actions

### Swipe-to-Delete on Training Cards

**Gesture:** Swipe left on a training card → reveals red delete button → continue swipe or tap button to confirm

**Implementation:** Use `react-native-gesture-handler` Swipeable component or custom PanGestureHandler

**Visual:**
- Card translates left
- Red background with trash icon revealed behind
- Haptic feedback on swipe threshold cross
- Spring animation on release

**Where:** Training cards in `/trainings` list

**Confirm flow:**
- Swipe reveals button
- Tap button → `Alert.alert` confirm (existing pattern)
- On confirm → mutation + optimistic update

### Swipe-to-Remove on Inline Lists

**Where:**
- Exercise rows in `/trainings/new` and `/trainings/[id]` edit mode
- Player rows in `/trainings/new` and `/trainings/[id]` edit mode

**Difference from delete:**
- No confirmation dialog (just removes from local state, doesn't delete from DB)
- Haptic feedback on remove
- Layout animation handles exit

## 4. Scroll Enhancements

### Header Blur on Scroll

**Effect:** Header background becomes translucent blur when scrolling, solid when at top

**Implementation:**
```tsx
import { BlurView } from 'expo-blur';

const scrollY = useSharedValue(0);
const headerOpacity = useDerivedValue(() => {
  return interpolate(scrollY.value, [0, 100], [0, 1], Clamp);
});

<Animated.View style={{ opacity: headerOpacity }}>
  <BlurView intensity={80} tint="dark" />
</Animated.View>
```

**Where:**
- Library header (search bar stays visible)
- Trainings header (filter chips stay visible)

### Pull-to-Refresh

**Implementation:** Use `RefreshControl` component on ScrollView/FlatList

**Behavior:**
- Pull down → show spinner + "Aktualisieren..." text
- On refresh → `queryClient.invalidateQueries(['exercises'])` or `['trainings']`
- Spring animation on release

**Where:**
- Library list
- Trainings list
- Training detail (refreshes exercises/players)

### Scroll-to-Top on Tab Re-tap

**Behavior:** Tap active tab → scrolls list to top with spring animation

**Implementation:**
```tsx
const scrollRef = useRef<ScrollView>(null);

useEffect(() => {
  const unsubscribe = navigation.addListener('tabPress', (e) => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  });
  return unsubscribe;
}, [navigation]);
```

## 5. Empty & Error States

### Empty States

**Pattern:** Illustration (Ionicon) + Title + Subtitle + CTA button

**Examples:**
- Library empty: "Keine Übungen gefunden" + icon `search-outline` + "Filter anpassen"
- Trainings empty: "Noch keine Trainings" + icon `calendar-outline` + "Neues Training erstellen"
- Detail exercises empty: "Noch keine Übungen" + icon `list-outline` + "Übungen hinzufügen"

**Animation:** Icon scales in with spring on mount

### Error States

**Pattern:** Icon + Error message + "Erneut versuchen" button

**Where:** Query error states (replace current silent failures or alerts)

**Implementation:**
```tsx
if (error) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Icon name="alert-circle-outline" size={64} color="destructive" />
      <Text variant="headline" className="mt-4">Fehler beim Laden</Text>
      <Text variant="body" color="muted" className="mt-2 text-center">
        {error.message}
      </Text>
      <Button variant="secondary" onPress={() => refetch()} className="mt-6">
        Erneut versuchen
      </Button>
    </View>
  );
}
```

## 6. Loading Button States

**Current:** Button disabled + separate loading spinner overlay

**New:** Spinner inside button, button stays at same size

**Implementation:**
```tsx
<Button loading={isPending}>
  {isPending ? <ActivityIndicator size="small" color="white" /> : "Speichern"}
</Button>
```

**Where:**
- Create training submit
- Add exercises submit
- Login/Register buttons
- Start/Complete training buttons

## 7. Implementation Phases

| Phase | Scope | Estimated Effort |
|---|---|---|
| **P1 · Skeleton System** | Skeleton primitives (Line, Pill, Card variants), shimmer animation | 2-3h |
| **P2 · Skeleton Integration** | Replace all spinners with skeletons across 5 screens | 2-3h |
| **P3 · Swipe-to-Delete Setup** | Swipeable component wrapper, gesture config | 1-2h |
| **P4 · Swipe on Training Cards** | Integrate into trainings list, wire delete mutation | 1-2h |
| **P5 · Swipe on Inline Lists** | Exercise/Player rows in create/edit forms | 1-2h |
| **P6 · Layout Animations** | Add entering/exiting animations to lists | 1h |
| **P7 · Header Blur** | Blur on scroll for Library + Trainings headers | 2h |
| **P8 · Pull-to-Refresh** | RefreshControl on all lists | 1h |
| **P9 · Empty/Error States** | Redesign all empty/error screens with illustrations | 2h |
| **P10 · Polish Pass** | Scroll-to-top, loading buttons, spring configs, testing | 2h |

**Total estimated:** 15-19 hours

## 8. Acceptance Criteria

- `npx tsc --noEmit` clean
- App launches on Web + iOS without errors
- No `ActivityIndicator` outside of Button component (grep check)
- All lists show skeleton on initial load
- Swipe-to-delete works on training cards with haptic feedback
- Swipe-to-remove works on exercise/player rows in forms
- Header blur visible when scrolling library/trainings lists
- Pull-to-refresh triggers query invalidation on all lists
- Tab re-tap scrolls to top with animation
- All empty states show icon + message + CTA
- All error states show retry button
- Layout animations smooth (no janky list updates)

## 9. Risks and Open Questions

**Gesture Handler conflicts:**
- Swipe gesture on cards might conflict with scroll gesture
- Mitigation: proper gesture priority config, test on real device

**Web compatibility:**
- BlurView degrades on Web (no backdrop-filter in RN Web yet)
- Mitigation: conditionally render solid background on Web platform

**Performance:**
- Too many layout animations could cause jank on lower-end Android
- Mitigation: test on mid-range device, make animations optional if needed

**Skeleton accuracy:**
- Skeleton layout must match loaded content or it feels glitchy
- Mitigation: design skeletons screen-by-screen, not generic

## 10. Design References

**Inspiration:**
- Apple Fitness+ app (tab bar, header blur, skeletons)
- Linear app (swipe actions, empty states)
- Stripe Dashboard (skeleton loaders)

**Motion principles:**
- Spring-based (never linear easing for UI motion)
- Damping: 15-20 (slightly bouncy, not overdone)
- Stiffness: 100-150
- Duration: 300-500ms max
