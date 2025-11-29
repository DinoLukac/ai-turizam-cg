# Faza 2 – POI i Turističke Zone

## 1. Izvori podataka
- **Primarni:** Google Places Nearby Search (tipovi: `tourist_attraction`, `museum`, `art_gallery`, `park`, `church`, `hindu_temple`, `mosque`, `synagogue`, `zoo`, `amusement_park`, `restaurant` za kulinarske must-see tačke)
- **Sekundarni / fallback:** OpenStreetMap (Overpass API) – koristi se ako Google Places ne vrati rezultate ili premašimo quota
- **Vrijeme / vremenske prilike:** postojeći Weather API (koristi se kasnije za dnevne preporuke)

## 2. Model podataka (API-driven)
```ts
interface RawPlaceSource {
  provider: 'google' | 'osm'
  id: string
  name: string
  location: { lat: number; lng: number }
  address?: string
  rating?: number
  userRatingsTotal?: number
  types: string[]
  photos?: string[]
  openingHours?: { openNow?: boolean }
}

interface NormalizedPoi extends RawPlaceSource {
  distanceMeters: number
  score: number       // kombinacija rating + broja recenzija + penal za udaljenost
  relevanceTags: string[]
}

interface PoiZone {
  id: string
  name: string
  centroid: { lat: number; lng: number }
  radiusMeters: number
  poiIds: string[]
  topPoiId: string
  score: number       // agregatni skor klastera
}
```

## 3. Pipeline
1. **Ulaz:** korisnikova lokacija (`lat`, `lng`), jezik (`language`), poluprečnik (`radius`, default 5 km)
2. **Fetch:**
   - Google Places API (Nearby Search) sa `rankby=prominence` + `type` filteri
   - Ako nema rezultata → fallback na OSM Overpass upit sa istim tipovima
3. **Normalizacija:**
   - Projekcija na `NormalizedPoi`
   - Izračun distance (Haversine)
   - Izračun `score = (rating || 4) * 1.5 + log1p(userRatingsTotal) - distanceKm * 0.1`
4. **Filtriranje:**
   - Opcionalno ukloniti duplikate (isti naziv + ~50m)
   - Minimalni prag: rating ≥ 3.5 ili `userRatingsTotal ≥ 50`
5. **Grupisanje (mikrozone):**
   - DBSCAN / Supercluster (Mapbox cluster) nad geo-tačkama
   - Parametri: `eps` ≈ 250m, `min_samples = 2`
   - Za svaku zonu: ime = najbolji POI u klasteru ili geografski label (npr. naziv naselja iz reverse geocodinga u narednoj fazi)
6. **Izlaz backend-a:**
   ```json
   {
     "pois": NormalizedPoi[],
     "zones": PoiZone[],
     "highlight": NormalizedPoi // najbolja "dnevna tačka"
   }
   ```

## 4. Frontend prikaz
- Mapbox source sa `cluster: true` (interno koristi Supercluster)
- Boje/ikonice po kategoriji (kulturno, priroda, hrana)
- "Dnevna tačka" = najviši `score`, prikazana većim markerom + kartica u panelu
- SidePanel prikazuje:
  - Najbolju zonu + opis
  - Listu POI-a (sortirano po skoru) sa distancom i ocjenom
  - Dugme za osvježavanje / promjenu radijusa

## 5. AI integracija (sledeći korak)
- Kada imamo zone + POI, šaljemo u LLM prompt da generiše narativni opis, preporučeni redosled posjeta, slike
- Model dobija `currentLocation`, `pois`, `weather`, `userProfile`

## 6. Sledeći razvojni koraci
1. [Backend] `GET /api/poi/nearby` (Google Places + normalizacija + score)
2. [Backend] Haversine util + fallback struktura za OSM
3. [Frontend] Poziv API-ja nakon GPS lock-a, Mapbox source sa cluster layer-ima
4. [Frontend] SidePanel prikaz POI + zona + "dnevna tačka"
5. [Testiranje] logovi + mock lokacija (npr. Podgorica, Kotor, Budva)