# 🏓 TT Trainingsplaner - Mobile App Entwicklungs-Dokumentation

> **Komplette Dokumentation für die EXPO Mobile App Entwicklung**

---

## 📚 Inhaltsverzeichnis

1. [Projekt-Übersicht & Strategie](#1-projekt-übersicht--strategie)
2. [Backend API Referenz](#2-backend-api-referenz)
3. [Mockup zu Implementation Guide](#3-mockup-zu-implementation-guide)
4. [Development Workflow](#4-development-workflow)
5. [Quick Start](#5-quick-start)

---

## 1. Projekt-Übersicht & Strategie

### 🎯 Entwicklungsfokus

```
┌─────────────────────────────────────────────────┐
│          AKTIVE ENTWICKLUNG                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┐       ┌────────────────┐  │
│  │  BACKEND        │       │  MOBILE APP    │  │
│  │  (Strapi CMS)   │◄─────►│  (EXPO)        │  │
│  │                 │  API  │                │  │
│  │  - REST API     │       │  - iOS         │  │
│  │  - Auth         │       │  - Android     │  │
│  │  - Database     │       │  - React Native│  │
│  └─────────────────┘       └────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          NUR REFERENZ                           │
├─────────────────────────────────────────────────┤
│  trainingsplanerFE (Nuxt/Vue)                   │
│  ✓ UI/UX Pattern Reference                      │
│  ✓ API Integration Beispiele                    │
│  ✗ Keine aktive Entwicklung                     │
└─────────────────────────────────────────────────┘
```

### 📁 Projekt-Struktur

```
C:\SAPDevelop\trainingplanerMAIN\
│
├── trainingsplaner/              # BACKEND (Strapi 5.1.1)
│   ├── src/api/                  # API Endpoints
│   │   ├── exercise/             # Trainingsübungen
│   │   ├── player/               # Spieler
│   │   ├── training/             # Trainingseinheiten
│   │   ├── methodical-series/    # Lernpfade
│   │   └── ... (14 weitere Endpoints)
│   └── ...
│
├── trainingsplanerFE/            # WEB FRONTEND (Referenz)
│   ├── pages/                    # Screen Referenzen
│   ├── services/api.ts           # API Client Pattern
│   └── stores/                   # State Management
│
└── trainingsplanerEXPO/          # MOBILE APP (Aktive Entwicklung)
    ├── .superpowers/brainstorm/  
    │   └── .../content/          # MVP MOCKUPS (HTML)
    │       ├── mvp-login.html
    │       ├── mvp-dashboard-player.html
    │       ├── mvp-library-exercises.html
    │       └── ... (16 MVP Screens)
    └── docs/                     # Diese Dokumentation
```

### 🎯 Warum Backend + Mobile?

**Vorteile:**
1. API einmal, überall nutzen (Web + Mobile + Future)
2. Mobile First - Spieler & Trainer nutzen primär Mobile
3. Web Frontend als erprobter Prototyp/Referenz
4. Fokussierte Entwicklung auf eine App

---

## 2. Backend API Referenz

### Base URL

```
Production: https://trainingsplaner-strapi.onrender.com/api
Local: http://localhost:1337/api
```

### Authentication

```typescript
// Login
POST /api/auth/local
Body: { identifier: string, password: string }
Response: { jwt: string, user: {...} }

// Token in allen Requests
Headers: { 'Authorization': 'Bearer {jwt}' }
```

### Core Endpoints

| Endpoint | Beschreibung | Hauptfelder |
|----------|--------------|-------------|
| `/exercises` | Trainingsübungen | Name, Description, Minutes, Steps[], Videos[], categories[], playerlevels[] |
| `/players` | Spieler | firstname, Name, QTTR, trainings[], individualExercises[] |
| `/trainings` | Trainingseinheiten | Name, Date, training_status, players[], exercises[] |
| `/methodical-series` | Lernpfade | Name, exercises[] |
| `/player-progress` | Spielerfortschritt | player, exercise, date, completed |
| `/categories` | Kategorien | Name |
| `/playerlevels` | Spielerniveaus | Name |
| `/focusareas` | Schwerpunkte | Name |
| `/clubs` | Vereine | Name, trainings[] |
| `/teams` | Teams | Name, players[] |
| `/traininggroups` | Trainingsgruppen | Name, players[] |

### Core Datenmodelle

#### Training (Trainingseinheit)

```json
{
  "Name": "string",
  "Date": "date",
  "Description": "richtext",
  "training_status": "draft | in_progress | completed",
  "startedAt": "datetime",
  "players": ["relation:player"],
  "exercises": ["relation:exercise"],
  "clubs": ["relation:club"]
}
```

**Status Workflow:**
- `draft` → Training erstellt, noch nicht gestartet
- `in_progress` → Training läuft
- `completed` → Training beendet

#### Exercise (Übung)

```json
{
  "Name": "string",
  "Description": "richtext",
  "Hint": "richtext",
  "Minutes": "integer",
  "deleted": "boolean",
  "approved": "boolean",
  "groupOnly": "boolean",
  "Steps": [{
    "__component": "irre.step",
    "Title": "string",
    "Description": "string"
  }],
  "Videos": [{
    "__component": "video.exercise-video",
    "VideoUrl": "string"
  }],
  "categories": ["relation:category"],
  "playerlevels": ["relation:playerlevel"],
  "focusareas": ["relation:focusarea"],
  "assignedPlayers": ["relation:player"]
}
```

#### Player (Spieler)

```json
{
  "Name": "string",
  "firstname": "string",
  "QTTR": "integer",
  "dateofbirth": "date",
  "Height": "integer",
  "playerlevel": "relation:playerlevel",
  "Club": "relation:club",
  "trainings": ["relation:training"],
  "individualExercises": ["relation:exercise"],  // Favoriten
  "teams": ["relation:team"],
  "traininggroups": ["relation:traininggroup"],
  "user": "relation:user"
}
```

### Populate & Relations

```typescript
// Deep Populate (alle Relationen)
GET /api/players/123?populate=deep

// Selective Populate
GET /api/exercises?populate[categories]=*&populate[focusareas]=*

// Mit Filtering
GET /api/trainings?filters[training_status][$eq]=draft&populate=deep

// Kombiniert
GET /api/exercises?populate=*&pagination[pageSize]=20&sort[0]=Name:asc
```

### Wichtige Queries

```typescript
// Meine Übungen (Spieler)
GET /api/exercises?filters[assignedPlayers][documentId][$eq]={playerId}&populate=*

// Nächstes Training
GET /api/trainings?filters[players][documentId][$eq]={playerId}&filters[training_status]=draft&sort=Date:asc&pagination[limit]=1

// Trainings heute (Trainer)
GET /api/trainings?filters[Date][$eq]={today}&filters[clubs][documentId][$eq]={clubId}&populate=deep

// Spieler-Fortschritt
GET /api/player-progresses?filters[player][documentId][$eq]={playerId}&sort=date:desc

// Übungen suchen
GET /api/exercises?filters[Name][$containsi]={query}&populate=*

// Lernpfade
GET /api/methodical-series?populate[exercises][populate]=*
```

---

## 3. Mockup zu Implementation Guide

### 📱 MVP Mockup Übersicht

**Location:** `.superpowers/brainstorm/19484-1776630674/content/mvp-*.html`

| Screen | File | User | API Endpoints |
|--------|------|------|---------------|
| **Login** | `mvp-login.html` | All | `POST /auth/local` |
| **Register** | `mvp-register.html` | All | `POST /auth/local/register` |
| **Dashboard (Spieler)** | `mvp-dashboard-player.html` | Player | `GET /players/{id}`, `/trainings`, `/methodical-series`, `/player-progresses` |
| **Dashboard (Trainer)** | `mvp-dashboard-trainer.html` | Trainer | `GET /trainings?filters[Date][$eq]={today}` |
| **Übungen Liste** | `mvp-library-exercises.html` | Both | `GET /exercises?populate=*` (+ filters) |
| **Übung Details** | `mvp-library-exercise-detail.html` | Both | `GET /exercises/{id}?populate=deep` |
| **Lernpfade** | `mvp-library-paths.html` | Both | `GET /methodical-series?populate=*` |
| **Lernpfad Details** | `mvp-library-path-detail.html` | Both | `GET /methodical-series/{id}?populate=deep` |
| **Trainings (Spieler)** | `mvp-training-list-player.html` | Player | `GET /trainings?filters[players]=...` |
| **Trainings (Trainer)** | `mvp-training-list-trainer.html` | Trainer | `GET /trainings?filters[clubs]=...` |
| **Training Details (Spieler)** | `mvp-training-detail-player.html` | Player | `GET /trainings/{id}?populate=deep` |
| **Training Details (Trainer)** | `mvp-training-detail-trainer.html` | Trainer | `GET /trainings/{id}?populate=deep` |
| **Training erstellen** | `mvp-training-create.html` | Trainer | `POST /trainings` |
| **Training durchführen** | `mvp-training-execution.html` | Both | `PUT /trainings/{id}`, `POST /player-progresses` |
| **Profil** | `mvp-profile.html` | Both | `GET /players/{id}`, `GET /player-progresses` |

### 🔧 React Native Setup

#### API Service

```typescript
// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://trainingsplaner-strapi.onrender.com/api';

class ApiService {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('jwt');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  async login(identifier: string, password: string) {
    const response = await this.post<{ jwt: string; user: any }>('/auth/local', {
      identifier,
      password,
    });
    await AsyncStorage.setItem('jwt', response.jwt);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  async logout() {
    await AsyncStorage.removeItem('jwt');
    await AsyncStorage.removeItem('user');
  }
}

export const api = new ApiService();
```

#### React Query Hooks

```typescript
// hooks/useExercises.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const useMyExercises = (playerId: string) => {
  return useQuery({
    queryKey: ['exercises', 'my', playerId],
    queryFn: () => api.get(
      `/exercises?filters[assignedPlayers][documentId][$eq]=${playerId}&populate=*`
    ),
  });
};

export const useAllExercises = (filters?: {
  search?: string;
  category?: string;
  level?: string;
}) => {
  const buildQuery = () => {
    let query = '/exercises?populate=*&filters[approved][$eq]=true';
    if (filters?.search) query += `&filters[Name][$containsi]=${filters.search}`;
    if (filters?.category) query += `&filters[categories][Name][$eq]=${filters.category}`;
    if (filters?.level) query += `&filters[playerlevels][Name][$eq]=${filters.level}`;
    return query;
  };

  return useQuery({
    queryKey: ['exercises', 'all', filters],
    queryFn: () => api.get(buildQuery()),
  });
};
```

### 📋 Screen Beispiele

#### Login Screen

```tsx
// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { api } from '../services/api';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      
      if (response.user.player) {
        navigation.replace('PlayerDashboard');
      } else {
        navigation.replace('TrainerDashboard');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏓 TT Trainingsplaner</Text>
      
      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Lädt...' : 'Anmelden'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

#### Dashboard (Spieler)

```tsx
// screens/PlayerDashboardScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const PlayerDashboardScreen = () => {
  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => api.get(`/players/${playerId}?populate=deep`),
  });

  const { data: nextTraining } = useQuery({
    queryKey: ['training', 'next'],
    queryFn: () => api.get(
      `/trainings?filters[players][documentId][$eq]=${playerId}&filters[training_status]=draft&sort=Date:asc&pagination[limit]=1`
    ),
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hallo, {player?.data.firstname}!</Text>
        <Text style={styles.club}>{player?.data.Club?.Name}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard label="TTR" value={player?.data.QTTR} color="#f59e0b" />
        <StatCard 
          label="Trainings" 
          value={player?.data.trainings?.filter(t => t.training_status === 'completed').length} 
          color="#22c55e" 
        />
        <StatCard 
          label="Lernpfade" 
          value={player?.data.methodicalSeries?.length || 0} 
          color="#6c47ff" 
        />
      </View>

      {/* Nächstes Training */}
      {nextTraining?.data[0] && (
        <View style={styles.nextTraining}>
          <Text style={styles.sectionTitle}>NÄCHSTES TRAINING</Text>
          <Text style={styles.trainingName}>{nextTraining.data[0].Name}</Text>
          <Text style={styles.trainingDate}>
            {formatDate(nextTraining.data[0].Date)}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('TrainingDetail', { 
              id: nextTraining.data[0].documentId 
            })}
          >
            <Text style={styles.buttonText}>Details anzeigen</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};
```

#### Übungsliste

```tsx
// screens/ExerciseLibraryScreen.tsx
import React, { useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text } from 'react-native';
import { useAllExercises } from '../hooks/useExercises';

export const ExerciseLibraryScreen = ({ navigation }) => {
  const [mode, setMode] = useState<'my' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: exercises, isLoading } = useAllExercises({ search: searchQuery });

  return (
    <View style={styles.container}>
      {/* Toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity 
          style={[styles.toggleBtn, mode === 'my' && styles.toggleBtnActive]}
          onPress={() => setMode('my')}
        >
          <Text>Für mich</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, mode === 'all' && styles.toggleBtnActive]}
          onPress={() => setMode('all')}
        >
          <Text>Alle</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Übungen durchsuchen..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Exercise List */}
      <FlatList
        data={exercises?.data}
        keyExtractor={(item) => item.documentId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseCard}
            onPress={() => navigation.navigate('ExerciseDetail', { 
              id: item.documentId 
            })}
          >
            <Text style={styles.exerciseTitle}>{item.Name}</Text>
            <View style={styles.exerciseMeta}>
              <Text style={styles.metaTag}>{item.Minutes} min</Text>
              {item.categories?.map(cat => (
                <Text key={cat.id} style={styles.metaTag}>{cat.Name}</Text>
              ))}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
```

### 🎨 Design System (aus Mockups)

```typescript
// theme/colors.ts
export const colors = {
  background: '#0a0a0f',
  surface: '#1a1a24',
  surfaceLight: '#2a2a3a',
  primary: '#6c47ff',
  primaryDark: '#5a38e6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  text: '#ffffff',
  textSecondary: '#888888',
  border: '#333333',
};

// theme/typography.ts
export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '400' as const },
};

// theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};
```

### 📴 Offline Support

```typescript
// services/offline.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export class OfflineService {
  async cacheData(key: string, data: any) {
    await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(data));
  }

  async getCachedData(key: string) {
    const data = await AsyncStorage.getItem(`cache_${key}`);
    return data ? JSON.parse(data) : null;
  }

  async addToSyncQueue(action: any) {
    const queue = await this.getSyncQueue();
    queue.push(action);
    await AsyncStorage.setItem('syncQueue', JSON.stringify(queue));
  }

  async getSyncQueue() {
    const queue = await AsyncStorage.getItem('syncQueue');
    return queue ? JSON.parse(queue) : [];
  }

  async syncWhenOnline() {
    const state = await NetInfo.fetch();
    
    if (state.isConnected) {
      const queue = await this.getSyncQueue();
      
      for (const action of queue) {
        try {
          await this.executeAction(action);
        } catch (error) {
          console.error('Sync failed:', error);
        }
      }
      
      await AsyncStorage.removeItem('syncQueue');
    }
  }

  private async executeAction(action: any) {
    switch (action.type) {
      case 'create':
        return await api.post(action.endpoint, action.data);
      case 'update':
        return await api.put(action.endpoint, action.data);
      case 'delete':
        return await api.delete(action.endpoint);
    }
  }
}

export const offlineService = new OfflineService();
```

#### React Query Persistence

```typescript
// app/_layout.tsx
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24h
      staleTime: 1000 * 60 * 5, // 5min
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      {/* App Content */}
    </PersistQueryClientProvider>
  );
}
```

---

## 4. Development Workflow

### 🚀 MVP Roadmap (8 Wochen)

#### Phase 1: Foundation (Woche 1-2)
**Ziel:** Auth + Basic Navigation

- [ ] Projekt Setup (Expo, React Navigation, React Query)
- [ ] API Service (`services/api.ts`)
- [ ] Auth Context/Store
- [ ] Login Screen
- [ ] Register Screen
- [ ] Bottom Tab Navigator
- [ ] Dashboard Screen (Basic)

#### Phase 2: Exercise Library (Woche 3)
**Ziel:** Übungen browsen & anschauen

- [ ] Exercise List Screen
- [ ] Exercise Detail Screen
- [ ] Search & Filter
- [ ] Favorites (individualExercises)
- [ ] Video Player (Expo AV)

#### Phase 3: Training Features (Woche 4-5)
**Ziel:** Trainings verwalten & durchführen

- [ ] Training List Screen
- [ ] Training Detail Screen
- [ ] Training Create Screen (Trainer)
- [ ] Training Execution Screen
- [ ] Player Progress Tracking

#### Phase 4: Advanced & Polish (Woche 6-8)
**Ziel:** Lernpfade, Offline, Polish

- [ ] Learning Paths (Methodische Reihen)
- [ ] Profile Screen
- [ ] Offline Sync Queue
- [ ] Push Notifications
- [ ] Animations (Reanimated)
- [ ] Performance Optimization
- [ ] Testing (Jest + Detox)
- [ ] App Store Preparation

### 🔄 Feature Implementation Workflow

**Beispiel: "Übungsliste implementieren"**

```
1. Mockup öffnen
   └─ .superpowers/.../mvp-library-exercises.html

2. API Endpoints checken
   └─ Siehe Sektion 2: /exercises Endpoint
   └─ GET /exercises?populate=*
   └─ Filter: ?filters[assignedPlayers]=...

3. Referenz checken (optional)
   └─ trainingsplanerFE/pages/exercises/index.vue
   └─ trainingsplanerFE/services/api.ts

4. Implementieren
   └─ Custom Hook (hooks/useExercises.ts)
   └─ Screen Component (screens/ExerciseLibraryScreen.tsx)
   └─ Exercise Card Component (components/ExerciseCard.tsx)
   └─ Navigation integrieren

5. Testen
   └─ Online Mode
   └─ Offline Mode
   └─ Search & Filter
   └─ Navigation
```

### ✅ Screen Implementation Checklist

Für jeden neuen Screen:

- [ ] Mockup HTML geöffnet & analysiert
- [ ] API Endpoints identifiziert
- [ ] Datenmodelle verstanden
- [ ] UI Komponenten Liste erstellt
- [ ] State Management geplant
- [ ] React Query Hook erstellt
- [ ] Screen Component implementiert
- [ ] Navigation integriert
- [ ] Offline-Support überlegt
- [ ] Error Handling implementiert
- [ ] Loading States implementiert
- [ ] Testing durchgeführt

---

## 5. Quick Start

### Voraussetzungen

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) oder Android Emulator
- Strapi Backend läuft (lokal oder Production)

### Setup

```bash
# 1. EXPO Projekt initialisieren
cd trainingsplanerEXPO
npx create-expo-app@latest .

# 2. Dependencies installieren
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install @tanstack/react-query @tanstack/react-query-persist-client
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install react-native-safe-area-context react-native-screens

# 3. Expo AV (Video Player)
npx expo install expo-av

# 4. TypeScript Setup
npm install --save-dev @types/react @types/react-native

# 5. Start Development
npx expo start
```

### Erste Schritte

**1. API Service erstellen** (`services/api.ts`)
- Siehe Sektion 3 → React Native Setup

**2. Login Screen** (`screens/LoginScreen.tsx`)
- Siehe Sektion 3 → Screen Beispiele → Login

**3. Navigation Setup** (`navigation/AppNavigator.tsx`)
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PlayerDashboard" component={PlayerDashboardScreen} />
      {/* ... weitere Screens */}
    </Stack.Navigator>
  </NavigationContainer>
);
```

**4. React Query Setup** (`app/_layout.tsx`)
- Siehe Sektion 3 → Offline Support → React Query Persistence

### Backend Lokal starten

```bash
cd trainingsplaner
npm run develop

# URLs:
# API: http://localhost:1337/api
# Admin: http://localhost:1337/admin
```

### Testing

```bash
# API testen
curl http://localhost:1337/api/exercises

# Mit Auth
curl -H "Authorization: Bearer YOUR_JWT" http://localhost:1337/api/players
```

---

## 📞 Hilfe & Ressourcen

### Bei Fragen zu...

| Thema | Sektion |
|-------|---------|
| API Endpoints | Sektion 2 → Core Endpoints |
| Datenmodelle | Sektion 2 → Core Datenmodelle |
| Screen-Aufbau | Sektion 3 → Screen Beispiele |
| Code-Beispiele | Sektion 3 → React Native Setup |
| Offline-Sync | Sektion 3 → Offline Support |
| Design System | Sektion 3 → Design System |
| Workflow | Sektion 4 |

### Externe Links

- **Backend API:** https://trainingsplaner-strapi.onrender.com/api
- **Strapi Docs:** https://docs.strapi.io
- **Expo Docs:** https://docs.expo.dev
- **React Navigation:** https://reactnavigation.org
- **React Query:** https://tanstack.com/query

---

## 🎓 Learning Path für Neulinge

```
Tag 1: Projekt verstehen
  └─ Sektion 1 (komplett lesen)
  └─ Mockups in Browser öffnen

Tag 2: API verstehen
  └─ Sektion 2 (Core Endpoints & Datenmodelle)
  └─ Backend lokal starten
  └─ API mit curl testen

Tag 3: Erste Implementation
  └─ Sektion 3 → API Service
  └─ Sektion 3 → Login Screen
  └─ Login implementieren

Tag 4-5: Core Screens
  └─ Dashboard implementieren
  └─ Exercise Library implementieren
  └─ Navigation aufbauen

Woche 2+: Nach Roadmap (Sektion 4) fortfahren
```

---

**Happy Coding! 🚀🏓**

*Letzte Aktualisierung: 2026-04-20*
