export interface Poi {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  address?: string
  rating?: number
  userRatingsTotal?: number
  types: string[]
  openNow?: boolean
  photoReference?: string
  icon?: string
  distanceMeters: number
  score: number
  provider: 'google' | 'osm'
}

export interface PoiZone {
  id: string
  name: string
  centroid: {
    lat: number
    lng: number
  }
  radiusMeters: number
  poiIds: string[]
  score: number
}

export interface PoiApiResponse {
  pois: Poi[]
  highlight: Poi | null
  count: number
}

