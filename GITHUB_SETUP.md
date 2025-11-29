# Instrukcije za postavljanje na GitHub

## Korak 1: Kreiraj novi repozitorijum na GitHub-u

1. Otvori https://github.com i uloguj se
2. Klikni na **"+"** u gornjem desnom uglu → **"New repository"**
3. Unesi:
   - **Repository name:** `ai-turizam-cg` (ili neki drugi naziv koji želiš)
   - **Description:** `AI Turizam CG - Smart Tourism Application with Mobile GPS Support`
   - **Visibility:** Public ili Private (kako želiš)
   - **NE** dodavaj README, .gitignore ili license (već postoje u projektu)
4. Klikni **"Create repository"**

## Korak 2: Poveži lokalni repozitorijum sa GitHub-om

Nakon što kreiraš repozitorijum, GitHub će ti pokazati instrukcije. Koristi ove komande:

```bash
cd "/home/dino/Projects/AI TURISAM CG"

# Dodaj remote (zamijeni DinoLukac sa svojim GitHub username-om i ai-turizam-cg sa nazivom repozitorijuma)
git remote add origin https://github.com/DinoLukac/ai-turizam-cg.git

# Ili ako koristiš SSH:
# git remote add origin git@github.com:DinoLukac/ai-turizam-cg.git

# Push-uj kod na GitHub
git push -u origin main
```

## Korak 3: Verifikacija

1. Otvori svoj GitHub profil: https://github.com/DinoLukac
2. Trebao bi vidjeti novi repozitorijum `ai-turizam-cg`
3. Klikni na njega i provjeri da su svi fajlovi tamo

## Korak 4: Preuzimanje na drugom laptopu

Na drugom laptopu:

```bash
# Kloniraj repozitorijum
git clone https://github.com/DinoLukac/ai-turizam-cg.git

# Ili sa SSH:
# git clone git@github.com:DinoLukac/ai-turizam-cg.git

# Uđi u folder
cd ai-turizam-cg

# Instaliraj dependencies
cd backend && npm install
cd ../web && npm install

# Kopiraj .env fajlove (ako ih imaš)
# cd ../backend && cp .env.example .env
# cd ../web && cp env.example .env

# Pokreni aplikaciju
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd web && npm run dev
```

## Napomene

- **NE** push-uj `.env` fajlove na GitHub (već su u .gitignore)
- Ako imaš API ključeve, dodaj ih u `.env` fajlove lokalno
- `node_modules/` folder se ne push-uje (već je u .gitignore)

## Ako imaš problema sa autentifikacijom

Ako GitHub traži username/password:

1. **Opcija 1:** Koristi Personal Access Token umjesto password-a
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Daj mu `repo` permisije
   - Koristi token kao password

2. **Opcija 2:** Postavi SSH ključ
   - Generiši SSH ključ: `ssh-keygen -t ed25519 -C "tvoj-email@example.com"`
   - Dodaj ga na GitHub: Settings → SSH and GPG keys → New SSH key
   - Koristi SSH URL umjesto HTTPS

