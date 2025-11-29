# 🔧 GPS Problemi - Rješenja

## Identifikovani Problemi

### 1. ❌ Hydration Error
**Problem:** Next.js hydration error zbog `<style>` taga u MapComponent koji se renderuje različito na serveru i klijentu.

**Rješenje:**
- ✅ Premješteno `@keyframes pulse` i `.custom-gps-marker` u `globals.css`
- ✅ Uklonjen `dangerouslySetInnerHTML` style tag iz komponente
- ✅ Style se sada učitava globalno i ne uzrokuje hydration mismatch

### 2. ⏱️ GPS Timeout
**Problem:** Geolocation API timeout (12-15s) je prekratak za neke uređaje, posebno kada GPS nije odmah dostupan.

**Rješenja:**
- ✅ Povećan timeout sa 12s/15s na **30 sekundi** za sve geolocation pozive
- ✅ Dodat `maximumAge: 60000` (1 minut) - dozvoljava korišćenje cache-ovane lokacije
- ✅ Dodata provjera permissions prije poziva geolocation API-ja
- ✅ Poboljšane error poruke sa detaljnim objašnjenjima

## Promjene u Kodu

### `web/app/globals.css`
```css
/* GPS Marker Pulse Animation */
@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.4;
  }
  50% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

.custom-gps-marker {
  position: relative;
}
```

### `web/components/MapComponent.tsx`
- ✅ Timeout: `12000ms` → `30000ms` (30s)
- ✅ Timeout: `15000ms` → `30000ms` (30s)
- ✅ `maximumAge: 0` → `maximumAge: 60000` (1 minut cache)
- ✅ Dodata async permissions provjera
- ✅ Uklonjen `<style dangerouslySetInnerHTML>` tag

## Kako Testirati

1. **Otvori aplikaciju:** http://localhost:3000
2. **Dozvoli pristup lokaciji** kada browser zatraži
3. **Sačekaj do 30 sekundi** - GPS može da traje duže na prvom pozivu
4. **Proveri konzolu** (F12) za detaljne log poruke

## Očekivano Ponašanje

- ✅ **Nema hydration error-a** - aplikacija se učitava bez greške
- ✅ **GPS timeout je 30s** - više vremena za "zaključavanje"
- ✅ **Cache lokacije** - koristi cache-ovanu lokaciju ako je stara manje od 1 minuta
- ✅ **Bolje error poruke** - jasno objašnjenje šta je problem

## Troubleshooting

### Ako i dalje vidiš timeout:
1. Proveri da li je GPS uključen na uređaju (mobilni)
2. Proveri browser permissions za lokaciju
3. Pokušaj na otvorenom prostoru (GPS ne radi dobro u zatvorenom)
4. Koristi mobilni uređaj umjesto desktop-a (desktop nema GPS)

### Ako vidiš hydration error:
1. Obriši `.next` folder: `rm -rf web/.next`
2. Restartuj server
3. Hard refresh browsera (Ctrl+Shift+R)

