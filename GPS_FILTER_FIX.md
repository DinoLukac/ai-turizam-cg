# 🔧 GPS Filter Fix - Rješenje Problema "Stalno Podgorica"

## Identifikovani Problem

**Simptom:** Mapa se uvek centrira na Podgoricu i ne prikazuje stvarnu GPS lokaciju.

**Uzroci:**
1. ❌ Previše strog filter tačnosti (`accuracy < 100m`) - blokira lokacije sa lošom tačnošću
2. ❌ Mapa se centrira na Podgoricu pri inicijalizaciji i ostaje tamo ako GPS failuje
3. ❌ Desktop/laptop bez GPS-a dobija IP-baziranu lokaciju sa tačnošću >100m, pa je blokirana
4. ❌ Nema fallback mehanizma - ako geolocation failuje, ostaje default centar

## Implementirana Rješenja

### 1. ✅ Uklonjen Filter Tačnosti
**Prije:** Prihvatam samo lokacije sa `accuracy < 100m`
```typescript
if (accuracy && accuracy < 100) {
  // update location
}
```

**Sada:** Prihvatam BILO KAKVU lokaciju, bez obzira na tačnost
```typescript
// Accept ANY location, regardless of accuracy
setUserLocation(location)
setLocationAccuracy(accuracy || null)
```

### 2. ✅ Dinamički Zoom Baziran na Tačnosti
**Prije:** Fiksni zoom level 16

**Sada:** Zoom se prilagođava tačnosti:
- `accuracy < 50m` → zoom 16 (vrlo blizu)
- `accuracy < 100m` → zoom 15 (blizu)
- `accuracy < 500m` → zoom 14 (srednje)
- `accuracy < 1000m` → zoom 13 (široko)
- `accuracy >= 1000m` → zoom 12 (vrlo široko)

### 3. ✅ Indikator Tačnosti
Dodat prikaz tačnosti u GPS status badge-u:
- `🎯 Tačnost: Xm` - za accuracy < 50m (odlično)
- `✓ Tačnost: Xm` - za accuracy < 100m (dobro)
- `~ Tačnost: Xm (približna)` - za accuracy >= 100m (približna)

### 4. ✅ Poboljšan Error Handling
- Ne postavlja se error status ako već imamo lokaciju
- Ne prikazuje se error poruka ako imamo bilo kakvu lokaciju
- Fallback mehanizam pokušava direktnu geolokaciju sa prihvaćanjem bilo koje tačnosti

### 5. ✅ Širi Početni Zoom
**Prije:** Početni zoom 13 (centrirano na Podgoricu)

**Sada:** Početni zoom 8 (širi pregled Crne Gore) - ne daje utisak da je "našao" Podgoricu

## Promjene u Kodu

### `web/components/MapComponent.tsx`

1. **Dodat state za tracking:**
   - `locationAccuracy` - čuva tačnost lokacije
   - `hasLocation` - flag da li smo ikad dobili lokaciju

2. **Uklonjen filter:**
   ```typescript
   // PRIJE:
   if (accuracy && accuracy < 100) { ... }
   
   // SADA:
   // Accept ANY location, regardless of accuracy
   setUserLocation(location)
   ```

3. **Dinamički zoom:**
   ```typescript
   let zoom = 12 // Default for poor accuracy
   if (accuracy) {
     if (accuracy < 50) zoom = 16
     else if (accuracy < 100) zoom = 15
     else if (accuracy < 500) zoom = 14
     else if (accuracy < 1000) zoom = 13
   }
   ```

4. **Poboljšan error handling:**
   - Ne prikazuje error ako već imamo lokaciju
   - Fallback pokušava direktnu geolokaciju sa prihvaćanjem bilo koje tačnosti

## Očekivano Ponašanje

### Desktop/Laptop (bez GPS-a):
- ✅ Prihvata IP-baziranu lokaciju (tačnost 100-5000m)
- ✅ Prikazuje lokaciju sa indikatorom "~ Tačnost: Xm (približna)"
- ✅ Koristi širi zoom (12-13) za lošu tačnost
- ✅ Ne ostaje na Podgorici

### Mobilni (sa GPS-om):
- ✅ Prihvata GPS lokaciju (tačnost 3-50m)
- ✅ Prikazuje lokaciju sa indikatorom "🎯 Tačnost: Xm"
- ✅ Koristi bliži zoom (15-16) za dobru tačnost
- ✅ Ažurira se kontinuirano kroz watchPosition

### Ako GPS failuje:
- ✅ Pokušava direktnu geolokaciju kao fallback
- ✅ Prihvaća bilo koju lokaciju, čak i sa lošom tačnošću
- ✅ Ne ostaje na Podgorici - koristi poslednju poznatu lokaciju ili širi pregled

## Testiranje

1. **Desktop test:**
   - Otvori http://localhost:3000
   - Dozvoli pristup lokaciji
   - Trebao bi vidjeti IP-baziranu lokaciju (možda nekoliko km off)
   - Status: "✅ GPS Aktivan" + "~ Tačnost: Xm (približna)"

2. **Mobilni test:**
   - Otvori na telefonu sa GPS-om
   - Dozvoli "precise" lokaciju
   - Trebao bi vidjeti tačnu GPS lokaciju
   - Status: "✅ GPS Aktivan" + "🎯 Tačnost: Xm"

3. **Error test:**
   - Odbij dozvolu za lokaciju
   - Trebao bi vidjeti error poruku + "Pokušaj Ponovo" dugme
   - Mapa ne bi trebala biti centrirana na Podgoricu

## Rezultat

✅ **Nema više "stalno Podgorica" problema**
✅ **Prihvaća bilo koju lokaciju, bez obzira na tačnost**
✅ **Dinamički zoom prilagođen tačnosti**
✅ **Jasni indikatori tačnosti za korisnika**
✅ **Bolji fallback mehanizmi**

