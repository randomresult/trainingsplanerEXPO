# 🏓 TT Trainingsplaner - EXPO Mobile App

React Native mobile app for table tennis training management.

## 📁 Expected Project Structure

This repo is part of a multi-project setup:

```
trainingplanerMAIN/              # Local container folder
├── trainingsplaner/             # Backend (Strapi CMS) - Git Repo
├── trainingsplanerFE/           # Web Frontend (Nuxt) - Git Repo (Reference)
└── trainingsplanerEXPO/         # Mobile App (Expo) - Git Repo (This project)
```

## 📚 Documentation

**Complete development documentation:**

- **[DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - Complete guide with API reference, mockup mappings, code examples, and workflow
- **[DOCUMENTATION_CONSOLIDATION.md](docs/DOCUMENTATION_CONSOLIDATION.md)** - Explains the documentation structure

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Backend running (local or production)

### Setup
```bash
# Install dependencies
npm install

# Start development
npx expo start
```

### Backend Access
```bash
# Production API
https://trainingsplaner-strapi.onrender.com/api

# Local Backend (in sibling folder)
cd ../trainingsplaner
npm run develop
# → http://localhost:1337/api
```

### Web Frontend Reference (optional)
```bash
# Reference only - not actively developed
cd ../trainingsplanerFE
npm run dev
# → http://localhost:3000
```

## 🎯 Development Focus

- **✅ Active:** Backend (Strapi) + Mobile App (EXPO)
- **📚 Reference:** Web Frontend (Nuxt/Vue)

## 📋 MVP Mockups

All 16 MVP mockup screens are in:
```
.superpowers/brainstorm/19484-1776630674/content/mvp-*.html
```

Open them in a browser to see the UI designs.

## 🗺️ Roadmap

**Phase 1 (Week 1-2):** Auth + Navigation  
**Phase 2 (Week 3):** Exercise Library  
**Phase 3 (Week 4-5):** Training Features  
**Phase 4 (Week 6-8):** Advanced Features + Polish  

See [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) for details.

---

**For full documentation:** → [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)
