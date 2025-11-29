import axios from 'axios'
import { haversineDistanceMeters } from '../utils/haversine'

export interface NormalizedPoi {
  id: string
  name: string
  location: { lat: number; lng: number }
  address?: string
  rating?: number
  userRatingsTotal?: number
  types: string[]
  openNow?: boolean
  photoReference?: string
  icon?: string
  distanceMeters: number
  score: number
  provider: 'google'
}

const GOOGLE_PLACES_BASE_URL =
  'https://maps.googleapis.com/maps/api/place/nearbysearch/json'

const DEFAULT_TYPES = [
  'tourist_attraction',
  'museum',
  'art_gallery',
  'park',
  'church',
  'hindu_temple',
  'mosque',
  'synagogue',
  'zoo',
  'amusement_park'
]

interface NearbySearchParams {
  lat: number
  lng: number
  radius: number
  language?: string
  keyword?: string
}

export async function fetchNearbyPlaces({
  lat,
  lng,
  radius,
  language = 'en',
  keyword
}: NearbySearchParams): Promise<{
  pois: NormalizedPoi[]
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not configured')
  }

  // Google Places API doesn't support multiple types with | separator
  // We'll make multiple requests for different types and combine results
  const allPlaces: any[] = []
  
  try {
    // Fetch places for each type separately
    for (const type of DEFAULT_TYPES) {
      const params = {
        key: apiKey,
        location: `${lat},${lng}`,
        radius,
        language,
        type,
        keyword
      }

      console.log(`🔍 Fetching Google Places for type: ${type}`)
      const response = await axios.get(GOOGLE_PLACES_BASE_URL, { params })
      const data = response.data

      if (data.status === 'OK' && data.results) {
        allPlaces.push(...data.results)
        console.log(`  ✅ Found ${data.results.length} places for ${type}`)
      } else if (data.status !== 'ZERO_RESULTS') {
        console.error(`  ⚠️ Google Places API error for ${type}:`, data.status, data.error_message)
      }
    }

    // Remove duplicates by place_id
    const uniquePlaces = Array.from(
      new Map(allPlaces.map((place) => [place.place_id, place])).values()
    )

    console.log(`📊 Total unique places found: ${uniquePlaces.length}`)

    const places: NormalizedPoi[] = uniquePlaces
      .map((place: any) => normalizePlace(place, lat, lng))
      .filter(Boolean) as NormalizedPoi[]

    return { pois: places }
  } catch (error: any) {
    console.error('Failed to fetch Google Places:', error.message)
    throw error
  }
}

function normalizePlace(place: any, originLat: number, originLng: number): NormalizedPoi | null {
  if (!place.geometry?.location) {
    return null
  }

  const lat = place.geometry.location.lat
  const lng = place.geometry.location.lng

  const distanceMeters = haversineDistanceMeters(originLat, originLng, lat, lng)

  const rating = place.rating ?? null
  const userRatingsTotal = place.user_ratings_total ?? null

  const score =
    (rating ?? 4) * 1.5 +
    Math.log1p(userRatingsTotal ?? 10) -
    distanceMeters / 10000 // penalize distance lightly

  return {
    id: place.place_id,
    name: place.name,
    location: { lat, lng },
    address: place.vicinity || place.formatted_address,
    rating: rating || undefined,
    userRatingsTotal: userRatingsTotal || undefined,
    types: place.types || [],
    openNow: place.opening_hours?.open_now,
    photoReference: place.photos?.[0]?.photo_reference,
    icon: place.icon,
    distanceMeters,
    score,
    provider: 'google'
  }
}

