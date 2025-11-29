# 🚀 Brzi Start

## 1. Instaliraj Dependencies

```bash
# Web aplikacija
cd web
npm install
cd ..
```

## 2. Pokreni Web Aplikaciju

```bash
cd web
npm run dev
```

Aplikacija će biti dostupna na: **http://localhost:3000**

## 3. Testiranje

1. Otvori browser i idi na http://localhost:3000
2. Kada browser zatraži dozvolu za lokaciju, klikni **"Allow"**
3. Trebao bi se vidjeti:
   - ✅ Mapbox mapa
   - ✅ Plava tačka (GPS lokacija) sa pulsirajućom animacijom
   - ✅ Krug tačnosti oko lokacije
   - ✅ Lijevi panel (prazan za sada)

## Šta je Implementirano

✅ **Mapbox integracija** - Potpuna integracija sa Mapbox GL JS  
✅ **GPS lokacija** - 100% tačna lokacija koristeći browser geolocation API  
✅ **Plava tačka** - Custom marker sa pulsirajućom animacijom (kao Google Maps)  
✅ **Krug tačnosti** - Prikazuje koliko je tačna lokacija  
✅ **Lijevi panel** - Prazan panel spreman za buduće funkcionalnosti  
✅ **Responsive design** - Panel se može sakriti/prikazati  

## Sljedeći Koraci

- [ ] POI (Points of Interest) integracija
- [ ] Google Places API integracija
- [ ] AI generisanje turističkih vodiča
- [ ] Dnevni planovi
- [ ] Navigacija i rute

