import { PoiApiResponse } from '@/types/poi'

// Use relative path - Next.js rewrites will proxy to backend
// This works for both localhost:3000 and LAN IP:3000
const API_BASE = '/api'

interface FetchPoiParams {
  lat: number
  lng: number
  radius?: number
  language?: string
}

export async function fetchNearbyPoi({
  lat,
  lng,
  radius = 5000,
  language = 'bs'
}: FetchPoiParams): Promise<PoiApiResponse> {
  // Use relative URL - Next.js rewrites will handle proxying to backend
  const url = new URL(`${API_BASE}/poi/nearby`, window.location.origin)
  url.searchParams.set('lat', lat.toString())
  url.searchParams.set('lng', lng.toString())
  url.searchParams.set('radius', radius.toString())
  url.searchParams.set('language', language)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch POI: ${response.statusText}`)
  }

  return response.json()
}

