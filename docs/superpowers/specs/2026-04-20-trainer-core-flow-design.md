---
name: Trainer Core Flow - Sub-Project 1
description: Foundation + Training Core Flow for TT Trainingsplaner EXPO app
type: design
date: 2026-04-20
---

# Trainer Core Flow - Sub-Project 1 Design

## Overview

This design covers **Sub-Project 1** of the TT Trainingsplaner EXPO app: the foundational setup and trainer core workflow. This includes project setup, authentication, tab navigation, exercise library (read-only), training CRUD, training execution, and backend integration for player management.

**Out of Scope (Sub-Project 2):**
- Dashboard/Statistics
- Profile customization
- Verein-Tab with full player CRUD UI
- Advanced player management screens

## 1. Project Setup

### Tech Stack

- **Expo SDK 55** (latest stable, April 2026)
- **Expo Router v4** (file-based routing)
- **NativeWind v4** (Tailwind CSS for React Native)
- **TanStack Query v5** (data fetching, caching, mutations)
- **Axios** (HTTP client with JWT interceptor)
- **Zustand** (global state: auth + activeClub)
- **MMKV** (persistent storage for JWT + user)
- **TypeScript** (strict mode)

### Folder Structure (Feature-Based)

```
trainingsplanerEXPO/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root Layout (QueryClient, Session Restore, Guards)
│   ├── (auth)/
│   │   ├── login.tsx            # Login screen
│   │   └── register.tsx         # Registration screen
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom Tab Navigator
│       ├── index.tsx            # Dashboard (Tab 1, placeholder for SP2)
│       ├── library/
│       │   ├── index.tsx        # Exercise list with search
│       │   └── [id].tsx         # Exercise detail (normal screen)
│       ├── trainings/
│       │   ├── index.tsx        # Training list
│       │   ├── create.tsx       # Training create
│       │   ├── [id].tsx         # Training detail
│       │   └── [id]/execute.tsx # Training execution
│       └── profile.tsx          # Profile (Tab 4, placeholder for SP2)
├── lib/
│   ├── api.ts                   # Axios client with interceptors
│   ├── store.ts                 # Zustand auth store
│   ├── queries/
│   │   ├── useAuth.ts           # Login/Register mutations
│   │   ├── useExercises.ts      # Exercise queries
│   │   ├── useTrainings.ts      # Training CRUD
│   │   └── usePlayers.ts        # Player queries (for training create)
│   └── hooks/
│       └── useTrainingExecution.ts  # Execution state management
├── components/
│   ├── ui/                      # Reusable UI components
│   └── features/                # Feature-specific components
└── assets/                      # Images, fonts, etc.
```

### Backend API

- **Base URL:** `https://trainingsplaner-strapi.onrender.com/api`
- **Authentication:** JWT Bearer Token
- **Main Collections:**
  - `/auth/local` - Login/Register
  - `/exercises` - Exercise library
  - `/trainings` - Training sessions
  - `/players` - Players (filtered by Club)
  - `/player-progresses` - Exercise completion tracking

---

## 2. Authentication & Login

### Auth Flow

1. **Session Restore:** On app launch, `app/_layout.tsx` calls `useAuthStore.restoreSession()` to check for stored JWT + user in MMKV
2. **Navigation Guard:** If not authenticated, redirect to `/(auth)/login`
3. **Login:** User enters email/password → `useLogin` mutation → Store JWT + user → Navigate to `/(tabs)`
4. **Logout:** Clear JWT + user from MMKV and Zustand → Redirect to login

### Zustand Auth Store

```typescript
// lib/store.ts
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

interface User {
  id: number;
  username: string;
  email: string;
  isTrainer: boolean;
  player: {
    documentId: string;
    firstname: string;
    Name: string;
    Club: { documentId: string; Name: string };
  };
}

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
  login: (token, user) => {
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
    const token = storage.getString('jwt');
    const userJson = storage.getString('user');
    if (token && userJson) {
      const user = JSON.parse(userJson);
      set({ token, user, isAuthenticated: true });
    }
  },
}));
```

### Axios Interceptor

```typescript
// lib/api.ts
import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const BASE_URL = 'https://trainingsplaner-strapi.onrender.com/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// JWT Interceptor
apiClient.interceptors.request.use((config) => {
  const token = storage.getString('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 Error Handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.delete('jwt');
      storage.delete('user');
      // Zustand logout will be triggered by useAuthStore
    }
    return Promise.reject(error);
  }
);
```

### Login Screen

```typescript
// app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useLogin } from '@/lib/queries/useAuth';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleLogin = () => {
    login.mutate({ identifier, password });
  };

  return (
    <View className="flex-1 bg-background p-5 justify-center">
      <Text className="text-3xl font-bold mb-8">Login</Text>
      
      <TextInput
        placeholder="E-Mail oder Username"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        className="bg-card border border-border rounded-lg px-4 py-3 mb-4"
      />
      
      <TextInput
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-card border border-border rounded-lg px-4 py-3 mb-6"
      />
      
      <Pressable 
        onPress={handleLogin}
        disabled={login.isPending}
        className="bg-primary rounded-xl p-4 disabled:opacity-50"
      >
        <Text className="text-center text-sm font-semibold text-primary-foreground">
          {login.isPending ? 'Wird eingeloggt...' : 'Einloggen'}
        </Text>
      </Pressable>
      
      {login.isError && (
        <Text className="text-destructive text-sm text-center mt-4">
          Login fehlgeschlagen. Bitte überprüfe deine Daten.
        </Text>
      )}
    </View>
  );
}
```

### Login Mutation

```typescript
// lib/queries/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import { router } from 'expo-router';

export const useLogin = () => {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async ({ identifier, password }: { identifier: string; password: string }) => {
      const { data } = await apiClient.post('/auth/local', {
        identifier,
        password,
      });
      return data;
    },
    onSuccess: (data) => {
      login(data.jwt, data.user);
      router.replace('/(tabs)');
    },
  });
};
```

---

## 3. Tab Navigation & Bibliothek

### Bottom Tab Navigator

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Dashboard', tabBarIcon: '📊' }}
      />
      <Tabs.Screen 
        name="library" 
        options={{ title: 'Bibliothek', tabBarIcon: '📚' }}
      />
      <Tabs.Screen 
        name="trainings" 
        options={{ title: 'Trainings', tabBarIcon: '🏓' }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profil', tabBarIcon: '👤' }}
      />
    </Tabs>
  );
}
```

### Exercise Library (Read-Only)

#### Exercise List Screen

**Features:**
- Search bar (filters by exercise name)
- Exercise cards showing: Name, Duration, Focus count, Difficulty badge
- Tap → Navigate to detail screen

**API Query:**
```typescript
// lib/queries/useExercises.ts
export const useExercises = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['exercises', searchQuery],
    queryFn: async () => {
      const { data } = await apiClient.get('/exercises', {
        params: {
          filters: searchQuery ? { Name: { $containsi: searchQuery } } : undefined,
          populate: 'focus',
        },
      });
      return data.data;
    },
  });
};
```

#### Exercise Detail Screen (Normal Screen, NOT Modal)

**Layout Sections:**
1. **Sticky Header:** Back button + Favorite button (placeholder for SP2)
2. **Title:** Exercise name (large, bold)
3. **Meta Tags:** Difficulty badge + focus tags (scrollable horizontal)
4. **Info Grid:** Duration, Focus count in cards
5. **Video Player:** If `Videos` array exists (placeholder or react-native-video)
6. **Description:** Main description text
7. **Steps Section:** Numbered list with left border accent
8. **Trainer Hints Section:** Warning-colored box with icon

**Key Implementation Notes:**
- This is a **full-screen detail view**, not a modal
- Used for library browsing (not training execution)
- All content scrollable in single ScrollView
- MVP mockup reference: Library Detail (Frage 4 Option A)

---

## 4. Training CRUD

### Training List Screen

**Features:**
- List of trainings (filtered by trainer's club)
- Shows: Name, Date, Status badge, Player count
- Create button (trainer-only, fixed bottom)
- Tap → Navigate to detail

**Training Status:**
- `draft` - Not started
- `in_progress` - Currently executing
- `completed` - Finished

**API Query:**
```typescript
// lib/queries/useTrainings.ts
export const useTrainings = () => {
  const user = useAuthStore((s) => s.user);
  const clubId = user?.player?.Club?.documentId;

  return useQuery({
    queryKey: ['trainings', clubId],
    queryFn: async () => {
      const { data } = await apiClient.get('/trainings', {
        params: {
          filters: { Club: { documentId: { $eq: clubId } } },
          populate: ['exercises', 'players'],
        },
      });
      return data.data;
    },
    enabled: !!clubId,
  });
};
```

### Training Create Screen

**Features:**
1. **Name Input:** Training session name
2. **Date Picker:** Training date (default: today)
3. **Exercise Multi-Select:** Modal with checkboxes, shows selected count
4. **Player Multi-Select:** Modal with checkboxes, shows selected count
   - Players with `requiresInviteAcceptance: true` show "🔒 Einladung wird gesendet" badge
5. **Create Button:** Disabled until name + exercises + players selected

**Create Mutation:**
```typescript
export const useCreateTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      name, 
      date, 
      exerciseIds, 
      playerIds 
    }: {
      name: string;
      date: string;
      exerciseIds: string[];
      playerIds: string[];
    }) => {
      const { data } = await apiClient.post('/trainings', {
        data: {
          Name: name,
          Date: date,
          training_status: 'draft',
          exercises: {
            connect: exerciseIds.map((id) => ({ documentId: id })),
          },
          players: {
            connect: playerIds.map((id) => ({ documentId: id })),
          },
        },
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.push(`/trainings/${data.data.documentId}`);
    },
  });
};
```

### Training Detail Screen

**Sections:**
1. **Header:** Training name, date, status badge
2. **Players List:** Avatars + names (horizontal scroll)
   - Shows "🔒 Einladung ausstehend" badge for `requiresInviteAcceptance` players
3. **Exercises List:** Exercise cards with duration
4. **Actions:**
   - **Start Training** button (only if status = draft) → Navigate to `/trainings/[id]/execute`
   - **Delete Training** button (destructive, with confirm dialog)

**Delete Mutation:**
```typescript
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
```

---

## 5. Training Execution

### Layout (Based on MVP Mockup)

The execution screen follows the dark-themed MVP mockup layout with:
- **Session Timer** prominent in header (large, center, orange)
- **Exercise Timer** small, in current exercise card
- **Accordion pattern** for exercise details (not modal, not separate screen)
- **Manual exercise control** (no auto-start, no auto-advance)

#### Header (Sticky)

```typescript
<View className="bg-background border-b border-border px-5 py-4">
  {/* Back + Session Timer + Stop */}
  <View className="flex-row justify-between items-center mb-3">
    <Pressable onPress={() => router.back()}>
      <Text className="text-xl text-muted-foreground">←</Text>
    </Pressable>
    
    <View className="flex-1 items-center">
      <Text className="text-sm font-semibold mb-0.5">Jugendtraining</Text>
      <Text className="text-2xl font-bold text-warning">{formatTime(sessionElapsed)}</Text>
    </View>
    
    <Pressable 
      onPress={handleStopTraining}
      className="bg-destructive/10 px-3 py-1.5 rounded-lg"
    >
      <Text className="text-destructive font-bold text-xs">■</Text>
    </Pressable>
  </View>
  
  {/* Progress */}
  <Text className="text-xs font-bold text-success mb-2">
    {completedCount}/{exercises.length} Übungen · +{totalPoints} Pkt
  </Text>
  
  {/* Progress Bar */}
  <View className="bg-muted rounded h-1.5">
    <View 
      className="bg-success h-full rounded" 
      style={{ width: `${progressPercent}%` }}
    />
  </View>
</View>
```

#### Current Exercise Card (Accordion)

**Collapsed State (Default):**
- Shows: Exercise name, description (truncated), exercise timer
- Chevron button to expand

**Expanded State:**
- Shows: All of above + Steps (numbered list) + Trainer Hint (warning-styled box)
- Tap anywhere on card or chevron to toggle

**Why:** Keeps context visible while allowing quick access to full instructions without navigation

```typescript
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
            <Text className="text-xs text-muted-foreground mr-2">{idx + 1}.</Text>
            <Text className="text-xs text-muted-foreground flex-1">{step}</Text>
          </View>
        ))}
        
        {currentExercise.Hint && (
          <>
            <Text className="text-xs font-bold mt-3 mb-1.5">💡 Trainer-Hinweis:</Text>
            <View className="bg-warning/10 rounded px-2 py-2">
              <Text className="text-xs text-foreground">{currentExercise.Hint}</Text>
            </View>
          </>
        )}
      </View>
    )}
  </View>
)}
```

#### Exercise List (Main Control)

Each exercise row shows:
- **Checkbox:** Tap to mark exercise as completed
- **Exercise Name**
- **Start/Pause Button:** Only visible for active exercise (inline in row)
- **Duration Badge**

**States:**
- **Completed:** Green checkbox, strike-through text, gray background
- **Active:** Orange border, orange duration badge, shows Start/Pause button
- **Pending:** Gray checkbox, dimmed text

**Interactions:**
- **Tap on exercise row:** Activates exercise (becomes "current exercise")
- **Tap on checkbox:** Completes exercise (does NOT auto-activate next)
- **Tap Start/Pause:** Toggles exercise timer (session timer always runs)

```typescript
<View className="bg-muted/40 rounded-xl p-3 mx-5 mt-3 border-l-[3px] border-primary">
  <View className="flex-row justify-between items-center mb-2 px-1">
    <Text className="text-[11px] font-bold text-primary uppercase">Übungen</Text>
    <Text className="text-[11px] font-bold text-primary">
      {completedCount}/{exercises.length}
    </Text>
  </View>
  
  {exercises.map((ex, idx) => (
    <Pressable
      key={ex.documentId}
      onPress={() => handleExercisePress(idx)}
      className={cn(
        "rounded-lg p-3 mb-1.5 flex-row items-center gap-2.5",
        ex.isActive && "bg-warning/10 border border-warning",
        ex.completed && "bg-background",
        !ex.completed && !ex.isActive && "bg-background opacity-60"
      )}
    >
      <Pressable 
        onPress={() => handleCompleteExercise(idx)}
        className={cn(
          "w-6 h-6 rounded border-2 items-center justify-center flex-shrink-0",
          ex.completed && "bg-success border-success",
          ex.isActive && "border-warning",
          !ex.completed && !ex.isActive && "border-muted-foreground"
        )}
      >
        {ex.completed && <Text className="text-xs font-bold text-background">✓</Text>}
      </Pressable>
      
      <View className="flex-1">
        <Text className={cn(
          "text-sm font-semibold",
          ex.completed && "line-through text-muted-foreground"
        )}>
          {ex.Name}
        </Text>
        
        {ex.isActive && (
          <Pressable 
            onPress={togglePause}
            className="mt-1 self-start"
          >
            <Text className="text-[11px] text-primary font-semibold">
              {ex.isPaused ? '▶ Fortsetzen' : '⏸ Pause'}
            </Text>
          </Pressable>
        )}
      </View>
      
      <View className="bg-background/80 border border-border rounded px-2.5 py-1">
        <Text className={cn(
          "text-[11px]",
          ex.isActive && "text-warning"
        )}>
          {ex.Minutes}:00
        </Text>
      </View>
    </Pressable>
  ))}
</View>
```

#### Bottom Bar

```typescript
<View className="absolute bottom-0 left-0 right-0 p-5 bg-card border-t border-border">
  <Pressable 
    onPress={handleFinishTraining}
    className="w-full p-3.5 bg-destructive rounded-xl"
  >
    <Text className="text-center text-sm font-semibold text-destructive-foreground">
      Training beenden
    </Text>
  </Pressable>
</View>
```

### State Management

```typescript
// lib/hooks/useTrainingExecution.ts
import { useState, useEffect, useRef } from 'react';

interface ExerciseState {
  documentId: string;
  Name: string;
  Minutes: number;
  completed: boolean;
  isActive: boolean;
  isPaused: boolean;
}

export const useTrainingExecution = (exercises: Exercise[]) => {
  const [sessionElapsed, setSessionElapsed] = useState(0); // seconds
  const [exerciseElapsed, setExerciseElapsed] = useState(0);
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
  
  const currentExercise = exerciseStates.find(ex => ex.isActive);
  
  // Session Timer (always runs)
  useEffect(() => {
    sessionInterval.current = setInterval(() => {
      setSessionElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(sessionInterval.current);
  }, []);
  
  // Exercise Timer (only if active and not paused)
  useEffect(() => {
    if (currentExercise && !currentExercise.isPaused) {
      exerciseInterval.current = setInterval(() => {
        setExerciseElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(exerciseInterval.current);
    }
    
    return () => clearInterval(exerciseInterval.current);
  }, [currentExercise?.isPaused]);
  
  const handleExercisePress = (index: number) => {
    // Activate exercise → becomes "current exercise"
    setExerciseStates(prev => 
      prev.map((ex, idx) => ({
        ...ex,
        isActive: idx === index,
        isPaused: false,
      }))
    );
    setExerciseElapsed(0);
  };
  
  const handleCompleteExercise = (index: number) => {
    setExerciseStates(prev => 
      prev.map((ex, idx) => 
        idx === index ? { ...ex, completed: true, isActive: false } : ex
      )
    );
    // NO auto-activation of next exercise
  };
  
  const togglePause = () => {
    setExerciseStates(prev => 
      prev.map(ex => 
        ex.isActive ? { ...ex, isPaused: !ex.isPaused } : ex
      )
    );
  };
  
  return {
    sessionElapsed,
    exerciseElapsed,
    exerciseStates,
    currentExercise,
    completedCount: exerciseStates.filter(ex => ex.completed).length,
    handleExercisePress,
    handleCompleteExercise,
    togglePause,
  };
};
```

### Training Mutations

```typescript
// lib/queries/useTrainings.ts

export const useStartTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trainingId: string) => {
      const { data } = await apiClient.put(`/trainings/${trainingId}`, {
        data: {
          training_status: 'in_progress',
          startedAt: new Date().toISOString(),
        },
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings', data.data.documentId] });
    },
  });
};

export const useCompleteTraining = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      trainingId, 
      sessionDuration,
      playerProgressData 
    }: {
      trainingId: string;
      sessionDuration: number;
      playerProgressData: Array<{ playerId: string; exerciseId: string; points: number }>;
    }) => {
      // 1. Complete training
      await apiClient.put(`/trainings/${trainingId}`, {
        data: {
          training_status: 'completed',
          completedAt: new Date().toISOString(),
          actualDuration: sessionDuration,
        },
      });
      
      // 2. Create player-progress entries
      for (const progress of playerProgressData) {
        await apiClient.post('/player-progresses', {
          data: {
            player: { connect: [{ documentId: progress.playerId }] },
            exercise: { connect: [{ documentId: progress.exerciseId }] },
            training: { connect: [{ documentId: trainingId }] },
            Points: progress.points,
          },
        });
      }
      
      return trainingId;
    },
    onSuccess: (trainingId) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.replace(`/trainings/${trainingId}`);
    },
  });
};
```

### Execution Flow

1. **Start:** Trainer taps "Start Training" on detail screen → `useStartTraining` sets status to `in_progress` → Navigate to `/trainings/[id]/execute`
2. **Initial State:** Session timer starts, no exercise is active, Current Exercise Card shows "Wähle eine Übung..."
3. **Activate Exercise:** Trainer taps on exercise row → Exercise becomes active, appears in Current Exercise Card, exercise timer starts
4. **Pause Exercise:** Tap Start/Pause button in active exercise row → Exercise timer stops, session timer continues
5. **Complete Exercise:** Tap checkbox → Exercise marked completed, no auto-advance
6. **Next Exercise:** Trainer manually taps next exercise row to activate
7. **Accordion Details:** Tap on Current Exercise Card to expand/collapse Steps + Trainer Hints
8. **Finish Training:** Tap "Training beenden" → Confirm dialog → `useCompleteTraining` with duration + player-progress data → Navigate to detail screen

**Why:** Player-progress entries track which exercises each player completed, used for statistics in SP2.

---

## 6. Spieler-Management

### Scope for Sub-Project 1

**Backend Integration Only** - Query hooks are implemented for use in Training Create screen:

```typescript
// lib/queries/usePlayers.ts

export const usePlayers = () => {
  const user = useAuthStore(s => s.user);
  const clubId = user?.player?.Club?.documentId;
  
  return useQuery({
    queryKey: ['players', clubId],
    queryFn: async () => {
      const { data } = await apiClient.get('/players', {
        params: {
          filters: { Club: { documentId: { $eq: clubId } } },
          populate: '*',
        },
      });
      return data.data;
    },
    enabled: !!clubId,
  });
};
```

**Usage in SP1:**
- Training Create screen uses `usePlayers()` to fetch available players
- Player multi-select shows badge "🔒 Einladung wird gesendet" for players with `requiresInviteAcceptance: true`
- No player CRUD UI screens in SP1

### Scope for Sub-Project 2 (Verein-Tab)

The following features will be implemented in SP2:
- Player list in Verein-Tab
- Player create form (`/club/players/create`)
- Player edit form (`/club/players/[id]/edit`)
- Player delete functionality
- Kinder-Account toggle (sets `requiresInviteAcceptance` flag at creation)
- Player detail screen with statistics

**requiresInviteAcceptance Flag:**
- Set at player creation by trainer
- When `true`, indicates that parental invitation email should be sent (backend responsibility)
- UI shows "🔒 Einladung ausstehend" badge in player lists
- Used to distinguish child accounts from adult accounts

---

## Summary

This design covers the complete **Trainer Core Flow (SP1)** including:

1. ✅ **Project Setup** - Expo SDK 55, feature-based structure, tech stack
2. ✅ **Authentication** - Login/Register screens, JWT flow, session restore
3. ✅ **Tab Navigation & Library** - Bottom tabs, exercise list/detail (normal screen)
4. ✅ **Training CRUD** - List, create (with exercise/player selection), detail, delete
5. ✅ **Training Execution** - Accordion details, dual timers (session + exercise), manual control, player-progress tracking
6. ✅ **Player Management Backend** - Query hooks for SP1, full CRUD UI deferred to SP2

**Key Design Decisions:**
- **Feature-based architecture** for scalability
- **Normal screen for library exercise details** (not modal) for full browsing experience
- **Accordion pattern in execution** for quick access to instructions without navigation
- **Manual exercise control** (no auto-start/advance) for trainer flexibility
- **Dual timer system** (session always runs, exercise only when active and not paused)
- **Player CRUD deferred to SP2** (Verein-Tab) to keep SP1 focused on core training workflow

**Next Steps:**
1. Write implementation plan (via writing-plans skill)
2. Scaffold project structure
3. Implement features section by section
4. Test on iOS/Android simulators
