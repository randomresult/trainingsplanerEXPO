# Motion & Polish C2 Implementation Plan

## ✅ SHIPPED — 2026-04-25

**PR #6** merged to main (commit 195f8ac).

### What Shipped

- ✅ **Skeleton loaders** (`Skeleton`, `SkeletonLine`, `SkeletonPill`, `SkeletonCard`, `SkeletonList`, `SkeletonDetail`)
  - Shimmer animation (1200ms loop)
  - Integrated in Library, Trainings list, Training detail, Live training, Exercise detail
- ✅ **Pull-to-refresh** (Library + Trainings) via `RefreshControl` + TanStack Query invalidation
- ✅ **Empty/Error states** (`EmptyState`, `ErrorState`) with spring animations
- ✅ **Shared animation configs** (`lib/animations.ts`)
- ✅ **UX improvements**:
  - Larger touch targets: +/- buttons increased 25% (36px→44px, 32px→40px, icons 16px→20px)
  - Filter navigation fix: Push instead of modal to fix iOS nested modal bug
  - Counter badge removed from exercise-picker (confusing UX)

### What Was Skipped

- ❌ **Swipe-to-delete**: Implemented and tested (commits 718831b, 04f0e90, 2f6af22), but reverted (3c1b052) after UX testing — visual cohesion with cards didn't work well, kept standard button-based removal
- ❌ **Header blur on scroll**: Not implemented (deferred to future cycle)
- ❌ **Layout animations**: Not implemented (no list entry animations)

### Commits

- dfa85f9 feat(ui): add shared animation configs
- b2b66ed feat(ui): add skeleton loader primitives
- 37ee42f feat(library): add skeleton loaders to list and detail
- 3992d61 feat(trainings): add skeleton loaders to list and detail
- 56a9555 feat(lists): add pull-to-refresh to library and trainings
- 66c393f fix(exercise-picker): remove confusing success counter badge from header
- 35f0d81 ux(buttons): increase +/- button sizes for easier tapping (40px add, 36px remove)
- 947928f fix(toast): move to bottom above tab bar, reduce width to 90% (max 360px) — **reverted by user**
- fcaf528 fix(exercise-picker): use fullScreenModal to fix nested filter bottom-sheet on iOS
- efce7d4 fix(exercise-picker): use push navigation instead of modal to fix filter bottom-sheet
- b4b7376 feat(ui): add EmptyState and ErrorState components with spring animation
- 718831b feat(ui): add Swipeable component for swipe-to-delete UX
- 04f0e90 feat(ux): integrate swipe-to-delete across all exercise/player lists
- 2f6af22 fix(swipeable): match card border radius for visual cohesion
- 3c1b052 **Revert** "feat(ui): add Swipeable component for swipe-to-delete UX"
- 7b61ccc ux(buttons): increase remove button size for better touch targets

---

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add spring animations, skeleton loaders, header blur, and pull-to-refresh across the app. This is a polish-only cycle — no new features, no data model changes. **Swipe gestures excluded** (keeping card-based UI).

**Architecture:** Skeleton components are primitives in `components/ui/`. Layout animations use Reanimated's `Layout` presets. Header blur uses `expo-blur` with scroll-driven opacity. Pull-to-refresh uses native `RefreshControl` wired to TanStack Query invalidation.

**Tech Stack:** Expo SDK 55 · React Native 0.81 · NativeWind v4 · Reanimated v4 · `expo-blur` · `@tanstack/react-query`.

**Testing approach:** Repo has no test runner. Validation is `npx tsc --noEmit` after every change plus manual flow-testing on Expo Web + Expo Go iOS.

**Branch:** `feature/motion-polish-c2` (branch from `main`).

---

## Pre-conditions

- `main` branch includes Library-Picker merge (commit `eaf5a08` or newer).
- Working tree clean (`git status` shows nothing).
- `npx tsc --noEmit` returns zero errors.
- `react-native-reanimated@^4.1.1`, `react-native-gesture-handler@^2.22.1`, `expo-blur` already in `package.json` (installed in C1).
- All UI primitives exist: `Button`, `Card`, `Text`, `Icon`, `Screen` in `components/ui/`.
- `useExercises`, `useTrainings`, `useTrainingDetail`, `useExerciseDetail` exist in `lib/queries/`.

Verify:
```bash
git status                  # Expected: clean
npx tsc --noEmit            # Expected: no output
git log -1 --oneline        # Expected: recent merge/commit on main
```

---

## File Structure

**New:**
```
components/ui/Skeleton.tsx
components/ui/SkeletonCard.tsx
components/ui/EmptyState.tsx
components/ui/ErrorState.tsx
lib/animations.ts                    # shared spring configs
```

**Modified:**
```
components/ui/index.ts               # export new components
app/(tabs)/library/index.tsx         # skeleton, pull-to-refresh, header blur
app/(tabs)/library/[id].tsx          # skeleton
app/(tabs)/trainings/index.tsx       # skeleton, pull-to-refresh, header blur, layout animations
app/(tabs)/trainings/[id]/index.tsx  # skeleton
app/(tabs)/trainings/[id]/execute.tsx # skeleton
components/ui/Button.tsx             # loading state with inline spinner
```

---

## Phase 1 · Foundation

### Task 1.1 · Create branch

- [ ] **Step 1: Verify clean tree and typecheck**

Run:
```bash
git status
npx tsc --noEmit
```

Both must be clean before continuing.

- [ ] **Step 2: Create and switch to branch**

```bash
git checkout main
git pull
git checkout -b feature/motion-polish-c2
```

Verify:
```bash
git branch --show-current   # Expected: feature/motion-polish-c2
```

---

### Task 1.2 · Animation configs module

Create shared spring configs for consistent motion across the app.

- [ ] **Step 1: Create `lib/animations.ts`**

```tsx
// lib/animations.ts
import { Easing } from 'react-native-reanimated';

export const springConfig = {
  damping: 15,
  stiffness: 120,
  mass: 1,
};

export const layoutSpringConfig = {
  damping: 18,
  stiffness: 140,
};

export const shimmerConfig = {
  duration: 1200,
  easing: Easing.inOut(Easing.ease),
};

export const scrollBlurConfig = {
  scrollThreshold: 100, // pixels to fully opaque
  blurIntensity: 80,
};
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/animations.ts
git commit -m "feat(ui): add shared animation configs"
```

---

## Phase 2 · Skeleton System

### Task 2.1 · Base Skeleton primitive

- [ ] **Step 1: Create `components/ui/Skeleton.tsx`**

```tsx
// components/ui/Skeleton.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { shimmerConfig } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  className?: string;
  delay?: number;
}

export function Skeleton({ width = '100%', height = 16, className, delay = 0 }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: shimmerConfig.duration, easing: shimmerConfig.easing }),
        -1,
        true
      );
    }, delay);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, { width, height }]}
      className={cn('bg-muted rounded-md', className)}
    />
  );
}

interface SkeletonLineProps {
  width?: number | string;
  height?: number;
  className?: string;
  delay?: number;
}

export function SkeletonLine({ width = '100%', height = 16, className, delay }: SkeletonLineProps) {
  return <Skeleton width={width} height={height} className={className} delay={delay} />;
}

interface SkeletonPillProps {
  width?: number;
  className?: string;
  delay?: number;
}

export function SkeletonPill({ width = 60, className, delay }: SkeletonPillProps) {
  return <Skeleton width={width} height={24} className={cn('rounded-full', className)} delay={delay} />;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

---

### Task 2.2 · Skeleton Card variants

- [ ] **Step 1: Create `components/ui/SkeletonCard.tsx`**

```tsx
// components/ui/SkeletonCard.tsx
import React from 'react';
import { View } from 'react-native';
import { SkeletonLine, SkeletonPill } from './Skeleton';

interface SkeletonCardProps {
  delay?: number;
}

export function SkeletonCard({ delay = 0 }: SkeletonCardProps) {
  return (
    <View className="bg-card p-4 rounded-xl border border-border">
      <SkeletonLine width="60%" height={20} className="mb-2" delay={delay} />
      <SkeletonLine width="40%" height={16} className="mb-4" delay={delay} />
      <View className="flex-row gap-2">
        <SkeletonPill width={60} delay={delay} />
        <SkeletonPill width={80} delay={delay} />
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  stagger?: boolean;
}

export function SkeletonList({ count = 5, stagger = true }: SkeletonListProps) {
  return (
    <View className="gap-3">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <SkeletonCard key={i} delay={stagger ? i * 100 : 0} />
        ))}
    </View>
  );
}

export function SkeletonDetail({ delay = 0 }: { delay?: number }) {
  return (
    <View>
      <SkeletonLine width="80%" height={28} className="mb-2" delay={delay} />
      <SkeletonLine width="50%" height={16} className="mb-4" delay={delay} />
      <View className="flex-row gap-2 flex-wrap">
        <SkeletonPill width={70} delay={delay} />
        <SkeletonPill width={90} delay={delay + 50} />
        <SkeletonPill width={60} delay={delay + 100} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Export from `components/ui/index.ts`**

Add:
```tsx
export { Skeleton, SkeletonLine, SkeletonPill } from './Skeleton';
export { SkeletonCard, SkeletonList, SkeletonDetail } from './SkeletonCard';
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/Skeleton.tsx components/ui/SkeletonCard.tsx components/ui/index.ts
git commit -m "feat(ui): add skeleton loader primitives"
```

---

## Phase 3 · Skeleton Integration

### Task 3.1 · Library list skeleton

- [ ] **Step 1: Edit `app/(tabs)/library/index.tsx`**

Find the loading state (currently `ActivityIndicator` or similar). Replace with:

```tsx
import { SkeletonList } from '@/components/ui';

// In component:
if (isLoading) {
  return (
    <Screen>
      {/* Keep header/search bar */}
      <SkeletonList count={6} />
    </Screen>
  );
}
```

- [ ] **Step 2: Test on Web**

```bash
npm run web
```

Navigate to Library tab, verify skeleton appears on load.

- [ ] **Step 3: Typecheck and commit**

```bash
npx tsc --noEmit
git add app/(tabs)/library/index.tsx
git commit -m "feat(library): add skeleton loader to list"
```

---

### Task 3.2 · Library detail skeleton

- [ ] **Step 1: Edit `app/(tabs)/library/[id].tsx`**

Replace loading spinner with:

```tsx
import { SkeletonDetail, SkeletonLine } from '@/components/ui';

if (isLoading) {
  return (
    <Screen>
      <SkeletonDetail />
      <View className="mt-6">
        <SkeletonLine width="30%" height={20} className="mb-3" />
        <SkeletonLine width="100%" height={80} className="mb-4" />
        <SkeletonLine width="100%" height={80} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Test and commit**

```bash
npm run web
# Navigate to exercise detail
npx tsc --noEmit
git add app/(tabs)/library/[id].tsx
git commit -m "feat(library): add skeleton loader to detail"
```

---

### Task 3.3 · Trainings list skeleton

- [ ] **Step 1: Edit `app/(tabs)/trainings/index.tsx`**

Replace loading state:

```tsx
import { SkeletonList } from '@/components/ui';

if (isLoading) {
  return (
    <Screen>
      {/* Keep header/filter chips */}
      <SkeletonList count={5} />
    </Screen>
  );
}
```

- [ ] **Step 2: Test and commit**

```bash
npm run web
npx tsc --noEmit
git add app/(tabs)/trainings/index.tsx
git commit -m "feat(trainings): add skeleton loader to list"
```

---

### Task 3.4 · Training detail skeleton

- [ ] **Step 1: Edit `app/(tabs)/trainings/[id]/index.tsx`**

Replace loading state with skeleton matching the detail layout (header + exercise list).

- [ ] **Step 2: Test and commit**

```bash
npm run web
npx tsc --noEmit
git add app/(tabs)/trainings/[id]/index.tsx
git commit -m "feat(trainings): add skeleton loader to detail"
```

---

### Task 3.5 · Execute screen skeleton

- [ ] **Step 1: Edit `app/(tabs)/trainings/[id]/execute.tsx`**

Replace initial loading spinner with skeleton.

- [ ] **Step 2: Test and commit**

```bash
npm run web
npx tsc --noEmit
git add app/(tabs)/trainings/[id]/execute.tsx
git commit -m "feat(execute): add skeleton loader"
```

---

## Phase 4 · Swipe Actions

### Task 4.1 · Swipeable wrapper component

- [ ] **Step 1: Create `components/ui/Swipeable.tsx`**

```tsx
// components/ui/Swipeable.tsx
import React, { useRef } from 'react';
import { Animated, View, Pressable } from 'react-native';
import { Swipeable as RNSwipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';
import { Text } from './Text';
import { cn } from '@/lib/utils';

interface SwipeableProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onRemove?: () => void;
  deleteLabel?: string;
  removeLabel?: string;
}

export function Swipeable({
  children,
  onDelete,
  onRemove,
  deleteLabel = 'Löschen',
  removeLabel = 'Entfernen',
}: SwipeableProps) {
  const swipeableRef = useRef<RNSwipeable>(null);

  const action = onDelete || onRemove;
  const label = onDelete ? deleteLabel : removeLabel;
  const isDestructive = !!onDelete;

  if (!action) {
    return <>{children}</>;
  }

  const renderRightAction = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={{ transform: [{ translateX: trans }], opacity }}
        className="flex-row"
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            swipeableRef.current?.close();
            action();
          }}
          className={cn(
            'justify-center items-center px-6',
            isDestructive ? 'bg-destructive' : 'bg-muted'
          )}
        >
          <Icon
            name={isDestructive ? 'trash-outline' : 'close-outline'}
            size={24}
            color={isDestructive ? 'destructive-foreground' : 'foreground'}
          />
          <Text
            variant="footnote"
            className={cn(
              'mt-1',
              isDestructive ? 'text-destructive-foreground' : 'text-foreground'
            )}
          >
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <RNSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightAction}
      overshootRight={false}
      friction={2}
      onSwipeableWillOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      {children}
    </RNSwipeable>
  );
}
```

- [ ] **Step 2: Export from `components/ui/index.ts`**

```tsx
export { Swipeable } from './Swipeable';
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/Swipeable.tsx components/ui/index.ts
git commit -m "feat(ui): add swipeable gesture wrapper"
```

---

### Task 4.2 · Swipe-to-delete on training cards

- [ ] **Step 1: Wrap GestureHandlerRootView in layout**

Verify that `app/_layout.tsx` or tab layout has `GestureHandlerRootView` wrapping the navigation:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// In root layout:
<GestureHandlerRootView style={{ flex: 1 }}>
  {/* navigation */}
</GestureHandlerRootView>
```

If not present, add it.

- [ ] **Step 2: Edit `app/(tabs)/trainings/index.tsx`**

Wrap each training card in `<Swipeable>`:

```tsx
import { Swipeable } from '@/components/ui';

// In FlatList renderItem or map:
<Swipeable
  onDelete={() => {
    Alert.alert(
      'Training löschen',
      'Möchtest du dieses Training wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteTraining.mutate(training.documentId),
        },
      ]
    );
  }}
>
  <TrainingCard training={training} />
</Swipeable>
```

- [ ] **Step 3: Test on real iOS device or simulator**

Swipe left on a card → should reveal red delete button with haptic.

- [ ] **Step 4: Typecheck and commit**

```bash
npx tsc --noEmit
git add app/(tabs)/trainings/index.tsx app/_layout.tsx
git commit -m "feat(trainings): add swipe-to-delete on cards"
```

---

### Task 4.3 · Swipe-to-remove on inline exercise/player lists

- [ ] **Step 1: Edit `app/(tabs)/trainings/new.tsx` (or training detail edit mode)**

Wrap exercise and player rows in `<Swipeable onRemove>`:

```tsx
<Swipeable
  onRemove={() => {
    // Remove from local state (no API call, no confirm dialog)
    setExerciseIds(prev => prev.filter(id => id !== exercise.documentId));
  }}
>
  <ExerciseRow exercise={exercise} />
</Swipeable>
```

Same pattern for player rows.

- [ ] **Step 2: Test and commit**

```bash
npm run web
npx tsc --noEmit
git add app/(tabs)/trainings/new.tsx
git commit -m "feat(trainings): add swipe-to-remove on exercise/player lists"
```

---

## Phase 5 · Layout Animations

### Task 5.1 · Add layout animations to training list

- [ ] **Step 1: Edit `app/(tabs)/trainings/index.tsx`**

Import `LinearTransition` from Reanimated and wrap the list container:

```tsx
import Animated, { LinearTransition } from 'react-native-reanimated';

// Wrap the list container:
<Animated.View layout={LinearTransition.springify().damping(18).stiffness(140)}>
  {trainings.map(training => (
    <Swipeable key={training.documentId} onDelete={...}>
      <TrainingCard training={training} />
    </Swipeable>
  ))}
</Animated.View>
```

- [ ] **Step 2: Test delete animation**

Delete a training → card should spring out smoothly.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/trainings/index.tsx
git commit -m "feat(trainings): add layout animations on delete"
```

---

### Task 5.2 · Add layout animations to exercise/player inline lists

- [ ] **Step 1: Edit `app/(tabs)/trainings/new.tsx`**

Wrap exercise and player lists with `Animated.View` + `LinearTransition`:

```tsx
<Animated.View layout={LinearTransition.springify().damping(18).stiffness(140)}>
  {exerciseIds.map(id => (
    <Swipeable key={id} onRemove={...}>
      <ExerciseRow />
    </Swipeable>
  ))}
</Animated.View>
```

- [ ] **Step 2: Test add/remove animation**

Add exercise → springs in. Remove → springs out.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/trainings/new.tsx
git commit -m "feat(trainings): add layout animations to inline lists"
```

---

## Phase 6 · Header Blur on Scroll

### Task 6.1 · Library header blur

- [ ] **Step 1: Edit `app/(tabs)/library/index.tsx`**

Add scroll listener and blur overlay:

```tsx
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Clamp } from 'react-native-reanimated';
import { scrollBlurConfig } from '@/lib/animations';

// In component:
const scrollY = useSharedValue(0);

const headerBlurStyle = useAnimatedStyle(() => ({
  opacity: interpolate(
    scrollY.value,
    [0, scrollBlurConfig.scrollThreshold],
    [0, 1],
    Clamp
  ),
}));

// Header structure:
<View className="relative">
  <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, headerBlurStyle]}>
    <BlurView intensity={scrollBlurConfig.blurIntensity} tint="dark" className="h-full" />
  </Animated.View>
  <View className="relative z-10">
    {/* Search bar, etc */}
  </View>
</View>

// FlatList:
<FlatList
  onScroll={(e) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  }}
  scrollEventThrottle={16}
/>
```

- [ ] **Step 2: Test on iOS**

Scroll down → header becomes translucent blur.

- [ ] **Step 3: Handle Web fallback**

BlurView doesn't work on Web. Use Platform check:

```tsx
import { Platform } from 'react-native';

{Platform.OS !== 'web' && (
  <Animated.View style={headerBlurStyle}>
    <BlurView ... />
  </Animated.View>
)}

{Platform.OS === 'web' && (
  <Animated.View style={[headerBlurStyle, { backgroundColor: 'rgba(10, 10, 15, 0.95)' }]} />
)}
```

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/library/index.tsx
git commit -m "feat(library): add header blur on scroll"
```

---

### Task 6.2 · Trainings header blur

- [ ] **Step 1: Apply same pattern to `app/(tabs)/trainings/index.tsx`**

Same scroll listener + BlurView overlay on header.

- [ ] **Step 2: Test and commit**

```bash
git add app/(tabs)/trainings/index.tsx
git commit -m "feat(trainings): add header blur on scroll"
```

---

## Phase 7 · Pull-to-Refresh

### Task 7.1 · Library pull-to-refresh

- [ ] **Step 1: Edit `app/(tabs)/library/index.tsx`**

Add `RefreshControl` to FlatList:

```tsx
import { RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

// In component:
const queryClient = useQueryClient();
const [refreshing, setRefreshing] = React.useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await queryClient.invalidateQueries({ queryKey: ['exercises'] });
  setRefreshing(false);
};

// In FlatList:
<FlatList
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#92e846" />
  }
/>
```

- [ ] **Step 2: Test**

Pull down on list → spinner appears, data refetches.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/library/index.tsx
git commit -m "feat(library): add pull-to-refresh"
```

---

### Task 7.2 · Trainings pull-to-refresh

- [ ] **Step 1: Apply same to `app/(tabs)/trainings/index.tsx`**

Invalidate `['trainings']` query.

- [ ] **Step 2: Test and commit**

```bash
git add app/(tabs)/trainings/index.tsx
git commit -m "feat(trainings): add pull-to-refresh"
```

---

### Task 7.3 · Training detail pull-to-refresh

- [ ] **Step 1: Apply to `app/(tabs)/trainings/[id]/index.tsx`**

Invalidate `['training', id]` query.

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/trainings/[id]/index.tsx
git commit -m "feat(trainings): add pull-to-refresh to detail"
```

---

## Phase 8 · Empty & Error States

### Task 8.1 · EmptyState component

- [ ] **Step 1: Create `components/ui/EmptyState.tsx`**

```tsx
// components/ui/EmptyState.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Icon } from './Icon';
import { Text } from './Text';
import { Button } from './Button';
import type { IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 120 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center p-6">
      <Animated.View style={animatedStyle}>
        <Icon name={icon} size={64} color="muted" />
      </Animated.View>
      <Text variant="headline" className="mt-6 text-center">
        {title}
      </Text>
      {description && (
        <Text variant="body" color="muted" className="mt-2 text-center">
          {description}
        </Text>
      )}
      {onAction && actionLabel && (
        <Button variant="secondary" onPress={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Export**

```tsx
// components/ui/index.ts
export { EmptyState } from './EmptyState';
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/EmptyState.tsx components/ui/index.ts
git commit -m "feat(ui): add empty state component"
```

---

### Task 8.2 · ErrorState component

- [ ] **Step 1: Create `components/ui/ErrorState.tsx`**

```tsx
// components/ui/ErrorState.tsx
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Fehler beim Laden',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Icon name="alert-circle-outline" size={64} color="destructive" />
      <Text variant="headline" className="mt-4 text-center">
        {title}
      </Text>
      <Text variant="body" color="muted" className="mt-2 text-center">
        {message}
      </Text>
      {onRetry && (
        <Button variant="secondary" onPress={onRetry} className="mt-6">
          Erneut versuchen
        </Button>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Export and commit**

```bash
git add components/ui/ErrorState.tsx components/ui/index.ts
git commit -m "feat(ui): add error state component"
```

---

### Task 8.3 · Integrate empty/error states

- [ ] **Step 1: Library empty state**

In `app/(tabs)/library/index.tsx`, when filtered exercises array is empty:

```tsx
if (!isLoading && exercises.length === 0) {
  return (
    <EmptyState
      icon="search-outline"
      title="Keine Übungen gefunden"
      description="Versuche einen anderen Suchbegriff oder Filter"
    />
  );
}
```

- [ ] **Step 2: Trainings empty state**

In `app/(tabs)/trainings/index.tsx`:

```tsx
if (!isLoading && trainings.length === 0) {
  return (
    <EmptyState
      icon="calendar-outline"
      title="Noch keine Trainings"
      description="Erstelle dein erstes Training"
      actionLabel="Neues Training erstellen"
      onAction={() => router.push('/trainings/new')}
    />
  );
}
```

- [ ] **Step 3: Error states**

Replace existing error handling (currently `Alert.alert` or nothing) with:

```tsx
if (error) {
  return (
    <ErrorState
      message={error.message || 'Ein unbekannter Fehler ist aufgetreten'}
      onRetry={() => refetch()}
    />
  );
}
```

Apply to Library list, Trainings list, Library detail, Training detail.

- [ ] **Step 4: Test and commit**

```bash
git add app/(tabs)/library/index.tsx app/(tabs)/trainings/index.tsx
git commit -m "feat(ui): integrate empty and error states"
```

---

## Phase 9 · Polish & Final Touches

### Task 9.1 · Loading button states

- [ ] **Step 1: Edit `components/ui/Button.tsx`**

Update to show inline spinner when `loading` prop is true:

```tsx
import { ActivityIndicator } from 'react-native';

interface ButtonProps {
  loading?: boolean;
  // ... existing props
}

export function Button({ loading, children, disabled, leftIcon, ...props }: ButtonProps) {
  return (
    <Pressable disabled={disabled || loading} ...>
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} ... />}
          {children}
        </>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 2: Update all button usages with loading states**

Replace blocking spinners with `<Button loading={isPending}>`:
- Login/Register buttons
- Create training submit
- Start/Complete training buttons

- [ ] **Step 3: Commit**

```bash
git add components/ui/Button.tsx app/(auth)/login.tsx app/(auth)/register.tsx
git commit -m "feat(ui): add inline loading state to buttons"
```

---

### Task 9.2 · Scroll-to-top on tab re-tap

- [ ] **Step 1: Library scroll-to-top**

In `app/(tabs)/library/index.tsx`:

```tsx
const scrollRef = useRef<FlatList>(null);
const navigation = useNavigation();

useEffect(() => {
  const unsubscribe = navigation.addListener('tabPress', (e) => {
    scrollRef.current?.scrollToOffset({ offset: 0, animated: true });
  });
  return unsubscribe;
}, [navigation]);

// On FlatList:
<FlatList ref={scrollRef} ... />
```

- [ ] **Step 2: Apply to Trainings list**

Same pattern in `app/(tabs)/trainings/index.tsx`.

- [ ] **Step 3: Test**

Tap active tab → list scrolls to top.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/library/index.tsx app/(tabs)/trainings/index.tsx
git commit -m "feat(tabs): add scroll-to-top on tab re-tap"
```

---

### Task 9.3 · Final polish pass

- [ ] **Step 1: Remove all standalone `ActivityIndicator` usage**

Grep check:
```bash
grep -r "ActivityIndicator" app/ --exclude-dir=node_modules
```

Should only appear in `Button.tsx`, nowhere else.

- [ ] **Step 2: Verify all animations feel smooth**

Test on real device:
- Swipe gestures respond immediately
- Layout animations don't jank
- Skeleton shimmer is subtle, not distracting
- Header blur transitions smoothly

- [ ] **Step 3: Accessibility check (basic)**

Verify reduced motion preference (optional for C2, but good to document):

```tsx
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

// Conditionally disable animations if reduceMotion is true
```

For C2, this is optional — document as TODO for A11y cycle.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "polish(ui): final motion polish pass"
```

---

## Phase 10 · Testing & Merge

### Task 10.1 · Full flow testing

- [ ] **Step 1: Test on Expo Web**

```bash
npm run web
```

**Flow to test:**
1. Navigate to Library → see skeleton → data loads → pull to refresh works
2. Scroll down → header blurs
3. Tap exercise → detail shows skeleton → data loads
4. Navigate to Trainings → see skeleton → swipe card left → delete action appears
5. Create new training → add exercises → swipe to remove works → layout animates
6. Complete full create → delete flow

- [ ] **Step 2: Test on iOS device**

```bash
npm run ios
```

**Focus on:**
- Haptic feedback on swipes
- Smooth animations (no jank)
- Header blur works (not on Web)
- Gestures feel responsive

- [ ] **Step 3: Grep checks**

```bash
# No emojis (should already be done from C1)
grep -r "[\u{1F300}-\u{1F9FF}]" app/ --exclude-dir=node_modules

# No standalone ActivityIndicator outside Button
grep -r "ActivityIndicator" app/ --exclude-dir=node_modules

# No direct <Pressable> in screens (should use Button/Card)
grep -r "<Pressable" app/ --exclude-dir=node_modules
```

All should return minimal/expected results.

- [ ] **Step 4: Typecheck final**

```bash
npx tsc --noEmit
```

---

### Task 10.2 · Create PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feature/motion-polish-c2
```

- [ ] **Step 2: Create PR via gh CLI**

```bash
gh pr create --title "Motion & Polish C2" --body "$(cat <<'EOF'
## Summary
- ✅ Skeleton loaders on all lists and details
- ✅ Swipe-to-delete on training cards
- ✅ Swipe-to-remove on exercise/player inline lists
- ✅ Layout animations on list updates
- ✅ Header blur on scroll (Library + Trainings)
- ✅ Pull-to-refresh on all lists
- ✅ Empty and error states with illustrations
- ✅ Inline loading states in buttons
- ✅ Scroll-to-top on tab re-tap

## Test plan
- [x] Skeleton appears on all loading states
- [x] Swipe gestures work with haptics
- [x] Layout animations smooth (no jank)
- [x] Header blur transitions on scroll
- [x] Pull-to-refresh triggers query invalidation
- [x] Empty/error states show correctly
- [x] All flows still work (create, edit, delete, execute)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Merge when approved**

```bash
gh pr merge --squash
```

---

## Acceptance Criteria

- [ ] `npx tsc --noEmit` returns zero errors
- [ ] App launches on Web + iOS without runtime errors
- [ ] All lists show skeleton loaders on initial load
- [ ] No `ActivityIndicator` outside of `Button` component (grep verified)
- [ ] Swipe-to-delete works on training cards with haptic feedback
- [ ] Swipe-to-remove works on exercise/player rows
- [ ] Layout animations play on add/remove (smooth spring)
- [ ] Header blur visible on scroll (Library + Trainings)
- [ ] Pull-to-refresh triggers refetch on all lists
- [ ] Tab re-tap scrolls to top with animation
- [ ] Empty states show icon + message + CTA
- [ ] Error states show retry button
- [ ] All pre-existing flows still work (login → create → execute → delete)

---

## Risks and Mitigations

**Gesture conflicts:**
- Risk: Swipe gesture conflicts with scroll
- Mitigation: Proper friction config, test on real device

**Web compatibility:**
- Risk: BlurView doesn't work on Web
- Mitigation: Platform-specific fallback to solid bg

**Performance:**
- Risk: Too many animations cause jank
- Mitigation: Test on mid-range device, conditionally disable if needed

**Skeleton mismatch:**
- Risk: Skeleton layout doesn't match loaded content
- Mitigation: Design skeletons per-screen, not generic

---

**Estimated total time:** 15-19 hours
**Phases:** 10
**Tasks:** 25
