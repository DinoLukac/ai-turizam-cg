# Setup Instrukcije

## 1. Instalacija Dependencies

```bash
# Instaliraj root dependencies
npm install

# Instaliraj web dependencies
cd web
npm install
cd ..

# Instaliraj backend dependencies
cd backend
npm install
cd ..
```

## 2. Konfiguracija Environment Variables

### Web aplikacija (.env.local)

Kreiraj fajl `web/.env.local` sa sljedećim sadržajem:

```env
MAPBOX_TOKEN=pk.eyJ1IjoiZGxtYXBib3gyMDAyIiwiYSI6ImNtaTF0a2E4aTA1aWkyd3F2czE3cXUwZHAifQ.GR8uhIfZQfYnGg5ELwlJpQ
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZGxtYXBib3gyMDAyIiwiYSI6ImNtaTF0a2E4aTA1aWkyd3F2czE3cXUwZHAifQ.GR8uhIfZQfYnGg5ELwlJpQ
GOOGLE_PLACES_API_KEY=AIzaSyB6m39ZcdcQx9Wjhc3_bLOgTn0sBx1Z2Qw
WEATHER_API_KEY=074eafd092dfe798f664a71540df82d3
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend aplikacija (.env)

Kreiraj fajl `backend/.env` sa sljedećim sadržajem:

```env
DATABASE_URL=postgres://aiguide_app:-%5BQM%23o7vH%28i.DQ0%23@34.41.135.146:5432/aiguide
GOOGLE_PLACES_API_KEY=AIzaSyB6m39ZcdcQx9Wjhc3_bLOgTn0sBx1Z2Qw
WEATHER_API_KEY=074eafd092dfe798f664a71540df82d3
PORT=3001
```

**VAŽNO**: Regeneriši sve API ključeve nakon testiranja jer su bili javno vidljivi!

## 3. Database Setup

```bash
cd backend
# Poveži se na PostgreSQL i pokreni schema
psql $DATABASE_URL -f src/database/schema.sql
```

## 4. Pokretanje Aplikacije

### Development Mode

```bash
# Terminal 1 - Web aplikacija
cd web
npm run dev
# Otvori http://localhost:3000

# Terminal 2 - Backend API
cd backend
npm run dev
# API će biti dostupan na http://localhost:3001
```

## 5. Testiranje

1. Otvori http://localhost:3000 u browseru
2. Dozvoli pristup lokaciji kada browser zatraži
3. Trebao bi se vidjeti Mapbox sa plavom tačkom na tvojoj tačnoj lokaciji
4. Lijevi panel bi trebao biti vidljiv

