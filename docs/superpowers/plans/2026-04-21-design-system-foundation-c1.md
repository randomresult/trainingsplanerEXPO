# Design System Foundation (C1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a shared UI primitive library, token system, motion baseline, and migrate all existing screens onto the new layer — no feature changes, visual quality and consistency only.

**Architecture:** NativeWind v4 drives styling via a tightened Tailwind token system (iOS HIG typography, surface tones, radii). Custom primitive components in `components/ui/*` encapsulate layout, press-state (Reanimated spring), haptic feedback (`expo-haptics`), and safe-area. Two overlay primitives (`BottomSheet`, `Toast`) replace modal routes and `Alert.alert` for non-destructive feedback. All 9 existing screens plus 2 selector components are migrated to the primitives.

**Tech Stack:** Expo SDK 54 · React Native 0.81 · NativeWind v4 · `react-native-reanimated` v3 · `react-native-gesture-handler` · `@expo/vector-icons` (Ionicons) · `expo-haptics` · `expo-blur` · `expo-font` · `moti` · `@gorhom/bottom-sheet` · `sonner-native`.

**Testing approach:** The repo has no jest/test runner configured. Validation is done via `npx tsc --noEmit` (strict TypeScript) after every change, and visual verification on Expo Web + Expo Go iOS after each phase. Formal unit tests are out of scope — introducing a test runner is a separate project.

**Branch:** `feature/design-system-foundation` (already created).

---

## Pre-conditions

- On branch `feature/design-system-foundation` at commit `0166965` (spec doc).
- Working tree is clean (`git status` shows nothing).
- Node + npm available. `npx expo` works.
- Strapi backend is live at `https://trainingsplaner-strapi.onrender.com/api`.

Verify:

```bash
git status          # Expected: nothing to commit, working tree clean
git branch --show-current   # Expected: feature/design-system-foundation
npx tsc --noEmit    # Expected: no errors
```

If any verification fails, stop and fix before starting Phase 1.

---

## File Structure

Summary of what will be added or modified across the plan:

```
assets/fonts/              (NEW)
  Inter-Regular.ttf
  Inter-Medium.ttf
  Inter-SemiBold.ttf
  Inter-Bold.ttf

lib/                       (MODIFIED)
  haptics.ts               (NEW)
  fonts.ts                 (NEW)

components/ui/             (NEW DIRECTORY)
  index.ts
  Screen.tsx
  Text.tsx
  Icon.tsx
  Button.tsx
  Card.tsx
  Badge.tsx
  Chip.tsx
  ListItem.tsx
  Avatar.tsx
  BottomSheet.tsx
  Toast.tsx

babel.config.js            (MODIFIED — add reanimated plugin)
tailwind.config.js         (MODIFIED — extend tokens)
app.json                   (MODIFIED — expo-font plugin if needed)
app/_layout.tsx            (MODIFIED — mount providers + fonts + toast)
app/(auth)/login.tsx       (MIGRATED)
app/(auth)/register.tsx    (MIGRATED)
app/(tabs)/_layout.tsx     (MIGRATED — tab icons)
app/(tabs)/index.tsx       (MIGRATED)
app/(tabs)/library/index.tsx            (MIGRATED)
app/(tabs)/library/[id].tsx             (MIGRATED)
app/(tabs)/library/_layout.tsx          (MIGRATED)
app/(tabs)/trainings/index.tsx          (MIGRATED)
app/(tabs)/trainings/_layout.tsx        (MIGRATED — remove modal presentation)
app/(tabs)/trainings/[id]/index.tsx     (MIGRATED)
app/(tabs)/trainings/[id]/execute.tsx   (MIGRATED)
app/(tabs)/trainings/create.tsx         (CONVERTED TO BOTTOM-SHEET)
app/(tabs)/trainings/[id]/add-exercises.tsx  (CONVERTED TO BOTTOM-SHEET)
app/(tabs)/profile.tsx                  (MIGRATED)
components/ExerciseSelector.tsx         (MIGRATED)
components/PlayerSelector.tsx           (MIGRATED)
```

Each file has a single responsibility:
- `lib/haptics.ts` — haptic feedback helper
- `lib/fonts.ts` — font loading hook
- `components/ui/*.tsx` — one primitive per file, default export
- `components/ui/index.ts` — single import point

---

## Phase 1 · Infrastructure

Goal: install all dependencies, configure babel for Reanimated, add Inter font assets, extend Tailwind tokens. End state: App still runs (web + Expo Go) using existing code, but the new tooling is wired up.

### Task 1.1 · Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install Expo-native packages**

Run:
```bash
npx expo install @expo/vector-icons expo-haptics expo-blur expo-font react-native-reanimated react-native-gesture-handler react-native-safe-area-context
```

Expected: packages added to `dependencies` in `package.json`, installer reports SDK 54 compatibility.

- [ ] **Step 2: Install npm-only packages**

Run:
```bash
npm install --legacy-peer-deps moti @gorhom/bottom-sheet sonner-native
```

Expected: `moti`, `@gorhom/bottom-sheet`, `sonner-native` added to `dependencies`.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If errors appear, inspect — some new packages bring type deps that require restart.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(ui): install design-system dependencies"
```

---

### Task 1.2 · Configure Reanimated babel plugin

**Files:**
- Modify: `babel.config.js`

- [ ] **Step 1: Update babel.config.js**

Replace the contents of `babel.config.js` with:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'react-native-worklets/plugin',
    ],
  };
};
```

Note: Reanimated v3 now uses `react-native-worklets/plugin` (previously `react-native-reanimated/plugin`). The plugin must be last.

- [ ] **Step 2: Install the worklets plugin package**

Run:
```bash
npm install --legacy-peer-deps react-native-worklets
```

- [ ] **Step 3: Clear Metro cache and verify bundling**

Run: `npx expo start --clear --web`

Expected: the dev server starts without babel errors. Open browser at the shown URL. Login screen should render (existing app).

- [ ] **Step 4: Stop the dev server** (`Ctrl+C`)

- [ ] **Step 5: Commit**

```bash
git add babel.config.js package.json package-lock.json
git commit -m "chore(ui): add reanimated worklets plugin to babel config"
```

---

### Task 1.3 · Add Inter font assets and loading hook

**Files:**
- Create: `assets/fonts/Inter-Regular.ttf`
- Create: `assets/fonts/Inter-Medium.ttf`
- Create: `assets/fonts/Inter-SemiBold.ttf`
- Create: `assets/fonts/Inter-Bold.ttf`
- Create: `lib/fonts.ts`

- [ ] **Step 1: Download Inter TTFs**

From https://rsms.me/inter/download/ — extract the static TTFs and place into `assets/fonts/`:
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`

Alternative: run the download via a script:

```bash
mkdir -p assets/fonts
curl -L -o /tmp/inter.zip https://rsms.me/inter/font-files/Inter-4.0.zip
unzip -j /tmp/inter.zip "Inter Desktop/Inter-Regular.otf" -d /tmp/ 2>/dev/null || true
```

If those exact zip paths shift, any Inter v4 Regular/Medium/SemiBold/Bold TTF from Google Fonts works; file names **must** match the list above.

- [ ] **Step 2: Create lib/fonts.ts**

Create `lib/fonts.ts`:

```ts
import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  return { loaded, error };
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add assets/fonts lib/fonts.ts
git commit -m "feat(ui): add Inter font assets and loader hook"
```

---

### Task 1.4 · Extend Tailwind tokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Replace tailwind.config.js**

Replace `tailwind.config.js` with:

```js
const { Platform } = require('react-native');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'hsl(0, 0%, 4%)',
        foreground: 'hsl(0, 0%, 100%)',
        card: 'hsl(0, 0%, 10%)',
        'card-foreground': 'hsl(0, 0%, 100%)',
        'surface-1': 'hsl(0, 0%, 13%)',
        'surface-2': 'hsl(0, 0%, 16%)',
        'surface-3': 'hsl(0, 0%, 7%)',
        primary: 'hsl(252, 62%, 63%)',
        'primary-foreground': 'hsl(0, 0%, 100%)',
        accent: 'hsl(252, 62%, 63%)',
        muted: 'hsl(0, 0%, 20%)',
        'muted-foreground': 'hsl(0, 0%, 60%)',
        border: 'hsl(0, 0%, 15%)',
        success: 'hsl(142, 71%, 45%)',
        warning: 'hsl(38, 92%, 50%)',
        destructive: 'hsl(0, 84%, 60%)',
        'destructive-foreground': 'hsl(0, 0%, 100%)',
        info: 'hsl(199, 89%, 48%)',
      },
      fontFamily: {
        sans: Platform.select({
          ios: ['System'],
          default: ['Inter-Regular', 'System'],
        }),
        'sans-medium': Platform.select({
          ios: ['System'],
          default: ['Inter-Medium', 'System'],
        }),
        'sans-semibold': Platform.select({
          ios: ['System'],
          default: ['Inter-SemiBold', 'System'],
        }),
        'sans-bold': Platform.select({
          ios: ['System'],
          default: ['Inter-Bold', 'System'],
        }),
      },
      fontSize: {
        largeTitle: ['34px', { lineHeight: '41px', fontWeight: '400' }],
        title1: ['28px', { lineHeight: '34px', fontWeight: '400' }],
        title2: ['22px', { lineHeight: '28px', fontWeight: '400' }],
        title3: ['20px', { lineHeight: '25px', fontWeight: '400' }],
        headline: ['17px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['17px', { lineHeight: '22px', fontWeight: '400' }],
        callout: ['16px', { lineHeight: '21px', fontWeight: '400' }],
        subhead: ['15px', { lineHeight: '20px', fontWeight: '400' }],
        footnote: ['13px', { lineHeight: '18px', fontWeight: '400' }],
        caption1: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        caption2: ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat(ui): extend tailwind tokens with surfaces, typography, radii"
```

---

## Phase 2 · Foundation Primitives

Goal: low-level helpers (haptics) and three foundation components (`Screen`, `Text`, `Icon`). Everything else depends on these.

### Task 2.1 · Haptics helper

**Files:**
- Create: `lib/haptics.ts`

- [ ] **Step 1: Create lib/haptics.ts**

```ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticStrength = 'light' | 'medium' | 'heavy' | 'selection' | 'off';

export function triggerHaptic(strength: HapticStrength = 'light') {
  if (strength === 'off') return;
  if (Platform.OS === 'web') return;
  try {
    if (strength === 'selection') {
      Haptics.selectionAsync();
      return;
    }
    const map = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    } as const;
    Haptics.impactAsync(map[strength]);
  } catch {
    // no-op — haptics best-effort
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/haptics.ts
git commit -m "feat(ui): add haptics helper"
```

---

### Task 2.2 · Screen primitive

**Files:**
- Create: `components/ui/Screen.tsx`
- Create: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/Screen.tsx**

```tsx
import React from 'react';
import { ScrollView, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils/cn';

type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padding?: 'base' | 'none';
}

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  padding = 'none',
  className,
  style,
  ...rest
}: ScreenProps) {
  const paddingClass = padding === 'base' ? 'px-5' : '';

  const Inner = (
    <View className={cn('flex-1', paddingClass, className)} style={style} {...rest}>
      {children}
    </View>
  );

  if (scroll) {
    return (
      <SafeAreaView edges={edges} className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className={cn('flex-1', paddingClass, className)}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      {Inner}
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Create components/ui/index.ts**

```ts
export { Screen } from './Screen';
export type { ScreenProps } from './Screen';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Screen.tsx components/ui/index.ts
git commit -m "feat(ui): add Screen primitive"
```

---

### Task 2.3 · Text primitive

**Files:**
- Create: `components/ui/Text.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/Text.tsx**

```tsx
import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/utils/cn';

export type TextVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption1'
  | 'caption2';

export type TextColor =
  | 'foreground'
  | 'muted'
  | 'primary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'inverse';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
}

const VARIANT_CLASS: Record<TextVariant, string> = {
  largeTitle: 'text-largeTitle',
  title1: 'text-title1',
  title2: 'text-title2',
  title3: 'text-title3',
  headline: 'text-headline',
  body: 'text-body',
  callout: 'text-callout',
  subhead: 'text-subhead',
  footnote: 'text-footnote',
  caption1: 'text-caption1',
  caption2: 'text-caption2',
};

const COLOR_CLASS: Record<TextColor, string> = {
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  destructive: 'text-destructive',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  inverse: 'text-background',
};

const WEIGHT_CLASS: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function Text({
  variant = 'body',
  color = 'foreground',
  weight,
  className,
  ...rest
}: TextProps) {
  return (
    <RNText
      className={cn(
        VARIANT_CLASS[variant],
        COLOR_CLASS[color],
        weight && WEIGHT_CLASS[weight],
        className
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: Update components/ui/index.ts**

```ts
export { Screen } from './Screen';
export type { ScreenProps } from './Screen';
export { Text } from './Text';
export type { TextProps, TextVariant, TextColor, TextWeight } from './Text';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Text.tsx components/ui/index.ts
git commit -m "feat(ui): add Text primitive with iOS HIG variants"
```

---

### Task 2.4 · Icon primitive

**Files:**
- Create: `components/ui/Icon.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/Icon.tsx**

```tsx
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type IconColor =
  | 'foreground'
  | 'muted'
  | 'primary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'inverse';

const COLOR_HEX: Record<IconColor, string> = {
  foreground: '#ffffff',
  muted: '#999999',
  primary: '#8b5cf6',
  destructive: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#0ea5e9',
  inverse: '#0a0a0f',
};

export interface IconProps {
  name: IoniconsName;
  size?: number;
  color?: IconColor;
}

export function Icon({ name, size = 20, color = 'foreground' }: IconProps) {
  return <Ionicons name={name} size={size} color={COLOR_HEX[color]} />;
}
```

- [ ] **Step 2: Update components/ui/index.ts**

```ts
export { Screen } from './Screen';
export type { ScreenProps } from './Screen';
export { Text } from './Text';
export type { TextProps, TextVariant, TextColor, TextWeight } from './Text';
export { Icon } from './Icon';
export type { IconProps } from './Icon';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Icon.tsx components/ui/index.ts
git commit -m "feat(ui): add Icon primitive (Ionicons wrapper)"
```

---

## Phase 3 · Interactive Primitives

Goal: press-state primitives for user input. All pressable primitives share a `useAnimatedPressable` hook for consistent scale + opacity.

### Task 3.1 · Button primitive

**Files:**
- Create: `components/ui/Button.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/Button.tsx**

```tsx
import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Icon } from './Icon';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic, HapticStrength } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const VARIANT: Record<Variant, { bg: string; text: 'inverse' | 'foreground' | 'destructive' | 'primary' }> = {
  primary: { bg: 'bg-primary', text: 'inverse' },
  secondary: { bg: 'bg-surface-1 border border-border', text: 'foreground' },
  ghost: { bg: 'bg-transparent', text: 'primary' },
  destructive: { bg: 'bg-destructive', text: 'inverse' },
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 rounded-md',
  md: 'h-11 px-4 rounded-lg',
  lg: 'h-14 px-5 rounded-xl',
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: Variant;
  size?: Size;
  leftIcon?: IoniconsName;
  rightIcon?: IoniconsName;
  loading?: boolean;
  haptic?: HapticStrength;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  haptic = 'light',
  disabled,
  onPress,
  children,
  className,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    opacity.value = withSpring(0.85, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    opacity.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    triggerHaptic(haptic);
    onPress?.(e);
  };

  const v = VARIANT[variant];
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={animatedStyle} className={cn(isDisabled && 'opacity-50')}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled}
        className={cn('flex-row items-center justify-center gap-2', v.bg, SIZE[size], className)}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            {leftIcon && <Icon name={leftIcon} size={18} color={v.text} />}
            <Text variant={size === 'sm' ? 'subhead' : 'body'} weight="semibold" color={v.text}>
              {children}
            </Text>
            {rightIcon && <Icon name={rightIcon} size={18} color={v.text} />}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Update components/ui/index.ts**

```ts
export { Screen } from './Screen';
export type { ScreenProps } from './Screen';
export { Text } from './Text';
export type { TextProps, TextVariant, TextColor, TextWeight } from './Text';
export { Icon } from './Icon';
export type { IconProps } from './Icon';
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Button.tsx components/ui/index.ts
git commit -m "feat(ui): add Button primitive with spring press-state and haptics"
```

---

### Task 3.2 · Card primitive

**Files:**
- Create: `components/ui/Card.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/Card.tsx**

```tsx
import React from 'react';
import { Pressable, PressableProps, View, ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { triggerHaptic, HapticStrength } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';

type Variant = 'elevated' | 'flat' | 'outline';
type AccentColor = 'primary' | 'warning' | 'success' | 'destructive' | 'muted';

const VARIANT: Record<Variant, string> = {
  elevated: 'bg-card border border-border',
  flat: 'bg-surface-1',
  outline: 'bg-transparent border border-border',
};

const ACCENT: Record<AccentColor, string> = {
  primary: 'border-l-primary',
  warning: 'border-l-warning',
  success: 'border-l-success',
  destructive: 'border-l-destructive',
  muted: 'border-l-muted',
};

export interface CardProps extends Omit<ViewProps, 'children' | 'style'> {
  variant?: Variant;
  accent?: 'left';
  accentColor?: AccentColor;
  onPress?: PressableProps['onPress'];
  haptic?: HapticStrength;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'elevated',
  accent,
  accentColor = 'primary',
  onPress,
  haptic = 'light',
  children,
  className,
  ...rest
}: CardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardClasses = cn(
    'rounded-2xl p-5',
    VARIANT[variant],
    accent === 'left' && 'border-l-4',
    accent === 'left' && ACCENT[accentColor],
    className
  );

  if (!onPress) {
    return (
      <View className={cardClasses} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 400 });
        }}
        onPress={(e) => {
          triggerHaptic(haptic);
          onPress(e);
        }}
        className={cardClasses}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Update components/ui/index.ts**

Add the Card export:

```ts
export { Card } from './Card';
export type { CardProps } from './Card';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Card.tsx components/ui/index.ts
git commit -m "feat(ui): add Card primitive with optional accent and press-state"
```

---

### Task 3.3 · Badge primitive

**Files:**
- Create: `components/ui/Badge.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/Badge.tsx**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { cn } from '@/lib/utils/cn';

type Variant =
  | 'primary-soft'
  | 'success-soft'
  | 'warning-soft'
  | 'destructive-soft'
  | 'info-soft'
  | 'muted';

const VARIANT_BG: Record<Variant, string> = {
  'primary-soft': 'bg-primary/20',
  'success-soft': 'bg-success/20',
  'warning-soft': 'bg-warning/20',
  'destructive-soft': 'bg-destructive/20',
  'info-soft': 'bg-info/20',
  muted: 'bg-muted',
};

const VARIANT_COLOR = {
  'primary-soft': 'primary',
  'success-soft': 'success',
  'warning-soft': 'warning',
  'destructive-soft': 'destructive',
  'info-soft': 'info',
  muted: 'muted',
} as const;

export interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'muted', children, className }: BadgeProps) {
  return (
    <View className={cn('self-start rounded-md px-2.5 py-1', VARIANT_BG[variant], className)}>
      <Text variant="caption1" weight="semibold" color={VARIANT_COLOR[variant]}>
        {children}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Update components/ui/index.ts**

Add:

```ts
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Badge.tsx components/ui/index.ts
git commit -m "feat(ui): add Badge primitive"
```

---

### Task 3.4 · Chip primitive

**Files:**
- Create: `components/ui/Chip.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/Chip.tsx**

```tsx
import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { Text } from './Text';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';

export interface ChipProps extends Omit<PressableProps, 'children'> {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ active, onPress, children, className, ...rest }: ChipProps) {
  return (
    <Pressable
      onPress={(e) => {
        triggerHaptic('selection');
        onPress?.(e);
      }}
      className={cn(
        'px-4 py-2.5 rounded-full border',
        active ? 'bg-primary/20 border-primary' : 'bg-card border-border',
        className
      )}
      {...rest}
    >
      <Text
        variant="subhead"
        weight="medium"
        color={active ? 'primary' : 'muted'}
      >
        {children}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Update components/ui/index.ts**

```ts
export { Chip } from './Chip';
export type { ChipProps } from './Chip';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Chip.tsx components/ui/index.ts
git commit -m "feat(ui): add Chip primitive"
```

---

### Task 3.5 · ListItem primitive

**Files:**
- Create: `components/ui/ListItem.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/ListItem.tsx**

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Icon } from './Icon';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils/cn';

export interface ListItemProps {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  className?: string;
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  showChevron,
  className,
}: ListItemProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <View className={cn('flex-row items-center py-3 px-4 gap-3', className)}>
      {leading && <View>{leading}</View>}
      <View className="flex-1">
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="footnote" color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && !trailing && <Icon name="chevron-forward" color="muted" size={18} />}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 20, stiffness: 400 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 20, stiffness: 400 }))}
        onPress={() => {
          triggerHaptic('light');
          onPress();
        }}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Update components/ui/index.ts**

```ts
export { ListItem } from './ListItem';
export type { ListItemProps } from './ListItem';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/ListItem.tsx components/ui/index.ts
git commit -m "feat(ui): add ListItem primitive"
```

---

### Task 3.6 · Avatar primitive

**Files:**
- Create: `components/ui/Avatar.tsx`
- Modify: `components/ui/index.ts`

- [ ] **Step 1: Create components/ui/Avatar.tsx**

```tsx
import React from 'react';
import { Image, View } from 'react-native';
import { Text } from './Text';
import { cn } from '@/lib/utils/cn';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<Size, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const SIZE_TEXT_VARIANT: Record<Size, 'caption1' | 'subhead' | 'body' | 'title2'> = {
  sm: 'caption1',
  md: 'subhead',
  lg: 'body',
  xl: 'title2',
};

export interface AvatarProps {
  src?: string;
  initials?: string;
  size?: Size;
  className?: string;
}

export function Avatar({ src, initials, size = 'md', className }: AvatarProps) {
  return (
    <View
      className={cn(
        'rounded-full bg-primary/10 items-center justify-center overflow-hidden',
        SIZE_CLASS[size],
        className
      )}
    >
      {src ? (
        <Image source={{ uri: src }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Text variant={SIZE_TEXT_VARIANT[size]} weight="bold" color="primary">
          {initials?.slice(0, 2).toUpperCase() ?? '?'}
        </Text>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Update components/ui/index.ts**

```ts
export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Avatar.tsx components/ui/index.ts
git commit -m "feat(ui): add Avatar primitive"
```

---

## Phase 4 · Overlays

Goal: bottom-sheet and toast infrastructure. Both require mounting providers at the root.

### Task 4.1 · BottomSheet wrapper

**Files:**
- Create: `components/ui/BottomSheet.tsx`
- Modify: `components/ui/index.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create components/ui/BottomSheet.tsx**

```tsx
import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import BottomSheetModal, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Text } from './Text';
import { Icon } from './Icon';
import { Pressable } from 'react-native';
import { triggerHaptic } from '@/lib/haptics';

export interface BottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

export interface BottomSheetProps {
  snapPoints?: (string | number)[];
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  { snapPoints = ['50%', '90%'], title, children, onDismiss },
  ref
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const memoSnap = useMemo(() => snapPoints, [snapPoints]);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={memoSnap}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'hsl(0, 0%, 10%)' }}
      handleIndicatorStyle={{ backgroundColor: 'hsl(0, 0%, 40%)' }}
      onDismiss={onDismiss}
    >
      <BottomSheetView className="flex-1 px-5">
        {title && (
          <View className="flex-row items-center justify-between pt-2 pb-4 border-b border-border mb-4">
            <Text variant="title2" weight="bold">
              {title}
            </Text>
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                sheetRef.current?.dismiss();
              }}
              className="w-8 h-8 rounded-full bg-surface-1 items-center justify-center"
            >
              <Icon name="close" size={16} color="muted" />
            </Pressable>
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
```

- [ ] **Step 2: Update components/ui/index.ts**

```ts
export { BottomSheet } from './BottomSheet';
export type { BottomSheetRef, BottomSheetProps } from './BottomSheet';
```

- [ ] **Step 3: Mount BottomSheetModalProvider and GestureHandlerRootView in root layout**

Modify `app/_layout.tsx`. Replace the contents with:

```tsx
import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/lib/store';
import { useAppFonts } from '@/lib/fonts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isRestored, restoreSession } = useAuthStore();
  const { loaded: fontsLoaded } = useAppFonts();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isRestored, segments]);

  if (!isRestored || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <RootLayoutNav />
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/ui/BottomSheet.tsx components/ui/index.ts app/_layout.tsx
git commit -m "feat(ui): add BottomSheet primitive and mount providers"
```

---

### Task 4.2 · Toast integration

**Files:**
- Create: `components/ui/Toast.tsx`
- Modify: `components/ui/index.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create components/ui/Toast.tsx**

```tsx
import { Toaster, toast as sonnerToast } from 'sonner-native';

export const Toaster = Toaster;

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast(message),
  dismiss: () => sonnerToast.dismiss(),
};
```

- [ ] **Step 2: Update components/ui/index.ts**

```ts
export { Toaster, toast } from './Toast';
```

- [ ] **Step 3: Mount Toaster in root layout**

In `app/_layout.tsx`, import `Toaster` from `@/components/ui` and add it inside `BottomSheetModalProvider`:

```tsx
import { Toaster } from '@/components/ui';

// ... inside the RootLayout return:
<BottomSheetModalProvider>
  <RootLayoutNav />
  <Toaster
    position="top-center"
    offset={60}
    duration={3000}
    toastOptions={{
      style: {
        backgroundColor: 'hsl(0, 0%, 13%)',
        borderWidth: 1,
        borderColor: 'hsl(0, 0%, 15%)',
      },
    }}
  />
</BottomSheetModalProvider>
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify app still launches**

Run: `npx expo start --clear --web`

Expected: app bundles without errors, login screen renders.
Stop server with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add components/ui/Toast.tsx components/ui/index.ts app/_layout.tsx
git commit -m "feat(ui): add Toast system and mount Toaster at root"
```

---

## Phase 5 · Auth + Tabs + Profile Migration

Goal: migrate the simplest screens first to validate the primitives are sufficient before touching more complex screens.

**Migration Principles (apply to every screen task from here on):**
- Replace top-level `<View className="flex-1 bg-background">` with `<Screen>`.
- Replace bare `<Text>` from `react-native` with `<Text variant="...">` from `@/components/ui`.
- Replace `<Pressable>` with `<Button>`, `<Card onPress>`, `<ListItem>`, or `<Chip>` as appropriate.
- Replace emojis with `<Icon>`.
- Surface success/error via `toast.success() / toast.error()` where the screen previously had silent mutations or ad-hoc Alert fallbacks.
- No logic changes to TanStack queries, Zustand store, or mutation handlers.

### Task 5.1 · Migrate login screen

**Files:**
- Modify: `app/(auth)/login.tsx`

- [ ] **Step 1: Read current file**

Read `app/(auth)/login.tsx` to understand its current structure.

- [ ] **Step 2: Rewrite using primitives**

Replace the file contents. Keep `useLogin` hook usage, credential state, and the form validation logic unchanged. Example target structure:

```tsx
import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Text, Button } from '@/components/ui';
import { useLogin } from '@/lib/queries/useAuth';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  return (
    <Screen padding="base">
      <View className="flex-1 justify-center">
        <Text variant="largeTitle" weight="bold" className="mb-2">
          Anmelden
        </Text>
        <Text variant="body" color="muted" className="mb-8">
          Willkommen zurück beim TT Trainingsplaner.
        </Text>

        <View className="mb-4">
          <Text variant="subhead" weight="semibold" className="mb-2">
            E-Mail oder Benutzername
          </Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            placeholder="trainer@example.com"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <View className="mb-6">
          <Text variant="subhead" weight="semibold" className="mb-2">
            Passwort
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <Button
          size="lg"
          loading={login.isPending}
          disabled={!identifier.trim() || !password.trim()}
          onPress={() => login.mutate({ identifier, password })}
        >
          Anmelden
        </Button>

        {login.isError && (
          <Text variant="footnote" color="destructive" className="mt-3 text-center">
            Anmeldung fehlgeschlagen. Bitte überprüfe deine Eingaben.
          </Text>
        )}

        <View className="mt-8 flex-row justify-center">
          <Text variant="footnote" color="muted">Noch kein Konto? </Text>
          <Link href="/(auth)/register">
            <Text variant="footnote" color="primary" weight="semibold">
              Registrieren
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/login.tsx
git commit -m "refactor(screens): migrate login to ui primitives"
```

---

### Task 5.2 · Migrate register screen

**Files:**
- Modify: `app/(auth)/register.tsx`

- [ ] **Step 1: Read current file**

Read `app/(auth)/register.tsx`.

- [ ] **Step 2: Rewrite using primitives**

Keep the `useRegister` hook and all form state unchanged. Replace the JSX with:

```tsx
import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Text, Button } from '@/components/ui';
import { useRegister } from '@/lib/queries/useAuth';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister();

  const canSubmit =
    username.trim() && email.trim() && password.length >= 6;

  return (
    <Screen scroll padding="base">
      <View className="flex-1 justify-center py-8">
        <Text variant="largeTitle" weight="bold" className="mb-2">
          Registrieren
        </Text>
        <Text variant="body" color="muted" className="mb-8">
          Erstelle ein Trainer-Konto.
        </Text>

        <View className="mb-4">
          <Text variant="subhead" weight="semibold" className="mb-2">
            Benutzername
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="trainer_name"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <View className="mb-4">
          <Text variant="subhead" weight="semibold" className="mb-2">
            E-Mail
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="trainer@example.com"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <View className="mb-6">
          <Text variant="subhead" weight="semibold" className="mb-2">
            Passwort
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mindestens 6 Zeichen"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        <Button
          size="lg"
          loading={register.isPending}
          disabled={!canSubmit}
          onPress={() => register.mutate({ username, email, password })}
        >
          Registrieren
        </Button>

        {register.isError && (
          <Text variant="footnote" color="destructive" className="mt-3 text-center">
            Registrierung fehlgeschlagen. Bitte versuche es erneut.
          </Text>
        )}

        <View className="mt-8 flex-row justify-center">
          <Text variant="footnote" color="muted">Bereits ein Konto? </Text>
          <Link href="/(auth)/login">
            <Text variant="footnote" color="primary" weight="semibold">
              Anmelden
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/register.tsx
git commit -m "refactor(screens): migrate register to ui primitives"
```

---

### Task 5.3 · Migrate tab layout with Ionicons

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Read current file**

Read `app/(tabs)/_layout.tsx`.

- [ ] **Step 2: Replace emojis with Ionicons**

Replace the contents with (keep existing tab order):

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f' },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#1a1a24',
          borderTopColor: '#2a2a3a',
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Bibliothek',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trainings"
        options={{
          title: 'Training',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "refactor(tabs): use ionicons for tab bar icons"
```

---

### Task 5.4 · Migrate dashboard placeholder (tab index)

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Read current file**

Read `app/(tabs)/index.tsx`.

- [ ] **Step 2: Rewrite using primitives**

Target:

```tsx
import { View } from 'react-native';
import { Screen, Text, Icon } from '@/components/ui';
import { useAuthStore } from '@/lib/store';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <Screen scroll padding="base">
      <Text variant="largeTitle" weight="bold" className="mb-1 mt-2">
        Hallo {user?.firstName ?? user?.username ?? 'Trainer'}
      </Text>
      <Text variant="body" color="muted" className="mb-6">
        Willkommen zurück.
      </Text>

      <View className="bg-card rounded-2xl p-6 items-center border border-border">
        <Icon name="construct-outline" size={40} color="muted" />
        <Text variant="headline" className="mt-3 mb-1">
          Dashboard in Arbeit
        </Text>
        <Text variant="footnote" color="muted" className="text-center">
          Statistiken und Übersichten kommen in Sub-Project 2.
        </Text>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "refactor(screens): migrate dashboard placeholder to ui primitives"
```

---

### Task 5.5 · Migrate profile screen

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Read current file**

Read `app/(tabs)/profile.tsx`.

- [ ] **Step 2: Rewrite using primitives**

Target:

```tsx
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Button, Card, Avatar } from '@/components/ui';
import { useAuthStore } from '@/lib/store';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const initials =
    user?.firstName && user?.lastName
      ? (user.firstName[0] ?? '') + (user.lastName[0] ?? '')
      : user?.username?.slice(0, 2) ?? 'T';

  return (
    <Screen scroll padding="base">
      <Text variant="largeTitle" weight="bold" className="mb-6 mt-2">
        Profil
      </Text>

      <Card className="items-center mb-4">
        <Avatar initials={initials} size="xl" className="mb-3" />
        <Text variant="title3" weight="semibold" className="mb-1">
          {[user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
            user?.username ||
            'Trainer'}
        </Text>
        <Text variant="footnote" color="muted">
          {user?.email ?? ''}
        </Text>

        {user?.clubs && user.clubs.length > 0 && (
          <View className="border-t border-border pt-3 mt-4 w-full">
            <Text variant="caption1" color="muted" className="mb-1">
              {user.clubs.length === 1 ? 'Verein' : 'Vereine'}
            </Text>
            <Text variant="subhead" weight="semibold">
              {user.clubs.map((c) => c.Name).join(', ')}
            </Text>
          </View>
        )}
      </Card>

      <Card className="mb-4">
        <Text variant="footnote" color="muted" className="text-center">
          Weitere Profil-Features kommen in Sub-Project 2
        </Text>
      </Card>

      <Button variant="destructive" size="lg" onPress={handleLogout}>
        Abmelden
      </Button>
    </Screen>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "refactor(screens): migrate profile to ui primitives"
```

---

## Phase 6 · Library Migration

### Task 6.1 · Migrate library list

**Files:**
- Modify: `app/(tabs)/library/index.tsx`
- Modify: `app/(tabs)/library/_layout.tsx`

- [ ] **Step 1: Read current files**

Read `app/(tabs)/library/index.tsx` and `app/(tabs)/library/_layout.tsx`.

- [ ] **Step 2: Migrate library list**

Rewrite `app/(tabs)/library/index.tsx` to use `Screen`, `Text`, `Icon`, `Card`, `ListItem`. Keep the `useExercises(searchQuery)` hook unchanged and the TextInput search field. Each exercise becomes a `Card onPress={() => router.push('/library/' + ex.documentId)}` with a headline, body description truncated, and minutes footnote. Replace emoji markers with Icons (`time-outline` for minutes, `trending-up-outline` or similar for difficulty).

Example card content inside the FlatList renderItem:

```tsx
<Card onPress={() => router.push(`/library/${item.documentId}`)} className="mb-3">
  <Text variant="headline" className="mb-1" numberOfLines={1}>
    {item.Name}
  </Text>
  <Text variant="footnote" color="muted" numberOfLines={2} className="mb-2">
    {item.Description}
  </Text>
  <View className="flex-row items-center gap-4">
    <View className="flex-row items-center gap-1">
      <Icon name="time-outline" size={14} color="muted" />
      <Text variant="caption1" color="muted">{item.Minutes} Min</Text>
    </View>
    {item.Difficulty && (
      <View className="flex-row items-center gap-1">
        <Icon name="trending-up-outline" size={14} color="muted" />
        <Text variant="caption1" color="muted">{item.Difficulty}</Text>
      </View>
    )}
  </View>
</Card>
```

- [ ] **Step 3: Migrate library layout**

Ensure `app/(tabs)/library/_layout.tsx` still registers the `index` and `[id]` screens. Title strings can use iOS-HIG-style capitalization.

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/library/index.tsx app/(tabs)/library/_layout.tsx
git commit -m "refactor(screens): migrate library list to ui primitives"
```

---

### Task 6.2 · Migrate library detail

**Files:**
- Modify: `app/(tabs)/library/[id].tsx`

- [ ] **Step 1: Read current file**

Read `app/(tabs)/library/[id].tsx`.

- [ ] **Step 2: Rewrite using primitives**

Keep `useExerciseDetail(id)` unchanged. Wrap in `<Screen scroll padding="base">`. Structure:

```tsx
<Screen scroll padding="base">
  <Text variant="largeTitle" weight="bold" className="mb-2 mt-2">
    {exercise.Name}
  </Text>

  <View className="flex-row gap-3 mb-5">
    <Badge variant="muted">
      <View className="flex-row items-center gap-1">
        <Icon name="time-outline" size={12} color="muted" />
        <Text variant="caption1" color="muted">{exercise.Minutes} Min</Text>
      </View>
    </Badge>
    {exercise.Difficulty && (
      <Badge variant="info-soft">{exercise.Difficulty}</Badge>
    )}
  </View>

  {exercise.Description && (
    <>
      <Text variant="headline" className="mb-2">Beschreibung</Text>
      <Text variant="body" color="muted" className="mb-6 leading-relaxed">
        {exercise.Description}
      </Text>
    </>
  )}

  {exercise.Steps && exercise.Steps.length > 0 && (
    <>
      <Text variant="headline" className="mb-3">Anleitung</Text>
      {exercise.Steps.map((step: any, idx: number) => {
        const title = typeof step === 'string' ? step : step?.Name;
        const body = typeof step === 'string' ? null : step?.Description;
        return (
          <Card key={step?.id ?? idx} className="mb-3">
            <View className="flex-row gap-3">
              <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center">
                <Text variant="caption1" weight="bold" color="primary">{idx + 1}</Text>
              </View>
              <View className="flex-1">
                <Text variant="body" weight="semibold" className="mb-1">{title}</Text>
                {body && <Text variant="footnote" color="muted">{body}</Text>}
              </View>
            </View>
          </Card>
        );
      })}
    </>
  )}

  {exercise.Hint && (
    <Card variant="outline" className="border-warning bg-warning/10 mt-2">
      <View className="flex-row items-start gap-2">
        <Icon name="bulb-outline" color="warning" size={18} />
        <View className="flex-1">
          <Text variant="subhead" weight="semibold" color="warning" className="mb-1">
            Trainer-Hinweis
          </Text>
          <Text variant="footnote" color="foreground">{exercise.Hint}</Text>
        </View>
      </View>
    </Card>
  )}
</Screen>
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/library/[id].tsx
git commit -m "refactor(screens): migrate library detail to ui primitives"
```

---

## Phase 7 · Trainings Views Migration

### Task 7.1 · Migrate trainings list

**Files:**
- Modify: `app/(tabs)/trainings/index.tsx`

- [ ] **Step 1: Read current file**

Read `app/(tabs)/trainings/index.tsx` (this was rewritten in Mock-Style earlier — now it needs to adopt primitives).

- [ ] **Step 2: Rewrite using primitives**

Keep `useTrainings()` hook, filter state (`upcoming | completed`), `formatDate` helper unchanged. Replace all `View`/`Text`/`Pressable` with primitives.

Key transformations:

- Top header: `<Screen>` → `<Text variant="largeTitle" weight="bold">Training</Text>` → `<Button leftIcon="add" size="md">Neues Training erstellen</Button>`
- Filter row: replace the flex-row of filter pills with two `<Chip active={} onPress={}>` inside a `<View className="flex-row gap-2 px-5 py-3.5 border-b border-border">`.
- Training card: use `<Card accent="left" accentColor={isActive ? 'warning' : isCompleted ? 'success' : 'primary'} onPress={() => router.push(...)}>`. Replace emojis 📅 → `<Icon name="calendar-outline">`, 👥 → `<Icon name="people-outline">`, "Läuft" badge → `<Badge variant="warning-soft">Läuft</Badge>` positioned absolute top-right.
- Training name: `<Text variant="headline">`. "Du bist Trainer": `<Badge variant="primary-soft">Du bist Trainer</Badge>`.

Example card:

```tsx
<Card
  accent="left"
  accentColor={isActive ? 'warning' : isCompleted ? 'success' : 'primary'}
  onPress={() => router.push(`/trainings/${item.documentId}`)}
  className="mb-4"
>
  {isActive && (
    <View className="absolute top-4 right-4">
      <Badge variant="warning-soft">Läuft</Badge>
    </View>
  )}
  <Text variant="headline" className="mb-2 pr-20">{item.Name}</Text>
  <Badge variant="primary-soft" className="mb-3">Du bist Trainer</Badge>

  <View className="flex-row items-center gap-1.5 mb-2">
    <Icon name="calendar-outline" size={14} color="muted" />
    <Text variant="footnote" color="muted">{formatDate(item.Date)}</Text>
  </View>

  <View className="flex-row items-center gap-1.5 mb-4">
    <Icon name="people-outline" size={14} color="muted" />
    <Text variant="caption1" color="muted">
      {item.players?.length || 0} Teilnehmer
    </Text>
  </View>

  <View className="flex-row justify-between items-center">
    <Text variant="footnote" color="muted">
      {item.exercises?.length || 0} Übungen
      {item.actualDuration ? ` • ${Math.round(item.actualDuration / 60)} Min` : ''}
    </Text>
    <Button size="sm" variant="primary">
      {isActive ? 'Fortsetzen' : isCompleted ? 'Ansehen' : 'Öffnen'}
    </Button>
  </View>
</Card>
```

**Important:** the "Öffnen" Button inside the Card must not trigger its own onPress that conflicts with the Card's onPress. Simplest fix — remove the onPress from the inner Button and let the Card handle navigation. The button remains a visual CTA.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/trainings/index.tsx
git commit -m "refactor(screens): migrate trainings list to ui primitives"
```

---

### Task 7.2 · Migrate training detail

**Files:**
- Modify: `app/(tabs)/trainings/[id]/index.tsx`

- [ ] **Step 1: Read current file**

Read `app/(tabs)/trainings/[id]/index.tsx`.

- [ ] **Step 2: Rewrite using primitives**

Keep all hooks (`useTrainingDetail`, `useDeleteTraining`, `useStartTraining`, `useRemoveExerciseFromTraining`), `confirmRemoveExercise`, `handleDelete`, `handleStart` unchanged. Migrate the JSX.

Key sections:
- Status badge: replace inline pill with `<Badge variant={...}>` mapping:
  - `draft` → `<Badge variant="muted">Entwurf</Badge>`
  - `in_progress` → `<Badge variant="warning-soft">Läuft</Badge>`
  - `completed` → `<Badge variant="success-soft">Abgeschlossen</Badge>`
- Training title → `<Text variant="title1" weight="bold">`
- Date → `<View className="flex-row items-center gap-2"><Icon name="calendar-outline" color="muted" /><Text variant="body" color="muted">{date}</Text></View>`
- Players section header → `<Text variant="headline">Spieler ({n})</Text>`
- Each player avatar → `<Avatar initials={p.firstname[0]+p.Name[0]} size="md">` inside a horizontal ScrollView
- Exercises header → `<Text variant="headline">Übungen ({n})</Text>`
- Each exercise row: `<Card className="mb-3 flex-row items-center gap-3">` with `<View className="flex-1">` title+minutes and on the right a `<Button variant="ghost" size="sm" leftIcon="close">` that calls `confirmRemoveExercise(...)`. Show the button only when `canEditExercises`.
- "+ Übung hinzufügen" button → `<Button variant="secondary" leftIcon="add" onPress={() => router.push('/trainings/.../add-exercises')}>` but styled with dashed border via className. Keep the existing visual if easier.
- Start button (draft): `<Button size="lg" loading={startTraining.isPending} onPress={handleStart}>Training starten</Button>`
- Continue button (in_progress): `<Button size="lg" variant="primary" onPress={() => router.push(.../execute)}>Fortsetzen</Button>`
- Delete button: `<Button variant="destructive" leftIcon="trash-outline" loading={deleteTraining.isPending} onPress={handleDelete}>Training löschen</Button>`

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/trainings/[id]/index.tsx
git commit -m "refactor(screens): migrate training detail to ui primitives"
```

---

### Task 7.3 · Migrate training execute

**Files:**
- Modify: `app/(tabs)/trainings/[id]/execute.tsx`

- [ ] **Step 1: Read current file**

Read `app/(tabs)/trainings/[id]/execute.tsx`.

- [ ] **Step 2: Rewrite using primitives**

Keep `useTrainingExecution`, `useCompleteTraining`, `useTrainingDetail`, `confirmFinish`, `handleFinishTraining` unchanged.

Key JSX-only transformations:
- Sticky header container: still a `<View>` wrapper because `<Screen>` with SafeArea top handles the safe area. Keep the layout with back-button, title+timer, stop-button.
- Back button: `<Button variant="ghost" size="sm" leftIcon="chevron-back" onPress={() => router.back()} />`. Use empty children.
- Stop button (header right): `<Button variant="destructive" size="sm" leftIcon="stop" onPress={handleFinishTraining} />` with empty children.
- Session timer big number → `<Text variant="title1" weight="bold" color="warning">{formatTime(sessionElapsed)}</Text>`
- Progress text → `<Text variant="caption1" color="success" weight="bold">{completedCount}/{exerciseStates.length} Übungen</Text>`
- Current-exercise card: `<Card variant="elevated" className="mx-5 mt-5 border-primary">`. Accordion arrow → `<Icon name={expanded ? 'chevron-up' : 'chevron-down'} color="muted" />`
- Each exercise row in the list: wrap checkbox + title + timer in a pressable. Checkbox stays custom (simple View w border) but the row uses `<Pressable>` at the lowest level (this is an exception — the custom list semantics don't fit ListItem).

Acceptable: keep the lowest-level `<Pressable>` for row activation since it has complex internal children (checkbox + title + pause-resume button). Wrap the row in an Animated.View for the spring feel.

- "+ Übung hinzufügen" button → same `<Button variant="secondary" leftIcon="add">` treatment as in Task 7.2.
- Bottom "Training beenden" button → `<Button variant="destructive" size="lg" loading={completeTraining.isPending} onPress={handleFinishTraining}>Training beenden</Button>` pinned via the existing absolute positioning.

All emojis (⏱ ⏸ ▶ ✓) → respective Ionicons (`time-outline`, `pause`, `play`, `checkmark`).

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/trainings/[id]/execute.tsx
git commit -m "refactor(screens): migrate training execute to ui primitives"
```

---

## Phase 8 · Training Forms → Bottom-Sheets

Goal: convert the two modal routes (`create`, `add-exercises`) into bottom-sheets invoked from their parent screens. The modal routes are removed; the screens invoke a BottomSheet directly.

### Task 8.1 · Convert create-training to bottom-sheet

**Files:**
- Create: `components/sheets/CreateTrainingSheet.tsx`
- Modify: `app/(tabs)/trainings/index.tsx`
- Delete: `app/(tabs)/trainings/create.tsx`
- Modify: `app/(tabs)/trainings/_layout.tsx`
- Modify: `lib/queries/useTrainings.ts` (remove the `router.push` on create success)

- [ ] **Step 1: Read current create.tsx**

Read `app/(tabs)/trainings/create.tsx` to extract the form logic.

- [ ] **Step 2: Create components/sheets/CreateTrainingSheet.tsx**

```tsx
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, TextInput } from 'react-native';
import { BottomSheet, BottomSheetRef, Button, Text } from '@/components/ui';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { PlayerSelector } from '@/components/PlayerSelector';
import { useCreateTraining } from '@/lib/queries/useTrainings';
import { toast } from '@/components/ui';

export interface CreateTrainingSheetRef {
  present: () => void;
}

export const CreateTrainingSheet = forwardRef<CreateTrainingSheetRef>(
  function CreateTrainingSheet(_, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [exerciseIds, setExerciseIds] = useState<string[]>([]);
    const [playerIds, setPlayerIds] = useState<string[]>([]);
    const createTraining = useCreateTraining();

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    const reset = () => {
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      setExerciseIds([]);
      setPlayerIds([]);
    };

    const handleCreate = () => {
      createTraining.mutate(
        { name, date, exerciseIds, playerIds },
        {
          onSuccess: () => {
            toast.success('Training erstellt');
            sheetRef.current?.dismiss();
            reset();
          },
          onError: () => toast.error('Training konnte nicht erstellt werden'),
        }
      );
    };

    const canCreate = name.trim() && exerciseIds.length > 0 && playerIds.length > 0;

    return (
      <BottomSheet ref={sheetRef} snapPoints={['90%']} title="Training erstellen">
        <View className="flex-1">
          <View className="mb-4">
            <Text variant="subhead" weight="semibold" className="mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="z.B. Jugendtraining"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-4">
            <Text variant="subhead" weight="semibold" className="mb-2">Datum</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="mb-4">
            <Text variant="subhead" weight="semibold" className="mb-2">
              Übungen ({exerciseIds.length})
            </Text>
            <ExerciseSelector
              selectedIds={exerciseIds}
              onSelectionChange={setExerciseIds}
            />
          </View>

          <View className="mb-6">
            <Text variant="subhead" weight="semibold" className="mb-2">
              Spieler ({playerIds.length})
            </Text>
            <PlayerSelector
              selectedIds={playerIds}
              onSelectionChange={setPlayerIds}
            />
          </View>

          <Button
            size="lg"
            loading={createTraining.isPending}
            disabled={!canCreate}
            onPress={handleCreate}
          >
            Training erstellen
          </Button>
        </View>
      </BottomSheet>
    );
  }
);
```

- [ ] **Step 3: Update useCreateTraining to not navigate**

Modify `lib/queries/useTrainings.ts`. In `useCreateTraining`, replace the `onSuccess` to only invalidate queries — remove `router.push(...)`:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['trainings'] });
},
```

- [ ] **Step 4: Wire the sheet into trainings list**

Modify `app/(tabs)/trainings/index.tsx`: import the sheet, create a ref, and present it from the "Neues Training erstellen" button.

```tsx
import { useRef } from 'react';
import { CreateTrainingSheet, CreateTrainingSheetRef } from '@/components/sheets/CreateTrainingSheet';

// inside the component:
const createSheetRef = useRef<CreateTrainingSheetRef>(null);

// button handler:
<Button leftIcon="add" onPress={() => createSheetRef.current?.present()}>
  Neues Training erstellen
</Button>

// at the end of the Screen:
<CreateTrainingSheet ref={createSheetRef} />
```

- [ ] **Step 5: Delete the modal route**

```bash
git rm app/(tabs)/trainings/create.tsx
```

And modify `app/(tabs)/trainings/_layout.tsx` — remove the `<Stack.Screen name="create" ... />` entry.

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/sheets/CreateTrainingSheet.tsx \
        app/(tabs)/trainings/index.tsx \
        app/(tabs)/trainings/_layout.tsx \
        lib/queries/useTrainings.ts
git commit -m "refactor(screens): convert create-training modal to bottom-sheet"
```

---

### Task 8.2 · Convert add-exercises to bottom-sheet

**Files:**
- Create: `components/sheets/AddExercisesSheet.tsx`
- Modify: `app/(tabs)/trainings/[id]/index.tsx`
- Modify: `app/(tabs)/trainings/[id]/execute.tsx`
- Delete: `app/(tabs)/trainings/[id]/add-exercises.tsx`
- Modify: `app/(tabs)/trainings/_layout.tsx`

- [ ] **Step 1: Read current add-exercises.tsx**

Read `app/(tabs)/trainings/[id]/add-exercises.tsx`.

- [ ] **Step 2: Create components/sheets/AddExercisesSheet.tsx**

```tsx
import { forwardRef, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { View, TextInput, FlatList } from 'react-native';
import {
  BottomSheet,
  BottomSheetRef,
  Button,
  Text,
  Card,
  toast,
} from '@/components/ui';
import {
  useTrainingDetail,
  useAddExerciseToTraining,
} from '@/lib/queries/useTrainings';
import { useExercises } from '@/lib/queries/useExercises';

export interface AddExercisesSheetRef {
  present: () => void;
}

interface Props {
  trainingId: string;
}

export const AddExercisesSheet = forwardRef<AddExercisesSheetRef, Props>(
  function AddExercisesSheet({ trainingId }, ref) {
    const sheetRef = useRef<BottomSheetRef>(null);
    const [search, setSearch] = useState('');
    const { data: training } = useTrainingDetail(trainingId);
    const { data: allExercises } = useExercises(search);
    const addExercise = useAddExerciseToTraining();

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
    }));

    const alreadyAddedIds = useMemo(
      () => new Set(training?.exercises?.map((e) => e.documentId) ?? []),
      [training]
    );

    const available = useMemo(
      () => (allExercises ?? []).filter((e: any) => !alreadyAddedIds.has(e.documentId)),
      [allExercises, alreadyAddedIds]
    );

    const handleAdd = async (exerciseId: string) => {
      try {
        await addExercise.mutateAsync({ trainingId, exerciseId });
        toast.success('Übung hinzugefügt');
      } catch {
        toast.error('Übung konnte nicht hinzugefügt werden');
      }
    };

    return (
      <BottomSheet ref={sheetRef} snapPoints={['90%']} title="Übungen hinzufügen">
        <View className="flex-1">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Suchen..."
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          />
          <FlatList
            data={available}
            keyExtractor={(item: any) => item.documentId}
            contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
            ListEmptyComponent={
              <Text variant="footnote" color="muted" className="text-center py-8">
                {search
                  ? 'Keine Übungen gefunden'
                  : 'Alle Übungen sind bereits im Training'}
              </Text>
            }
            renderItem={({ item }: { item: any }) => (
              <Card className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text variant="subhead" weight="semibold" numberOfLines={1}>
                    {item.Name}
                  </Text>
                  <Text variant="caption1" color="muted">
                    {item.Minutes} Min
                    {item.Difficulty ? ` • ${item.Difficulty}` : ''}
                  </Text>
                </View>
                <Button
                  variant="primary"
                  size="sm"
                  loading={addExercise.isPending}
                  onPress={() => handleAdd(item.documentId)}
                >
                  Hinzufügen
                </Button>
              </Card>
            )}
          />
        </View>
      </BottomSheet>
    );
  }
);
```

- [ ] **Step 3: Wire sheet into training detail**

Modify `app/(tabs)/trainings/[id]/index.tsx`:

```tsx
import { useRef } from 'react';
import { AddExercisesSheet, AddExercisesSheetRef } from '@/components/sheets/AddExercisesSheet';

// inside the component:
const addSheetRef = useRef<AddExercisesSheetRef>(null);

// Replace the Pressable that did router.push to add-exercises with:
<Button
  variant="secondary"
  leftIcon="add"
  onPress={() => addSheetRef.current?.present()}
>
  Übung hinzufügen
</Button>

// at the end of the Screen:
<AddExercisesSheet ref={addSheetRef} trainingId={id} />
```

- [ ] **Step 4: Wire sheet into training execute**

Same pattern in `app/(tabs)/trainings/[id]/execute.tsx`. Replace the router.push to add-exercises with `addSheetRef.current?.present()` and mount `<AddExercisesSheet ref={addSheetRef} trainingId={id} />` at the end of the render.

- [ ] **Step 5: Delete the modal route**

```bash
git rm app/(tabs)/trainings/[id]/add-exercises.tsx
```

And modify `app/(tabs)/trainings/_layout.tsx` — remove the `<Stack.Screen name="[id]/add-exercises" ... />` entry.

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/sheets/AddExercisesSheet.tsx \
        app/(tabs)/trainings/[id]/index.tsx \
        app/(tabs)/trainings/[id]/execute.tsx \
        app/(tabs)/trainings/_layout.tsx
git commit -m "refactor(screens): convert add-exercises modal to bottom-sheet"
```

---

## Phase 9 · Emoji + Alert Cleanup

Goal: sweep the codebase for remaining emojis (outside of icon wrapper) and route non-destructive alerts through Toast.

### Task 9.1 · Emoji + Alert sweep

**Files:**
- Audit and modify: `app/**/*.tsx`, `components/**/*.tsx`

- [ ] **Step 1: Find remaining emojis in UI code**

Run:
```bash
grep -rnP "[\x{1F300}-\x{1FAFF}]|[\x{2600}-\x{27BF}]" app components --include="*.tsx" --include="*.ts" || echo "no matches"
```

Expected: any remaining emoji occurrences in JSX (ignore string-inside-code-comments if they exist).

- [ ] **Step 2: Replace each with Ionicons**

For every match, replace the emoji with an `<Icon name="..." />` component. Reference map:

| Emoji | Ionicons name |
|---|---|
| 📅 | calendar-outline |
| 👥 | people-outline |
| 🏓 | tennisball-outline |
| 👤 | person-outline |
| ✓ / ✅ | checkmark |
| ✗ / × | close |
| ⏱ / ⏰ | time-outline |
| ⏸ | pause |
| ▶ | play |
| 🔒 | lock-closed-outline |
| 📍 | location-outline |
| 💡 | bulb-outline |
| 📋 | list-outline |
| + | add |
| ⌄ | chevron-down |
| ⌃ | chevron-up |

- [ ] **Step 3: Find remaining Alert.alert usages**

Run:
```bash
grep -rn "Alert.alert" app components --include="*.tsx"
```

Keep any Alert.alert that represents a destructive confirmation (training delete, exercise remove). Those should stay because they pair with `window.confirm` fallback on web.

For any other Alert.alert (non-destructive feedback), replace with `toast.success(...)` or `toast.error(...)` from `@/components/ui`.

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify no UI-level emojis remain**

Run the grep from Step 1 again. Expected: "no matches" or only matches in non-UI files like docs.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(ui): replace remaining emojis with icons and non-destructive alerts with toasts"
```

---

## Phase 10 · Polish Pass

Goal: final consistency audit across all 9 screens.

### Task 10.1 · Screen-by-screen polish audit

**Files:**
- Audit: all screens under `app/`

- [ ] **Step 1: Cold-boot the app on web**

Run: `npx expo start --clear --web`

Open the login screen.

- [ ] **Step 2: Walk through every flow**

Do these in order and note any visual inconsistency:
1. Register new account → redirect to tabs
2. Logout, then login → tabs
3. Tab bar icons visible, active color is primary violet
4. Home tab: greeting + placeholder card
5. Library tab: list + search → card layout consistent, no emojis
6. Tap an exercise → detail screen, Steps as cards, hint card if present
7. Trainings tab: list with filter chips, upcoming / completed
8. Tap "Neues Training erstellen" → bottom-sheet opens, form renders
9. Cancel the sheet (swipe down), no crash
10. Tap an existing training → detail
11. In detail, tap "+ Übung hinzufügen" → bottom-sheet
12. Close, tap "Training starten" → execute screen
13. Activate an exercise, complete it, use "+ Übung hinzufügen" mid-training
14. Tap "Training beenden" → confirm, expect toast success + redirect to list
15. Tap a draft training → "Training löschen" → confirm → redirect to list

Note any: inconsistent spacing, wrong text variant, wrong color token, missing haptic, broken layout.

- [ ] **Step 3: Apply fixes**

Create a single commit with cleanups. Typical fixes:
- Harmonize title margin-top (`mt-2`) across screens
- Fix a Badge color that looks off
- Replace a leftover ghost `<View className>` with `<Card>` where appropriate
- Ensure no `<Text>` uses raw Tailwind text classes (`text-lg`, `text-sm`) anywhere — must go through variant

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify on Expo Go**

Run: `npx expo start --clear`

Scan QR, verify the app boots and the first two screens look correct. Check haptic feedback on a button press.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "polish(ui): final consistency pass across all screens"
```

---

## Acceptance Verification (End of Plan)

Before pushing the PR, run the full acceptance suite:

- [ ] `npx tsc --noEmit` — zero errors.
- [ ] `grep -rnP "[\x{1F300}-\x{1FAFF}]|[\x{2600}-\x{27BF}]" app components --include="*.tsx"` — no matches in UI code.
- [ ] `grep -rn "import.*Text.*from 'react-native'" app` — no direct Text imports from react-native in screens.
- [ ] `grep -rn "Alert.alert" app` — only in destructive confirm handlers (delete/remove).
- [ ] Cold-boot on web: all flows work end-to-end.
- [ ] Cold-boot on Expo Go iOS: boots, haptics fire, bottom-sheets open.

When all green, push the branch and open the PR:

```bash
git push -u origin feature/design-system-foundation
gh pr create --title "feat(ui): design system foundation (C1)" \
  --body-file docs/superpowers/specs/2026-04-21-design-system-foundation-c1-design.md
```

---

## Out of Scope (goes to C2, separate plan)

- Spring animations on stack navigation transitions
- Layout animations when lists grow/shrink
- Skeleton loaders replacing spinners
- Swipe-to-delete on training cards
- Header blur effect on scroll
- Pull-to-refresh across lists
- Skia-based visual highlights
- iPad-responsive multi-column layouts
- Dark/light mode auto-switching
- Multiple brand-accent theme presets
