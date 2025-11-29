# Instrukcije za preuzimanje projekta na drugom laptopu

## Korak 1: Preuzmi projekat sa GitHub-a

```bash
# Kloniraj repozitorijum
git clone https://github.com/DinoLukac/ai-turizam-cg.git

# Uđi u folder projekta
cd ai-turizam-cg
```

## Korak 2: Instaliraj Node.js (ako nije instaliran)

```bash
# Provjeri da li imaš Node.js
node --version
npm --version

# Ako nemaš, instaliraj Node.js (v18 ili noviji):
# Ubuntu/Debian:
# curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# sudo apt-get install -y nodejs

# Ili preuzmi sa: https://nodejs.org/
```

## Korak 3: Instaliraj dependencies

```bash
# Instaliraj dependencies za backend
cd backend
npm install

# Instaliraj dependencies za frontend
cd ../web
npm install

# Vrati se u root folder
cd ..
```

## Korak 4: Postavi .env fajlove

`.env` fajlovi se **NE** push-uju na GitHub zbog sigurnosti (sadrže API ključeve).

### 4.1. Backend .env fajl

```bash
# Uđi u backend folder
cd backend

# Kreiraj .env fajl
nano .env
# ili
code .env
# ili
vim .env
```

**Dodaj u `backend/.env`:**

```env
# Server Configuration
PORT=3002
HOST=0.0.0.0

# Google Places API
GOOGLE_PLACES_API_KEY=tvoj_google_places_api_key_ovdje

# Database (ako koristiš PostgreSQL)
DATABASE_URL=postgres://user:password@localhost:5432/ai_turizam

# CORS (opcionalno)
# CORS_ORIGIN=http://localhost:3000
```

**Napomena:** Zamijeni `tvoj_google_places_api_key_ovdje` sa stvarnim Google Places API ključem.

### 4.2. Frontend .env fajl

```bash
# Vrati se u root, pa uđi u web folder
cd ../web

# Kreiraj .env.local fajl (Next.js koristi .env.local)
nano .env.local
# ili
code .env.local
```

**Dodaj u `web/.env.local`:**

```env
# Mapbox Token
NEXT_PUBLIC_MAPBOX_TOKEN=tvoj_mapbox_token_ovdje

# API URL (opcionalno - koristi se relativni put /api/*)
# NEXT_PUBLIC_API_URL=http://localhost:3002
```

**Napomena:** 
- Zamijeni `tvoj_mapbox_token_ovdje` sa stvarnim Mapbox tokenom
- `NEXT_PUBLIC_API_URL` nije potreban jer koristimo relativne putanje `/api/*`

## Korak 5: Provjeri da li sve radi

### 5.1. Pokreni backend

```bash
# Uđi u backend folder
cd backend

# Pokreni backend server
npm run dev
```

**Očekivani output:**
```
🚀 Server running on http://0.0.0.0:3002
   Accessible at http://localhost:3002 (local)
   Accessible from LAN at http://<LAN-IP>:3002
```

**Ostavi ovaj terminal otvoren!**

### 5.2. Pokreni frontend (u novom terminalu)

```bash
# Otvori NOVI terminal prozor
cd ai-turizam-cg/web

# Pokreni Next.js dev server
npm run dev
```

**Očekivani output:**
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 5.3. Testiraj aplikaciju

1. Otvori browser: http://localhost:3000
2. Aplikacija bi trebala da se učita
3. Dozvoli pristup lokaciji kada browser zatraži
4. GPS bi trebao da se aktivira i prikaže mapu

## Korak 6: Pristup sa mobilnog telefona (opcionalno)

Ako želiš pristupiti aplikaciji sa telefona u istoj Wi-Fi mreži:

1. **Pronađi LAN IP adresu laptopa:**
   ```bash
   # Linux
   ip addr show | grep "inet " | grep -v 127.0.0.1
   
   # Ili
   hostname -I
   ```

2. **Na telefonu otvori:**
   ```
   http://<LAN-IP>:3000
   ```
   Primjer: `http://192.168.0.31:3000`

3. **Za HTTPS pristup (bolji GPS):**
   - Koristi Cloudflare Tunnel:
   ```bash
   # Instaliraj cloudflared (ako nije instaliran)
   # Ubuntu/Debian:
   # wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   # sudo dpkg -i cloudflared-linux-amd64.deb
   
   # Pokreni tunnel
   cloudflared tunnel --url http://localhost:3000
   ```
   - Cloudflare će dati HTTPS URL (npr. `https://xxxx.trycloudflare.com`)
   - Otvori taj URL na telefonu

## Korak 7: Ažuriranje projekta (kada napraviš izmjene)

```bash
# Uđi u folder projekta
cd ai-turizam-cg

# Preuzmi najnovije izmjene sa GitHub-a
git pull origin main

# Ako su dodane nove dependencies, reinstaliraj:
cd backend && npm install
cd ../web && npm install
```

## Korak 8: Push novih izmjena na GitHub

```bash
# Provjeri status
git status

# Dodaj izmijenjene fajlove
git add .

# Napravi commit
git commit -m "Opis izmjena"

# Push na GitHub
git push origin main
```

## Troubleshooting

### Problem: "npm: command not found"
**Rješenje:** Instaliraj Node.js (vidi Korak 2)

### Problem: "Port 3002 already in use"
**Rješenje:** 
```bash
# Pronađi proces koji koristi port 3002
sudo lsof -i :3002
# Ili
sudo netstat -tulpn | grep 3002

# Zaustavi proces
kill -9 <PID>
```

### Problem: "Port 3000 already in use"
**Rješenje:**
```bash
# Pronađi proces
sudo lsof -i :3000
# Zaustavi proces
kill -9 <PID>
```

### Problem: "Mapbox token nedostaje"
**Rješenje:** Provjeri da li si kreirao `web/.env.local` sa `NEXT_PUBLIC_MAPBOX_TOKEN`

### Problem: "Google Places API error"
**Rješenje:** Provjeri da li si kreirao `backend/.env` sa `GOOGLE_PLACES_API_KEY`

### Problem: "Cannot find module"
**Rješenje:** 
```bash
# Reinstaliraj dependencies
cd backend && rm -rf node_modules && npm install
cd ../web && rm -rf node_modules && npm install
```

## Sažetak - Brzi start

```bash
# 1. Kloniraj
git clone https://github.com/DinoLukac/ai-turizam-cg.git
cd ai-turizam-cg

# 2. Instaliraj dependencies
cd backend && npm install
cd ../web && npm install

# 3. Kreiraj .env fajlove (vidi Korak 4)

# 4. Pokreni backend (Terminal 1)
cd backend && npm run dev

# 5. Pokreni frontend (Terminal 2)
cd web && npm run dev

# 6. Otvori browser: http://localhost:3000
```

## Važne napomene

- ✅ `.env` fajlovi se **NE** push-uju na GitHub (sigurnost)
- ✅ `node_modules/` se **NE** push-uje (instalira se sa `npm install`)
- ✅ Uvijek provjeri da su oba servera pokrenuta (backend + frontend)
- ✅ Backend mora biti na portu 3002, frontend na portu 3000
- ✅ Za mobilni pristup, koristi LAN IP ili Cloudflare Tunnel

---

**Srećno kodiranje! 🚀**

