# 🚀 Instrukcije za Pokretanje Servera u Live Terminalu

## Opcija 1: Koristi Script (Preporučeno)

```bash
cd "/home/dino/Projects/AI TURISAM CG"
./START_SERVER.sh
```

## Opcija 2: Ručno Pokretanje

```bash
# 1. Idi u web direktorijum
cd "/home/dino/Projects/AI TURISAM CG/web"

# 2. Zaustavi postojeći proces (ako postoji)
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 3. Obriši keš
rm -rf .next

# 4. Pokreni server (LIVE output u terminalu)
npm run dev
```

## Šta ćeš videti u terminalu:

```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- Ready in 2.3s
```

## Kada vidiš "Ready", otvori browser:

🌐 **http://localhost:3000**

## Za zaustavljanje:

Pritisni **Ctrl+C** u terminalu gde je server pokrenut.

---

## ✅ Server je sada LIVE i radi!

Ako vidiš 404 grešku u browseru:
1. Proveri da li je server pokrenut (trebao bi videti "Ready" u terminalu)
2. Osveži stranicu (Ctrl+R ili F5)
3. Proveri konzolu u browseru (F12) za greške

