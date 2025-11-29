#!/bin/bash

# Script za pokretanje Next.js development servera sa live output-om

echo "🚀 Pokretanje Next.js development servera..."
echo "📍 Server će biti dostupan na: http://localhost:3000"
echo ""
echo "Za zaustavljanje pritisni Ctrl+C"
echo ""

cd "$(dirname "$0")/web"

# Proveri da li je port 3000 zauzet
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 je zauzet. Zaustavljam postojeći proces..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Obriši .next keš
if [ -d ".next" ]; then
    echo "🧹 Brisanje Next.js keša..."
    rm -rf .next
fi

# Pokreni server
echo "✅ Pokretanje servera..."
npm run dev

