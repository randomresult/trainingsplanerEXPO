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

### Multi-Project Layout

This repo is part of a multi-project setup:

```
trainingplanerMAIN/              # Local container folder
├── trainingsplaner/             # Backend (Strapi CMS) - Git Repo
├── trainingsplanerFE/           # Web Frontend (Nuxt) - Git Repo (Reference)
└── trainingsplanerEXPO/         # Mobile App (Expo) - Git Repo (This project)
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

- [x] Authentication (Login/Register)
- [x] Exercise Library (Read-only)
- [x] Training CRUD (Create, View, Delete)
- [x] Training Execution with dual timers
- [x] Manual exercise control (no auto-advance)
- [x] Player management backend integration

## Backend API

- Base URL: `https://trainingsplaner-strapi.onrender.com/api`
- Authentication: JWT Bearer Token
- Main endpoints: `/auth/local`, `/exercises`, `/trainings`, `/players`

### Local Backend (optional)

```bash
cd ../trainingsplaner
npm run develop
# → http://localhost:1337/api
```

## Development

- Dark theme by default
- Session persistence with MMKV
- Automatic JWT refresh on 401
- Navigation guards for auth flows

## Documentation

- **[DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - Complete development guide with API reference, mockup mappings, and code examples
- **[DOCUMENTATION_CONSOLIDATION.md](docs/DOCUMENTATION_CONSOLIDATION.md)** - Documentation structure overview

## Next Steps (Sub-Project 2)

- Dashboard with statistics
- Profile customization
- Full player CRUD UI (Verein-Tab)
- Advanced training analytics
