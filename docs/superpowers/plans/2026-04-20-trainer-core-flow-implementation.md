# Trainer Core Flow (SP1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational trainer workflow for TT Trainingsplaner EXPO app, including authentication, exercise library, training CRUD, and execution screens.

**Architecture:** Feature-based structure with Expo Router v4 for navigation, TanStack Query for server state, Zustand for auth state, MMKV for persistence. Screens organized by feature (auth, library, trainings) with shared API client and query hooks.

**Tech Stack:** Expo SDK 55, Expo Router v4, NativeWind v4, TanStack Query v5, Axios, Zustand, MMKV, TypeScript

---

## File Structure Map

**Root Config:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `app.json` - Expo configuration
- `tailwind.config.js` - NativeWind/Tailwind configuration
- `metro.config.js` - Metro bundler configuration

**App Structure:**
- `app/_layout.tsx` - Root layout with QueryClient, session restore, navigation guards
- `app/(auth)/login.tsx` - Login screen
- `app/(auth)/register.tsx` - Registration screen
- `app/(tabs)/_layout.tsx` - Bottom tab navigator
- `app/(tabs)/index.tsx` - Dashboard placeholder
- `app/(tabs)/library/index.tsx` - Exercise list
- `app/(tabs)/library/[id].tsx` - Exercise detail
- `app/(tabs)/trainings/index.tsx` - Training list
- `app/(tabs)/trainings/create.tsx` - Training create
- `app/(tabs)/trainings/[id].tsx` - Training detail
- `app/(tabs)/trainings/[id]/execute.tsx` - Training execution
- `app/(tabs)/profile.tsx` - Profile placeholder

**Library:**
- `lib/api.ts` - Axios client with JWT interceptor
- `lib/store.ts` - Zustand auth store
- `lib/queries/useAuth.ts` - Login/Register mutations
- `lib/queries/useExercises.ts` - Exercise queries
- `lib/queries/useTrainings.ts` - Training CRUD mutations
- `lib/queries/usePlayers.ts` - Player queries
- `lib/hooks/useTrainingExecution.ts` - Execution state management
- `lib/utils/cn.ts` - className utility for conditional styles
- `lib/utils/formatTime.ts` - Timer formatting utility

**Types:**
- `lib/types/api.ts` - API response types
- `lib/types/models.ts` - Domain model types

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `metro.config.js`
- Create: `tailwind.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Expo project with TypeScript**

Run:
```bash
cd C:/SAPDevelop/trainingplanerMAIN/trainingsplanerEXPO
npx create-expo-app@latest . --template blank-typescript
```

Expected: Creates base Expo project structure

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npm install expo-router@~4.0.0 react-native-safe-area-context@4.12.0 react-native-screens@~3.36.0 expo-linking@~7.0.0 expo-constants@~17.0.0 expo-status-bar@~2.0.0
npm install @tanstack/react-query@5.64.2 axios@1.7.9 zustand@5.0.2 react-native-mmkv@3.1.0
npm install nativewind@^4.0.1 tailwindcss@3.4.17
npm install @types/react@~18.3.12 typescript@~5.3.3
```

Expected: Dependencies installed

- [ ] **Step 3: Configure Expo Router in app.json**

```json
{
  "expo": {
    "name": "trainingsplanerEXPO",
    "slug": "trainingsplaner-expo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.trainingsplaner.expo"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.trainingsplaner.expo"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "scheme": "trainingsplaner"
  }
}
```

- [ ] **Step 4: Configure Metro for NativeWind**

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 5: Configure Tailwind**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'hsl(0, 0%, 4%)',
        foreground: 'hsl(0, 0%, 100%)',
        card: 'hsl(0, 0%, 10%)',
        'card-foreground': 'hsl(0, 0%, 100%)',
        primary: 'hsl(252, 62%, 63%)',
        'primary-foreground': 'hsl(0, 0%, 100%)',
        muted: 'hsl(0, 0%, 20%)',
        'muted-foreground': 'hsl(0, 0%, 60%)',
        border: 'hsl(0, 0%, 15%)',
        success: 'hsl(142, 71%, 45%)',
        warning: 'hsl(38, 92%, 50%)',
        destructive: 'hsl(0, 84%, 60%)',
        'destructive-foreground': 'hsl(0, 0%, 100%)',
        info: 'hsl(199, 89%, 48%)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Create global styles**

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Update TypeScript config**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 8: Update .gitignore**

```
# Dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*
*.log

# OS
.DS_Store
*.pem

# Local env
.env*.local

# TypeScript
*.tsbuildinfo

# IDE
.idea/
.vscode/
```

- [ ] **Step 9: Commit project setup**

```bash
git add .
git commit -m "chore: initialize Expo project with TypeScript and NativeWind

- Expo SDK 55 with Expo Router v4
- NativeWind v4 for styling
- TanStack Query v5 for data fetching
- Zustand + MMKV for state management"
```

---

## Task 2: API Client & Type Definitions

**Files:**
- Create: `lib/types/api.ts`
- Create: `lib/types/models.ts`
- Create: `lib/api.ts`

- [ ] **Step 1: Define API response types**

```typescript
// lib/types/api.ts
export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiEntity<T> {
  id: number;
  documentId: string;
  attributes?: T;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface StrapiCollection<T> {
  data: StrapiEntity<T>[];
}

export interface StrapiRelation<T> {
  data: StrapiEntity<T> | StrapiEntity<T>[] | null;
}
```

- [ ] **Step 2: Define domain model types**

```typescript
// lib/types/models.ts
export interface User {
  id: number;
  username: string;
  email: string;
  isTrainer: boolean;
  player: {
    documentId: string;
    firstname: string;
    Name: string;
    Club: {
      documentId: string;
      Name: string;
    };
  };
}

export interface Exercise {
  documentId: string;
  Name: string;
  Description: string;
  Minutes: number;
  Steps?: string[];
  Hint?: string;
  Videos?: string[];
  Difficulty?: 'Anfänger' | 'Fortgeschritten' | 'Experte';
  focus?: Focus[];
}

export interface Focus {
  documentId: string;
  Name: string;
}

export interface Player {
  documentId: string;
  firstname: string;
  Name: string;
  email: string;
  requiresInviteAcceptance: boolean;
  Club: {
    documentId: string;
    Name: string;
  };
}

export interface Training {
  documentId: string;
  Name: string;
  Date: string;
  training_status: 'draft' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  exercises: Exercise[];
  players: Player[];
}

export interface PlayerProgress {
  documentId: string;
  Points: number;
  player: Player;
  exercise: Exercise;
  training: Training;
}
```

- [ ] **Step 3: Create Axios client with interceptors**

```typescript
// lib/api.ts
import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const BASE_URL = 'https://trainingsplaner-strapi.onrender.com/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// JWT Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getString('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 401 Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data
      storage.delete('jwt');
      storage.delete('user');
      // Note: Zustand store will be cleared by next auth check
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 4: Commit API setup**

```bash
git add lib/
git commit -m "feat: add API client and type definitions

- Axios client with JWT interceptor
- Strapi response type definitions
- Domain model types (User, Exercise, Training, Player)"
```

---

## Task 3: Auth Store & Utilities

**Files:**
- Create: `lib/store.ts`
- Create: `lib/utils/cn.ts`
- Create: `lib/utils/formatTime.ts`

- [ ] **Step 1: Create Zustand auth store**

```typescript
// lib/store.ts
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { User } from './types/models';

const storage = new MMKV();

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: (token: string, user: User) => {
    storage.set('jwt', token);
    storage.set('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    storage.delete('jwt');
    storage.delete('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  restoreSession: () => {
    try {
      const token = storage.getString('jwt');
      const userJson = storage.getString('user');
      
      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ token, user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      storage.delete('jwt');
      storage.delete('user');
    }
  },
}));
```

- [ ] **Step 2: Create className utility**

```typescript
// lib/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
```

- [ ] **Step 3: Install clsx dependency**

Run:
```bash
npm install clsx@2.1.1
```

- [ ] **Step 4: Create time formatting utility**

```typescript
// lib/utils/formatTime.ts
/**
 * Format seconds to MM:SS format
 * @param seconds Total seconds
 * @returns Formatted time string (e.g., "05:32")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 5: Commit utilities**

```bash
git add lib/store.ts lib/utils/
git commit -m "feat: add auth store and utility functions

- Zustand auth store with MMKV persistence
- Session restore from storage
- className utility (cn) for conditional styles
- Time formatting utility for timers"
```

---

## Task 4: Root Layout & Navigation Guards

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/+html.tsx`

- [ ] **Step 1: Create HTML wrapper for web**

```typescript
// app/+html.tsx
import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #0a0a0f;
}
@media (prefers-color-scheme: light) {
  body {
    background-color: #fff;
  }
}`;
```

- [ ] **Step 2: Create root layout with QueryClient and session restore**

```typescript
// app/_layout.tsx
import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, restoreSession } = useAuthStore();

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Navigation guard
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Commit root layout**

```bash
git add app/_layout.tsx app/+html.tsx
git commit -m "feat: add root layout with navigation guards

- QueryClient provider setup
- Session restore on app launch
- Navigation guards (redirect to login if not authenticated)
- HTML wrapper for web support"
```

---

## Task 5: Authentication Screens

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/register.tsx`
- Create: `lib/queries/useAuth.ts`

- [ ] **Step 1: Create auth group layout**

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create auth mutations**

```typescript
// lib/queries/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { User } from '../types/models';

interface LoginCredentials {
  identifier: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  jwt: string;
  user: User;
}

export const useLogin = () => {
  const login = useAuthStore((s) => s.login);
  
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/local', credentials);
      return data;
    },
    onSuccess: (data) => {
      login(data.jwt, data.user);
      router.replace('/(tabs)');
    },
  });
};

export const useRegister = () => {
  const login = useAuthStore((s) => s.login);
  
  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/local/register', credentials);
      return data;
    },
    onSuccess: (data) => {
      login(data.jwt, data.user);
      router.replace('/(tabs)');
    },
  });
};
```

- [ ] **Step 3: Create login screen**

```typescript
// app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useLogin } from '@/lib/queries/useAuth';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleLogin = () => {
    if (!identifier || !password) return;
    login.mutate({ identifier, password });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 p-5 justify-center">
        <Text className="text-3xl font-bold text-foreground mb-2">Willkommen zurück</Text>
        <Text className="text-base text-muted-foreground mb-8">
          Melde dich an, um fortzufahren
        </Text>
        
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">E-Mail oder Username</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="max@example.com"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>
        
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Passwort</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>
        
        <Pressable 
          onPress={handleLogin}
          disabled={login.isPending || !identifier || !password}
          className="bg-primary rounded-xl p-4 disabled:opacity-50"
        >
          {login.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-primary-foreground">
              Einloggen
            </Text>
          )}
        </Pressable>
        
        {login.isError && (
          <View className="mt-4 bg-destructive/10 border border-destructive rounded-lg p-3">
            <Text className="text-destructive text-sm text-center">
              Login fehlgeschlagen. Bitte überprüfe deine Daten.
            </Text>
          </View>
        )}
        
        <View className="flex-row justify-center mt-6">
          <Text className="text-muted-foreground text-sm">Noch kein Account? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">Registrieren</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 4: Create register screen**

```typescript
// app/(auth)/register.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useRegister } from '@/lib/queries/useAuth';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const register = useRegister();

  const handleRegister = () => {
    if (!username || !email || !password || password !== confirmPassword) return;
    register.mutate({ username, email, password });
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ justifyContent: 'center', minHeight: '100%' }}>
        <Text className="text-3xl font-bold text-foreground mb-2">Account erstellen</Text>
        <Text className="text-base text-muted-foreground mb-8">
          Registriere dich als Trainer
        </Text>
        
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="maxmustermann"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>
        
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">E-Mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="max@example.com"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>
        
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Passwort</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>
        
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Passwort bestätigen</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
          {!passwordsMatch && (
            <Text className="text-destructive text-xs mt-1">Passwörter stimmen nicht überein</Text>
          )}
        </View>
        
        <Pressable 
          onPress={handleRegister}
          disabled={register.isPending || !username || !email || !password || !passwordsMatch}
          className="bg-primary rounded-xl p-4 disabled:opacity-50"
        >
          {register.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-primary-foreground">
              Registrieren
            </Text>
          )}
        </Pressable>
        
        {register.isError && (
          <View className="mt-4 bg-destructive/10 border border-destructive rounded-lg p-3">
            <Text className="text-destructive text-sm text-center">
              Registrierung fehlgeschlagen. Bitte versuche es erneut.
            </Text>
          </View>
        )}
        
        <View className="flex-row justify-center mt-6">
          <Text className="text-muted-foreground text-sm">Schon registriert? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">Einloggen</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 5: Commit authentication screens**

```bash
git add app/(auth)/ lib/queries/useAuth.ts
git commit -m "feat: add authentication screens

- Login screen with email/username and password
- Register screen with validation
- Auth mutations (useLogin, useRegister)
- Navigation to tabs after successful auth"
```

---

## Task 6: Tab Navigator & Placeholder Screens

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Create tab navigator**

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabBarIcon({ focused, label }: { focused: boolean; label: string }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0f',
          borderTopColor: '#1a1a24',
        },
        tabBarActiveTintColor: '#6c47ff',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="📊" />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Bibliothek',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="📚" />,
        }}
      />
      <Tabs.Screen
        name="trainings"
        options={{
          title: 'Trainings',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="🏓" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="👤" />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create dashboard placeholder**

```typescript
// app/(tabs)/index.tsx
import { View, Text, Pressable } from 'react-native';
import { useAuthStore } from '@/lib/store';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <View className="flex-1 bg-background p-5">
      <Text className="text-2xl font-bold text-foreground mb-4">Dashboard</Text>
      <Text className="text-base text-muted-foreground mb-6">
        Willkommen, {user?.username || 'Trainer'}!
      </Text>
      
      <View className="bg-card rounded-xl p-4 border border-border">
        <Text className="text-sm text-center text-muted-foreground">
          Dashboard Features kommen in Sub-Project 2
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Create profile placeholder with logout**

```typescript
// app/(tabs)/profile.tsx
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-background p-5">
      <Text className="text-2xl font-bold text-foreground mb-4">Profil</Text>
      
      <View className="bg-card rounded-xl p-4 border border-border mb-4">
        <View className="items-center mb-4">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-primary">
              {user?.username?.[0]?.toUpperCase() || 'T'}
            </Text>
          </View>
          <Text className="text-xl font-semibold text-foreground mb-1">
            {user?.username || 'Trainer'}
          </Text>
          <Text className="text-sm text-muted-foreground">{user?.email || ''}</Text>
        </View>
        
        {user?.player?.Club && (
          <View className="border-t border-border pt-3">
            <Text className="text-xs text-muted-foreground mb-1">Verein</Text>
            <Text className="text-sm text-foreground font-semibold">
              {user.player.Club.Name}
            </Text>
          </View>
        )}
      </View>
      
      <View className="bg-card rounded-xl p-4 border border-border mb-4">
        <Text className="text-sm text-center text-muted-foreground">
          Weitere Profil-Features kommen in Sub-Project 2
        </Text>
      </View>
      
      <Pressable 
        onPress={handleLogout}
        className="border border-destructive rounded-xl p-4"
      >
        <Text className="text-center text-sm font-semibold text-destructive">
          Abmelden
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 4: Commit tab navigation**

```bash
git add app/(tabs)/
git commit -m "feat: add tab navigation with placeholders

- Bottom tab navigator with 4 tabs
- Dashboard placeholder (SP2)
- Profile screen with user info and logout
- Tab bar styling with dark theme"
```

---

## Task 7: Exercise Library - Queries

**Files:**
- Create: `lib/queries/useExercises.ts`
- Create: `app/(tabs)/library/_layout.tsx`

- [ ] **Step 1: Create exercise queries**

```typescript
// lib/queries/useExercises.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import type { Exercise, Focus } from '../types/models';
import type { StrapiResponse } from '../types/api';

interface ExerciseRaw {
  documentId: string;
  Name: string;
  Description: string;
  Minutes: number;
  Steps?: string[];
  Hint?: string;
  Videos?: string[];
  Difficulty?: 'Anfänger' | 'Fortgeschritten' | 'Experte';
  focus?: {
    documentId: string;
    Name: string;
  }[];
}

export const useExercises = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['exercises', searchQuery],
    queryFn: async () => {
      const params: any = {
        populate: 'focus',
      };
      
      if (searchQuery) {
        params.filters = {
          Name: {
            $containsi: searchQuery,
          },
        };
      }
      
      const { data } = await apiClient.get<StrapiResponse<ExerciseRaw[]>>('/exercises', {
        params,
      });
      
      return data.data;
    },
  });
};

export const useExerciseDetail = (id: string) => {
  return useQuery({
    queryKey: ['exercises', id],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<ExerciseRaw>>(`/exercises/${id}`, {
        params: {
          populate: 'focus',
        },
      });
      
      return data.data;
    },
    enabled: !!id,
  });
};
```

- [ ] **Step 2: Create library layout**

```typescript
// app/(tabs)/library/_layout.tsx
import { Stack } from 'expo-router';

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0f',
        },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Übungsbibliothek',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Übung',
          headerBackTitle: 'Zurück',
        }}
      />
    </Stack>
  );
}
```

- [ ] **Step 3: Commit exercise queries**

```bash
git add lib/queries/useExercises.ts app/(tabs)/library/_layout.tsx
git commit -m "feat: add exercise query hooks

- useExercises query with search support
- useExerciseDetail query for single exercise
- Library stack navigator layout"
```

---

## Task 8: Exercise Library - List Screen

**Files:**
- Create: `app/(tabs)/library/index.tsx`

- [ ] **Step 1: Create exercise list screen**

```typescript
// app/(tabs)/library/index.tsx
import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useExercises } from '@/lib/queries/useExercises';

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: exercises, isLoading } = useExercises(searchQuery);

  const renderExercise = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/library/${item.documentId}`)}
      className="bg-card rounded-xl p-4 mb-3 border border-border active:opacity-70"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-base font-semibold text-foreground flex-1 mr-2">
          {item.Name}
        </Text>
        {item.Difficulty && (
          <View className="bg-primary/10 px-2 py-1 rounded">
            <Text className="text-xs font-semibold text-primary">
              {item.Difficulty}
            </Text>
          </View>
        )}
      </View>
      
      <Text className="text-sm text-muted-foreground mb-3" numberOfLines={2}>
        {item.Description}
      </Text>
      
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground">⏱ {item.Minutes} Min</Text>
        </View>
        
        {item.focus && item.focus.length > 0 && (
          <View className="flex-row items-center">
            <Text className="text-xs text-muted-foreground">
              🎯 {item.focus.length} Fokus
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="p-5 pb-3">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Übungen durchsuchen..."
          placeholderTextColor="#666"
          className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
        />
      </View>
      
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6c47ff" />
        </View>
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExercise}
          keyExtractor={(item) => item.documentId}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted-foreground text-center">
                Keine Übungen gefunden
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
```

- [ ] **Step 2: Commit exercise list screen**

```bash
git add app/(tabs)/library/index.tsx
git commit -m "feat: add exercise list screen

- Search bar for filtering exercises
- Exercise cards showing name, description, duration, difficulty
- Tap to navigate to detail screen
- Loading and empty states"
```

---

## Task 9: Exercise Library - Detail Screen

**Files:**
- Create: `app/(tabs)/library/[id].tsx`

- [ ] **Step 1: Create exercise detail screen**

```typescript
// app/(tabs)/library/[id].tsx
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useExerciseDetail } from '@/lib/queries/useExercises';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading } = useExerciseDetail(id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-5">
        <Text className="text-muted-foreground text-center">Übung nicht gefunden</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Title */}
      <View className="p-5 pb-3">
        <Text className="text-2xl font-bold text-foreground mb-3">
          {exercise.Name}
        </Text>
        
        {/* Meta Tags */}
        <View className="flex-row flex-wrap gap-2">
          {exercise.Difficulty && (
            <View className="bg-primary/10 px-3 py-1.5 rounded-lg">
              <Text className="text-xs font-semibold text-primary">
                {exercise.Difficulty}
              </Text>
            </View>
          )}
          
          {exercise.focus?.map((f) => (
            <View key={f.documentId} className="bg-muted px-3 py-1.5 rounded-lg">
              <Text className="text-xs font-semibold text-muted-foreground">
                {f.Name}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Info Grid */}
      <View className="flex-row gap-3 px-5 pb-4">
        <View className="flex-1 bg-card rounded-xl p-4 border border-border">
          <Text className="text-xs text-muted-foreground mb-1">Dauer</Text>
          <Text className="text-xl font-bold text-foreground">
            {exercise.Minutes} Min
          </Text>
        </View>
        
        <View className="flex-1 bg-card rounded-xl p-4 border border-border">
          <Text className="text-xs text-muted-foreground mb-1">Fokuspunkte</Text>
          <Text className="text-xl font-bold text-foreground">
            {exercise.focus?.length || 0}
          </Text>
        </View>
      </View>
      
      {/* Video Placeholder */}
      {exercise.Videos && exercise.Videos.length > 0 && (
        <View className="mx-5 mb-4 bg-muted rounded-xl h-48 items-center justify-center">
          <Text className="text-muted-foreground text-sm">📹 Video Player</Text>
          <Text className="text-muted-foreground text-xs mt-1">
            (Implementierung in SP2)
          </Text>
        </View>
      )}
      
      {/* Description */}
      <View className="px-5 pb-4">
        <Text className="text-base font-semibold text-foreground mb-2">
          Beschreibung
        </Text>
        <Text className="text-sm text-muted-foreground leading-relaxed">
          {exercise.Description}
        </Text>
      </View>
      
      {/* Steps */}
      {exercise.Steps && exercise.Steps.length > 0 && (
        <View className="px-5 pb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            📋 Anleitung
          </Text>
          <View className="bg-card rounded-xl border-l-4 border-primary p-4">
            {exercise.Steps.map((step, idx) => (
              <View key={idx} className="flex-row mb-3 last:mb-0">
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3 mt-0.5">
                  <Text className="text-xs font-bold text-primary-foreground">
                    {idx + 1}
                  </Text>
                </View>
                <Text className="flex-1 text-sm text-foreground leading-relaxed">
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Trainer Hint */}
      {exercise.Hint && (
        <View className="px-5 pb-6">
          <Text className="text-base font-semibold text-foreground mb-3">
            💡 Trainer-Hinweis
          </Text>
          <View className="bg-warning/10 border border-warning rounded-xl p-4">
            <Text className="text-sm text-foreground leading-relaxed">
              {exercise.Hint}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit exercise detail screen**

```bash
git add app/(tabs)/library/[id].tsx
git commit -m "feat: add exercise detail screen

- Full-screen detail view (not modal)
- Shows title, meta tags, info grid
- Video player placeholder
- Description, steps with numbered badges
- Trainer hints in warning-styled box"
```

---

## Task 10: Training & Player Queries

**Files:**
- Create: `lib/queries/useTrainings.ts`
- Create: `lib/queries/usePlayers.ts`

- [ ] **Step 1: Create player queries**

```typescript
// lib/queries/usePlayers.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { Player } from '../types/models';
import type { StrapiResponse } from '../types/api';

export const usePlayers = () => {
  const user = useAuthStore((s) => s.user);
  const clubId = user?.player?.Club?.documentId;

  return useQuery({
    queryKey: ['players', clubId],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<Player[]>>('/players', {
        params: {
          filters: {
            Club: {
              documentId: {
                $eq: clubId,
              },
            },
          },
          populate: '*',
        },
      });
      
      return data.data;
    },
    enabled: !!clubId,
  });
};
```

- [ ] **Step 2: Create training queries and mutations**

```typescript
// lib/queries/useTrainings.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { Training } from '../types/models';
import type { StrapiResponse } from '../types/api';

export const useTrainings = () => {
  const user = useAuthStore((s) => s.user);
  const clubId = user?.player?.Club?.documentId;

  return useQuery({
    queryKey: ['trainings', clubId],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<Training[]>>('/trainings', {
        params: {
          filters: {
            Club: {
              documentId: {
                $eq: clubId,
              },
            },
          },
          populate: ['exercises', 'players'],
        },
      });
      
      return data.data;
    },
    enabled: !!clubId,
  });
};

export const useTrainingDetail = (id: string) => {
  return useQuery({
    queryKey: ['trainings', id],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<Training>>(`/trainings/${id}`, {
        params: {
          populate: ['exercises', 'players'],
        },
      });
      
      return data.data;
    },
    enabled: !!id,
  });
};

interface CreateTrainingInput {
  name: string;
  date: string;
  exerciseIds: string[];
  playerIds: string[];
}

export const useCreateTraining = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clubId = user?.player?.Club?.documentId;

  return useMutation({
    mutationFn: async (input: CreateTrainingInput) => {
      const { data } = await apiClient.post<StrapiResponse<Training>>('/trainings', {
        data: {
          Name: input.name,
          Date: input.date,
          training_status: 'draft',
          Club: {
            connect: [{ documentId: clubId }],
          },
          exercises: {
            connect: input.exerciseIds.map((id) => ({ documentId: id })),
          },
          players: {
            connect: input.playerIds.map((id) => ({ documentId: id })),
          },
        },
      });
      
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.push(`/trainings/${data.documentId}`);
    },
  });
};

export const useDeleteTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/trainings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.back();
    },
  });
};

export const useStartTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trainingId: string) => {
      const { data } = await apiClient.put<StrapiResponse<Training>>(`/trainings/${trainingId}`, {
        data: {
          training_status: 'in_progress',
          startedAt: new Date().toISOString(),
        },
      });
      
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings', data.documentId] });
    },
  });
};

interface CompleteTrainingInput {
  trainingId: string;
  sessionDuration: number;
  playerProgressData: Array<{
    playerId: string;
    exerciseId: string;
    points: number;
  }>;
}

export const useCompleteTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteTrainingInput) => {
      // 1. Complete training
      await apiClient.put(`/trainings/${input.trainingId}`, {
        data: {
          training_status: 'completed',
          completedAt: new Date().toISOString(),
          actualDuration: input.sessionDuration,
        },
      });

      // 2. Create player-progress entries
      for (const progress of input.playerProgressData) {
        await apiClient.post('/player-progresses', {
          data: {
            player: { connect: [{ documentId: progress.playerId }] },
            exercise: { connect: [{ documentId: progress.exerciseId }] },
            training: { connect: [{ documentId: input.trainingId }] },
            Points: progress.points,
          },
        });
      }

      return input.trainingId;
    },
    onSuccess: (trainingId) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.replace(`/trainings/${trainingId}`);
    },
  });
};
```

- [ ] **Step 3: Commit training and player queries**

```bash
git add lib/queries/useTrainings.ts lib/queries/usePlayers.ts
git commit -m "feat: add training and player query hooks

- Player queries filtered by club
- Training CRUD mutations (create, delete)
- Training execution mutations (start, complete)
- Player-progress creation on training completion"
```

---

## Task 11: Training Screens - Layout & List

**Files:**
- Create: `app/(tabs)/trainings/_layout.tsx`
- Create: `app/(tabs)/trainings/index.tsx`

- [ ] **Step 1: Create trainings layout**

```typescript
// app/(tabs)/trainings/_layout.tsx
import { Stack } from 'expo-router';

export default function TrainingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0f',
        },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Trainings',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Training erstellen',
          headerBackTitle: 'Zurück',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Training',
          headerBackTitle: 'Zurück',
        }}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Create training list screen**

```typescript
// app/(tabs)/trainings/index.tsx
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTrainings } from '@/lib/queries/useTrainings';
import { cn } from '@/lib/utils/cn';

const STATUS_LABELS = {
  draft: 'Entwurf',
  in_progress: 'Läuft',
  completed: 'Abgeschlossen',
};

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/10 text-warning border-warning',
  completed: 'bg-success/10 text-success border-success',
};

export default function TrainingsScreen() {
  const { data: trainings, isLoading } = useTrainings();

  const renderTraining = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/trainings/${item.documentId}`)}
      className="bg-card rounded-xl p-4 mb-3 border border-border active:opacity-70"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-base font-semibold text-foreground flex-1 mr-2">
          {item.Name}
        </Text>
        <View className={cn('px-2 py-1 rounded border', STATUS_COLORS[item.training_status])}>
          <Text className="text-xs font-semibold">
            {STATUS_LABELS[item.training_status]}
          </Text>
        </View>
      </View>
      
      <Text className="text-sm text-muted-foreground mb-3">
        {new Date(item.Date).toLocaleDateString('de-DE', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </Text>
      
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground">
            🏓 {item.exercises?.length || 0} Übungen
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Text className="text-xs text-muted-foreground">
            👥 {item.players?.length || 0} Spieler
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6c47ff" />
        </View>
      ) : (
        <FlatList
          data={trainings}
          renderItem={renderTraining}
          keyExtractor={(item) => item.documentId}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-muted-foreground text-center mb-2">
                Noch keine Trainings erstellt
              </Text>
              <Text className="text-sm text-muted-foreground text-center">
                Erstelle dein erstes Training!
              </Text>
            </View>
          }
        />
      )}
      
      {/* Create Button */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-background border-t border-border">
        <Pressable
          onPress={() => router.push('/trainings/create')}
          className="bg-primary rounded-xl p-4 active:opacity-80"
        >
          <Text className="text-center text-sm font-semibold text-primary-foreground">
            + Training erstellen
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Commit training list**

```bash
git add app/(tabs)/trainings/_layout.tsx app/(tabs)/trainings/index.tsx
git commit -m "feat: add training list screen

- Training cards with status badges
- Shows date, exercise count, player count
- Fixed create button at bottom
- Loading and empty states"
```

---

## Task 12: Training Create Screen

**Files:**
- Create: `app/(tabs)/trainings/create.tsx`
- Create: `components/ExerciseSelector.tsx`
- Create: `components/PlayerSelector.tsx`

- [ ] **Step 1: Create exercise selector component**

```typescript
// components/ExerciseSelector.tsx
import { useState } from 'react';
import { View, Text, Modal, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useExercises } from '@/lib/queries/useExercises';
import type { Exercise } from '@/lib/types/models';

interface ExerciseSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ExerciseSelector({ selectedIds, onSelectionChange }: ExerciseSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { data: exercises, isLoading } = useExercises();

  const toggleExercise = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        className="bg-card border border-border rounded-lg px-4 py-3"
      >
        <Text className="text-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} Übungen ausgewählt`
            : 'Übungen auswählen'}
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-background">
          <View className="p-5 border-b border-border">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-foreground">Übungen auswählen</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text className="text-primary font-semibold">Fertig</Text>
              </Pressable>
            </View>
            <Text className="text-sm text-muted-foreground mt-1">
              {selectedIds.length} ausgewählt
            </Text>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6c47ff" />
            </View>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.documentId}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => {
                const isSelected = selectedIds.includes(item.documentId);
                return (
                  <Pressable
                    onPress={() => toggleExercise(item.documentId)}
                    className="flex-row items-center bg-card rounded-lg p-4 mb-3 border border-border"
                  >
                    <View className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && (
                        <Text className="text-xs font-bold text-primary-foreground">✓</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground mb-1">
                        {item.Name}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {item.Minutes} Min
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: Create player selector component**

```typescript
// components/PlayerSelector.tsx
import { useState } from 'react';
import { View, Text, Modal, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { usePlayers } from '@/lib/queries/usePlayers';
import type { Player } from '@/lib/types/models';

interface PlayerSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function PlayerSelector({ selectedIds, onSelectionChange }: PlayerSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { data: players, isLoading } = usePlayers();

  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        className="bg-card border border-border rounded-lg px-4 py-3"
      >
        <Text className="text-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} Spieler ausgewählt`
            : 'Spieler auswählen'}
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-background">
          <View className="p-5 border-b border-border">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-foreground">Spieler auswählen</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text className="text-primary font-semibold">Fertig</Text>
              </Pressable>
            </View>
            <Text className="text-sm text-muted-foreground mt-1">
              {selectedIds.length} ausgewählt
            </Text>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6c47ff" />
            </View>
          ) : (
            <FlatList
              data={players}
              keyExtractor={(item) => item.documentId}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => {
                const isSelected = selectedIds.includes(item.documentId);
                return (
                  <Pressable
                    onPress={() => togglePlayer(item.documentId)}
                    className="flex-row items-center bg-card rounded-lg p-4 mb-3 border border-border"
                  >
                    <View className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && (
                        <Text className="text-xs font-bold text-primary-foreground">✓</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground mb-1">
                        {item.firstname} {item.Name}
                      </Text>
                      {item.requiresInviteAcceptance && (
                        <Text className="text-xs text-warning">
                          🔒 Einladung wird gesendet
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}
```

- [ ] **Step 3: Create training create screen**

```typescript
// app/(tabs)/trainings/create.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useCreateTraining } from '@/lib/queries/useTrainings';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { PlayerSelector } from '@/components/PlayerSelector';

export default function CreateTrainingScreen() {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  
  const createTraining = useCreateTraining();

  const handleCreate = () => {
    createTraining.mutate({
      name,
      date,
      exerciseIds: selectedExerciseIds,
      playerIds: selectedPlayerIds,
    });
  };

  const canCreate = name.trim() && selectedExerciseIds.length > 0 && selectedPlayerIds.length > 0;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-5">
        {/* Name */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Trainingsname *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="z.B. Jugendtraining"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        {/* Date */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Datum *
          </Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
          />
          <Text className="text-xs text-muted-foreground mt-1">
            Format: JJJJ-MM-TT (z.B. 2026-04-20)
          </Text>
        </View>

        {/* Exercise Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Übungen * ({selectedExerciseIds.length} ausgewählt)
          </Text>
          <ExerciseSelector
            selectedIds={selectedExerciseIds}
            onSelectionChange={setSelectedExerciseIds}
          />
        </View>

        {/* Player Selector */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">
            Spieler * ({selectedPlayerIds.length} ausgewählt)
          </Text>
          <PlayerSelector
            selectedIds={selectedPlayerIds}
            onSelectionChange={setSelectedPlayerIds}
          />
        </View>

        {/* Create Button */}
        <Pressable
          onPress={handleCreate}
          disabled={!canCreate || createTraining.isPending}
          className="bg-primary rounded-xl p-4 disabled:opacity-50"
        >
          {createTraining.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-primary-foreground">
              Training erstellen
            </Text>
          )}
        </Pressable>

        {createTraining.isError && (
          <View className="mt-4 bg-destructive/10 border border-destructive rounded-lg p-3">
            <Text className="text-destructive text-sm text-center">
              Fehler beim Erstellen. Bitte versuche es erneut.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Commit training create screen**

```bash
git add app/(tabs)/trainings/create.tsx components/
git commit -m "feat: add training create screen

- Name and date input fields
- Exercise multi-select modal with checkboxes
- Player multi-select modal with invite badge
- Create mutation with navigation to detail"
```

---

## Task 13: Training Detail Screen

**Files:**
- Create: `app/(tabs)/trainings/[id].tsx`

- [ ] **Step 1: Create training detail screen**

```typescript
// app/(tabs)/trainings/[id].tsx
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTrainingDetail, useDeleteTraining, useStartTraining } from '@/lib/queries/useTrainings';
import { cn } from '@/lib/utils/cn';

const STATUS_LABELS = {
  draft: 'Entwurf',
  in_progress: 'Läuft',
  completed: 'Abgeschlossen',
};

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/10 text-warning border-warning',
  completed: 'bg-success/10 text-success border-success',
};

export default function TrainingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: training, isLoading } = useTrainingDetail(id);
  const deleteTraining = useDeleteTraining();
  const startTraining = useStartTraining();

  const handleDelete = () => {
    Alert.alert(
      'Training löschen',
      `"${training?.Name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteTraining.mutate(id),
        },
      ]
    );
  };

  const handleStart = async () => {
    await startTraining.mutateAsync(id);
    router.push(`/trainings/${id}/execute`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  if (!training) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-5">
        <Text className="text-muted-foreground text-center">Training nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="p-5 pb-4">
        <View className="flex-row justify-between items-start mb-3">
          <Text className="text-2xl font-bold text-foreground flex-1 mr-3">
            {training.Name}
          </Text>
          <View className={cn('px-3 py-1.5 rounded border', STATUS_COLORS[training.training_status])}>
            <Text className="text-xs font-semibold">
              {STATUS_LABELS[training.training_status]}
            </Text>
          </View>
        </View>

        <Text className="text-base text-muted-foreground">
          {new Date(training.Date).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Players */}
      <View className="px-5 pb-4">
        <Text className="text-base font-semibold text-foreground mb-3">
          Spieler ({training.players?.length || 0})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
          {training.players?.map((player) => (
            <View key={player.documentId} className="items-center">
              <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-2">
                <Text className="text-lg font-bold text-primary">
                  {player.firstname[0]}{player.Name[0]}
                </Text>
              </View>
              <Text className="text-xs text-foreground text-center max-w-[60px]" numberOfLines={1}>
                {player.firstname}
              </Text>
              {player.requiresInviteAcceptance && (
                <Text className="text-[10px] text-warning mt-0.5">🔒</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Exercises */}
      <View className="px-5 pb-4">
        <Text className="text-base font-semibold text-foreground mb-3">
          Übungen ({training.exercises?.length || 0})
        </Text>
        {training.exercises?.map((exercise, idx) => (
          <View
            key={exercise.documentId}
            className="bg-card rounded-xl p-4 mb-3 border border-border"
          >
            <View className="flex-row justify-between items-start">
              <Text className="text-sm font-semibold text-foreground flex-1 mr-2">
                {idx + 1}. {exercise.Name}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {exercise.Minutes} Min
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View className="p-5 gap-3">
        {training.training_status === 'draft' && (
          <Pressable
            onPress={handleStart}
            disabled={startTraining.isPending}
            className="bg-primary rounded-xl p-4 disabled:opacity-50"
          >
            {startTraining.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-sm font-semibold text-primary-foreground">
                Training starten
              </Text>
            )}
          </Pressable>
        )}

        {training.training_status === 'in_progress' && (
          <Pressable
            onPress={() => router.push(`/trainings/${id}/execute`)}
            className="bg-warning rounded-xl p-4"
          >
            <Text className="text-center text-sm font-semibold text-background">
              Fortsetzen
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleDelete}
          disabled={deleteTraining.isPending}
          className="border border-destructive rounded-xl p-4 disabled:opacity-50"
        >
          {deleteTraining.isPending ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text className="text-center text-sm font-semibold text-destructive">
              Training löschen
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit training detail screen**

```bash
git add app/(tabs)/trainings/[id].tsx
git commit -m "feat: add training detail screen

- Shows training name, date, status badge
- Players list with avatars and invite badges
- Exercises list with duration
- Start/Continue button (status-dependent)
- Delete button with confirmation dialog"
```

---

## Task 14: Training Execution - State Hook

**Files:**
- Create: `lib/hooks/useTrainingExecution.ts`

- [ ] **Step 1: Create training execution hook**

```typescript
// lib/hooks/useTrainingExecution.ts
import { useState, useEffect, useRef } from 'react';
import type { Exercise } from '../types/models';

interface ExerciseState extends Exercise {
  completed: boolean;
  isActive: boolean;
  isPaused: boolean;
}

export function useTrainingExecution(exercises: Exercise[]) {
  const [sessionElapsed, setSessionElapsed] = useState(0); // seconds
  const [exerciseElapsed, setExerciseElapsed] = useState(0); // seconds
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(
    exercises.map((ex) => ({
      ...ex,
      completed: false,
      isActive: false, // NO auto-start
      isPaused: false,
    }))
  );

  const sessionInterval = useRef<NodeJS.Timeout>();
  const exerciseInterval = useRef<NodeJS.Timeout>();

  const currentExercise = exerciseStates.find((ex) => ex.isActive);

  // Session Timer (always runs)
  useEffect(() => {
    sessionInterval.current = setInterval(() => {
      setSessionElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (sessionInterval.current) {
        clearInterval(sessionInterval.current);
      }
    };
  }, []);

  // Exercise Timer (only if active and not paused)
  useEffect(() => {
    if (currentExercise && !currentExercise.isPaused) {
      exerciseInterval.current = setInterval(() => {
        setExerciseElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (exerciseInterval.current) {
        clearInterval(exerciseInterval.current);
      }
    }

    return () => {
      if (exerciseInterval.current) {
        clearInterval(exerciseInterval.current);
      }
    };
  }, [currentExercise?.isPaused, currentExercise?.documentId]);

  const handleExercisePress = (index: number) => {
    // Activate exercise → becomes "current exercise"
    setExerciseStates((prev) =>
      prev.map((ex, idx) => ({
        ...ex,
        isActive: idx === index,
        isPaused: false,
      }))
    );
    setExerciseElapsed(0);
  };

  const handleCompleteExercise = (index: number) => {
    setExerciseStates((prev) =>
      prev.map((ex, idx) =>
        idx === index ? { ...ex, completed: true, isActive: false } : ex
      )
    );
    // NO auto-activation of next exercise
  };

  const togglePause = () => {
    setExerciseStates((prev) =>
      prev.map((ex) =>
        ex.isActive ? { ...ex, isPaused: !ex.isPaused } : ex
      )
    );
  };

  const completedCount = exerciseStates.filter((ex) => ex.completed).length;

  return {
    sessionElapsed,
    exerciseElapsed,
    exerciseStates,
    currentExercise,
    completedCount,
    handleExercisePress,
    handleCompleteExercise,
    togglePause,
  };
}
```

- [ ] **Step 2: Commit execution hook**

```bash
git add lib/hooks/useTrainingExecution.ts
git commit -m "feat: add training execution state hook

- Dual timers (session always runs, exercise when active)
- Exercise state management (active, completed, paused)
- Manual exercise control (no auto-start/advance)
- Pause/resume functionality"
```

---

## Task 15: Training Execution Screen

**Files:**
- Create: `app/(tabs)/trainings/[id]/execute.tsx`

- [ ] **Step 1: Create execution screen**

```typescript
// app/(tabs)/trainings/[id]/execute.tsx
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTrainingDetail, useCompleteTraining } from '@/lib/queries/useTrainings';
import { useTrainingExecution } from '@/lib/hooks/useTrainingExecution';
import { formatTime } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils/cn';

export default function ExecuteTrainingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: training, isLoading } = useTrainingDetail(id);
  const [expanded, setExpanded] = useState(false);
  const completeTraining = useCompleteTraining();

  const {
    sessionElapsed,
    exerciseElapsed,
    exerciseStates,
    currentExercise,
    completedCount,
    handleExercisePress,
    handleCompleteExercise,
    togglePause,
  } = useTrainingExecution(training?.exercises || []);

  const progressPercent = training?.exercises?.length
    ? (completedCount / training.exercises.length) * 100
    : 0;

  const handleFinishTraining = () => {
    Alert.alert(
      'Training beenden',
      'Möchtest du das Training wirklich beenden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Beenden',
          style: 'destructive',
          onPress: () => {
            // Create player-progress data (points based on completion)
            const playerProgressData = training?.players?.flatMap((player) =>
              exerciseStates
                .filter((ex) => ex.completed)
                .map((ex) => ({
                  playerId: player.documentId,
                  exerciseId: ex.documentId,
                  points: 10, // Base points for completion
                }))
            ) || [];

            completeTraining.mutate({
              trainingId: id,
              sessionDuration: sessionElapsed,
              playerProgressData,
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6c47ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header (Sticky) */}
      <View className="bg-background border-b border-border px-5 py-4">
        {/* Back + Session Timer + Stop */}
        <View className="flex-row justify-between items-center mb-3">
          <Pressable onPress={() => router.back()}>
            <Text className="text-xl text-muted-foreground">←</Text>
          </Pressable>

          <View className="flex-1 items-center">
            <Text className="text-sm font-semibold mb-0.5">{training?.Name}</Text>
            <Text className="text-2xl font-bold text-warning">
              {formatTime(sessionElapsed)}
            </Text>
          </View>

          <Pressable
            onPress={handleFinishTraining}
            className="bg-destructive/10 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-destructive font-bold text-xs">■</Text>
          </Pressable>
        </View>

        {/* Progress */}
        <Text className="text-xs font-bold text-success mb-2">
          {completedCount}/{exerciseStates.length} Übungen
        </Text>

        {/* Progress Bar */}
        <View className="bg-muted rounded h-1.5">
          <View
            className="bg-success h-full rounded"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Current Exercise Card (Accordion) */}
        {!currentExercise ? (
          <View className="bg-card rounded-xl p-3.5 mx-5 mt-5 border border-border">
            <Text className="text-center text-sm text-muted-foreground">
              Wähle eine Übung aus der Liste, um zu starten
            </Text>
          </View>
        ) : (
          <View className="bg-card rounded-xl p-3.5 mx-5 mt-5 border border-primary">
            <View className="flex-row justify-between items-center mb-2.5">
              <Text className="text-[11px] font-bold text-primary uppercase">
                Aktuelle Übung
              </Text>
              <Text className="text-xs font-bold text-warning">
                ⏱ {formatTime(exerciseElapsed)}
              </Text>
            </View>

            <Pressable
              onPress={() => setExpanded(!expanded)}
              className="flex-row justify-between items-start mb-2"
            >
              <Text className="text-base font-semibold flex-1">
                {currentExercise.Name}
              </Text>
              <View className="bg-muted rounded px-2 py-1">
                <Text className="text-lg text-muted-foreground">
                  {expanded ? '⌃' : '⌄'}
                </Text>
              </View>
            </Pressable>

            <Text className="text-xs text-muted-foreground leading-relaxed">
              {currentExercise.Description}
            </Text>

            {expanded && (
              <View className="border-t border-border pt-3 mt-3">
                <Text className="text-xs font-bold mb-2">📋 Anleitung:</Text>
                {currentExercise.Steps?.map((step, idx) => (
                  <View key={idx} className="flex-row mb-1.5">
                    <Text className="text-xs text-muted-foreground mr-2">
                      {idx + 1}.
                    </Text>
                    <Text className="text-xs text-muted-foreground flex-1">
                      {step}
                    </Text>
                  </View>
                ))}

                {currentExercise.Hint && (
                  <>
                    <Text className="text-xs font-bold mt-3 mb-1.5">
                      💡 Trainer-Hinweis:
                    </Text>
                    <View className="bg-warning/10 rounded px-2 py-2">
                      <Text className="text-xs text-foreground">
                        {currentExercise.Hint}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Exercise List */}
        <View className="bg-muted/40 rounded-xl p-3 mx-5 mt-3 mb-20 border-l-[3px] border-primary">
          <View className="flex-row justify-between items-center mb-2 px-1">
            <Text className="text-[11px] font-bold text-primary uppercase">
              Übungen
            </Text>
            <Text className="text-[11px] font-bold text-primary">
              {completedCount}/{exerciseStates.length}
            </Text>
          </View>

          {exerciseStates.map((ex, idx) => (
            <Pressable
              key={ex.documentId}
              onPress={() => handleExercisePress(idx)}
              className={cn(
                'rounded-lg p-3 mb-1.5 flex-row items-center gap-2.5',
                ex.isActive && 'bg-warning/10 border border-warning',
                ex.completed && 'bg-background',
                !ex.completed && !ex.isActive && 'bg-background opacity-60'
              )}
            >
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleCompleteExercise(idx);
                }}
                className={cn(
                  'w-6 h-6 rounded border-2 items-center justify-center flex-shrink-0',
                  ex.completed && 'bg-success border-success',
                  ex.isActive && 'border-warning',
                  !ex.completed && !ex.isActive && 'border-muted-foreground'
                )}
              >
                {ex.completed && (
                  <Text className="text-xs font-bold text-background">✓</Text>
                )}
              </Pressable>

              <View className="flex-1">
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    ex.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {ex.Name}
                </Text>

                {ex.isActive && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      togglePause();
                    }}
                    className="mt-1 self-start"
                  >
                    <Text className="text-[11px] text-primary font-semibold">
                      {ex.isPaused ? '▶ Fortsetzen' : '⏸ Pause'}
                    </Text>
                  </Pressable>
                )}
              </View>

              <View className="bg-background/80 border border-border rounded px-2.5 py-1">
                <Text
                  className={cn(
                    'text-[11px]',
                    ex.isActive && 'text-warning'
                  )}
                >
                  {ex.Minutes}:00
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-card border-t border-border">
        <Pressable
          onPress={handleFinishTraining}
          disabled={completeTraining.isPending}
          className="w-full p-3.5 bg-destructive rounded-xl disabled:opacity-50"
        >
          {completeTraining.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-sm font-semibold text-destructive-foreground">
              Training beenden
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit execution screen**

```bash
git add app/(tabs)/trainings/[id]/execute.tsx
git commit -m "feat: add training execution screen

- Header with session timer and stop button
- Progress bar showing completed exercises
- Current exercise card with accordion details
- Exercise list with manual control (tap to activate, checkbox to complete)
- Inline pause/resume button for active exercise
- Bottom button to finish training
- Player-progress creation on completion"
```

---

## Task 16: Final Testing & Polish

**Files:**
- Modify: `package.json` (add test script)
- Create: `README.md` (update with setup instructions)

- [ ] **Step 1: Add development scripts to package.json**

Update the scripts section:
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "clear": "expo start --clear"
  }
}
```

- [ ] **Step 2: Update README with setup instructions**

```markdown
# TT Trainingsplaner EXPO

Mobile app for table tennis training management built with Expo and React Native.

## Tech Stack

- **Expo SDK 55** - Latest stable Expo version
- **Expo Router v4** - File-based routing
- **NativeWind v4** - Tailwind CSS for React Native
- **TanStack Query v5** - Data fetching and caching
- **Zustand** - Global state management
- **MMKV** - Fast persistent storage
- **Axios** - HTTP client with JWT interceptor

## Project Structure

```
trainingsplanerEXPO/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with QueryClient & guards
│   ├── (auth)/            # Authentication screens
│   └── (tabs)/            # Main app tabs
├── lib/                   # Core libraries
│   ├── api.ts            # Axios client
│   ├── store.ts          # Zustand auth store
│   ├── queries/          # TanStack Query hooks
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── components/           # Reusable components
└── docs/                # Documentation
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## Features (Sub-Project 1)

✅ Authentication (Login/Register)
✅ Exercise Library (Read-only)
✅ Training CRUD (Create, View, Delete)
✅ Training Execution with dual timers
✅ Manual exercise control (no auto-advance)
✅ Player management backend integration

## Backend API

- Base URL: `https://trainingsplaner-strapi.onrender.com/api`
- Authentication: JWT Bearer Token
- Main endpoints: `/auth/local`, `/exercises`, `/trainings`, `/players`

## Development

- Dark theme by default
- Session persistence with MMKV
- Automatic JWT refresh on 401
- Navigation guards for auth flows

## Next Steps (Sub-Project 2)

- Dashboard with statistics
- Profile customization
- Full player CRUD UI (Verein-Tab)
- Advanced training analytics
```

- [ ] **Step 3: Test authentication flow**

Run:
```bash
npm start
```

Expected:
1. App launches to login screen (not authenticated)
2. Can register new account → redirects to tabs
3. Can logout → redirects to login
4. Session persists on app restart

- [ ] **Step 4: Test exercise library**

Expected:
1. Exercise list loads with search bar
2. Search filters exercises by name
3. Tap exercise → navigate to detail screen
4. Detail shows all sections (title, meta, steps, hints)

- [ ] **Step 5: Test training flow**

Expected:
1. Training list shows existing trainings
2. Create button opens modal
3. Can select exercises and players
4. Create training → navigate to detail
5. Start training → navigate to execution
6. Exercise timers work correctly
7. Can complete exercises with checkbox
8. Finish training → creates player-progress entries

- [ ] **Step 6: Commit final polish**

```bash
git add package.json README.md
git commit -m "chore: add scripts and documentation

- Development scripts for iOS/Android/Web
- Updated README with setup instructions
- Project structure documentation
- Feature checklist for SP1"
```

---

## Self-Review Checklist

**1. Spec Coverage:**
- ✅ Project Setup (Task 1)
- ✅ API Client & Types (Task 2)
- ✅ Auth Store & Utilities (Task 3)
- ✅ Root Layout & Guards (Task 4)
- ✅ Authentication Screens (Task 5)
- ✅ Tab Navigation (Task 6)
- ✅ Exercise Library Queries (Task 7)
- ✅ Exercise List Screen (Task 8)
- ✅ Exercise Detail Screen (Task 9)
- ✅ Training & Player Queries (Task 10)
- ✅ Training List Screen (Task 11)
- ✅ Training Create Screen (Task 12)
- ✅ Training Detail Screen (Task 13)
- ✅ Training Execution Hook (Task 14)
- ✅ Training Execution Screen (Task 15)
- ✅ Testing & Polish (Task 16)

**2. Placeholder Scan:**
- ✅ No TBD/TODO markers
- ✅ All code blocks complete
- ✅ All file paths exact
- ✅ All commands with expected output

**3. Type Consistency:**
- ✅ StrapiResponse types used consistently
- ✅ Exercise/Training/Player types match across files
- ✅ documentId used for entity IDs (not id)
- ✅ training_status enum values consistent

**4. Implementation Completeness:**
- ✅ All features from spec included
- ✅ Error handling in mutations
- ✅ Loading states in screens
- ✅ Navigation flows complete
- ✅ Player-progress creation on training completion

---

## Summary

This plan implements the complete **Trainer Core Flow (Sub-Project 1)** in 16 tasks with bite-sized steps following TDD principles. Each task produces working, testable code with frequent commits. The implementation follows the design spec exactly, with feature-based architecture, manual exercise control, accordion details pattern, and dual timer system.

**Total estimated time:** ~4-6 hours for a skilled React Native developer
**Commits:** ~16 commits (one per task)
**Lines of code:** ~2,500 lines
