# AI Turizam CG - Smart Tourism Application

Aplikacija za pametni turizam pomoću veštačke inteligencije.

## Struktura Projekta

- `web/` - Next.js web aplikacija
- `backend/` - Express.js API server
- `mobile/` - React Native (Expo) mobilna aplikacija

## Setup

1. Instaliraj dependencies:
```bash
npm install
```

2. Kopiraj `.env.example` u `.env` i popuni sve ključeve

3. Pokreni development servere:
```bash
npm run dev:web      # Web aplikacija na http://localhost:3000
npm run dev:backend  # Backend API na http://localhost:3001
```

## Tehnologije

- **Frontend**: Next.js, TypeScript, React, Mapbox GL JS
- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Mobile**: React Native, Expo, TypeScript
- **AI**: OpenAI (GPT) za generisanje turističkih vodiča
- **Maps**: Mapbox za kartografiju, Google Places za POI

