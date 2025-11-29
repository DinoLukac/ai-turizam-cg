'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import Supercluster from 'supercluster'
import { fetchNearbyPoi } from '@/lib/poiApi'
import type { Poi, PoiZone } from '@/types/poi'
import 'mapbox-gl/dist/mapbox-gl.css'

export interface PoiUpdatePayload {
  pois?: Poi[]
  highlight?: Poi | null
  zones?: PoiZone[]
  loading?: boolean
  error?: string | null
}

interface MapComponentProps {
  onPoiUpdate?: (payload: PoiUpdatePayload) => void
}

export default function MapComponent({ onPoiUpdate }: MapComponentProps) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🗺️ MapComponent RENDERING')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  • onPoiUpdate:', typeof onPoiUpdate === 'function' ? 'provided' : 'not provided')
  
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const geolocateControl = useRef<mapboxgl.GeolocateControl | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'acquiring' | 'active' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [showManualTrigger, setShowManualTrigger] = useState(false)
  const [hasLocation, setHasLocation] = useState(false) // Track if we ever got a location
  const [poiData, setPoiData] = useState<Poi[]>([])
  const [poiZones, setPoiZones] = useState<PoiZone[]>([])
  const [highlightPoi, setHighlightPoi] = useState<Poi | null>(null)
  const [poiLoading, setPoiLoading] = useState(false)
  const [poiError, setPoiError] = useState<string | null>(null)
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([])
  const lastPoiFetchRef = useRef<[number, number] | null>(null)
  const hasLocationRef = useRef(hasLocation)
  const userLocationRef = useRef<[number, number] | null>(null)
  const gpsStatusRef = useRef(gpsStatus)

  const clearPoiMarkers = useCallback(() => {
    poiMarkersRef.current.forEach(marker => marker.remove())
    poiMarkersRef.current = []
  }, [])

  const renderPoiMarkers = useCallback(
    (pois: Poi[], highlightId?: string) => {
      if (!map.current) return
      clearPoiMarkers()

      const markers = pois.slice(0, 100).map(poi => {
        const el = document.createElement('div')
        el.className = `poi-marker${highlightId === poi.id ? ' poi-marker--highlight' : ''}`
        el.title = `${poi.name}${poi.rating ? ` (${poi.rating.toFixed(1)})` : ''}`
        return new mapboxgl.Marker(el)
          .setLngLat([poi.location.lng, poi.location.lat])
          .addTo(map.current as mapboxgl.Map)
      })

      poiMarkersRef.current = markers
    },
    [clearPoiMarkers]
  )

  const buildZones = useCallback(
    (pois: Poi[]): PoiZone[] => {
      if (!pois.length) {
        return []
      }

      const cluster = new Supercluster<{
        id: string
        score: number
        name: string
      }>({
        radius: 80,
        maxZoom: 17,
        minPoints: 2
      })

      const features = pois.map(poi => ({
        type: 'Feature',
        properties: {
          id: poi.id,
          score: poi.score,
          name: poi.name
        },
        geometry: {
          type: 'Point',
          coordinates: [poi.location.lng, poi.location.lat]
        }
      }))

      cluster.load(features as any)

      const zoom = Math.round(map.current?.getZoom() ?? 12)
      const clusters = cluster.getClusters([-180, -85, 180, 85], zoom)
      const zones: PoiZone[] = []

      clusters.forEach((feature: any) => {
        if (!feature.properties?.cluster) return
        const clusterId = feature.properties.cluster_id
        const leaves = cluster.getLeaves(clusterId, 100)
        if (!leaves.length) return

        const centroid = {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0]
        }

        let radiusMeters = 0
        const poiIds: string[] = []
        let topLeaf = leaves[0]

        leaves.forEach((leaf: any) => {
          poiIds.push(leaf.properties.id)
          if (leaf.properties.score > topLeaf.properties.score) {
            topLeaf = leaf
          }
          const coords = leaf.geometry.coordinates
          const leafDist = haversineDistanceMeters(
            centroid.lat,
            centroid.lng,
            coords[1],
            coords[0]
          )
          radiusMeters = Math.max(radiusMeters, leafDist)
        })

        zones.push({
          id: `zone_${clusterId}`,
          name: topLeaf.properties.name,
          centroid,
          radiusMeters: Math.max(radiusMeters, 150),
          poiIds,
          score:
            leaves.reduce((sum: number, leaf: any) => sum + leaf.properties.score, 0) /
            leaves.length
        })
      })

      return zones
    },
    []
  )

  const fetchPoisForLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!isMapReady) {
        console.log('⚠️ Map not ready, skipping POI fetch')
        return
      }
      
      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🛰️ Fetching POI for location')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📍 Location:', { lat, lng })
        console.log('  • Radius: 5000m')
        console.log('  • Language: bs')
        console.log('  • API Endpoint: /api/poi/nearby (proxied via Next.js to backend)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        setPoiLoading(true)
        setPoiError(null)
        onPoiUpdate?.({ loading: true })

        console.log('📡 Calling fetchNearbyPoi...')
        const startTime = Date.now()
        
        const response = await fetchNearbyPoi({
          lat,
          lng,
          radius: 5000,
          language: 'bs'
        })

        const duration = Date.now() - startTime
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ POI fetch successful!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('  • Duration:', duration, 'ms')
        console.log('  • POI count:', response.pois?.length || 0)
        console.log('  • Highlight:', response.highlight?.name || 'none')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        if (response.pois && response.pois.length > 0) {
          console.log('📍 First 3 POIs:')
          response.pois.slice(0, 3).forEach((poi, idx) => {
            console.log(`  ${idx + 1}. ${poi.name} - ${poi.distanceMeters.toFixed(0)}m - Score: ${poi.score.toFixed(2)}`)
          })
        }

        setPoiData(response.pois || [])
        setHighlightPoi(response.highlight || null)

        if (response.pois && response.pois.length > 0) {
          console.log('🎨 Rendering POI markers...')
          renderPoiMarkers(response.pois, response.highlight?.id)
          console.log('✅ POI markers rendered')

          console.log('🗺️ Building zones...')
          const zones = buildZones(response.pois)
          console.log('  • Zones created:', zones.length)
          setPoiZones(zones)
        } else {
          console.log('⚠️ No POIs to render')
          clearPoiMarkers()
          setPoiZones([])
        }

        setPoiLoading(false)
        onPoiUpdate?.({
          pois: response.pois || [],
          highlight: response.highlight || null,
          zones: response.pois && response.pois.length > 0 ? buildZones(response.pois) : [],
          loading: false,
          error: null
        })
        console.log('✅ POI update complete')
      } catch (error: any) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('❌ Failed to fetch POI')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('Error Type:', error?.constructor?.name || typeof error)
        console.error('Error Message:', error?.message || String(error))
        console.error('Error Stack:', error?.stack || 'No stack')
        console.error('Full Error:', error)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        const message = error?.message || 'Neuspješno učitavanje POI podataka'
        setPoiError(message)
        setPoiLoading(false)
        onPoiUpdate?.({ error: message, loading: false })
      }
    },
    [buildZones, isMapReady, onPoiUpdate, renderPoiMarkers, clearPoiMarkers]
  )

  // Log state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('📊 STATE CHANGE - gpsStatus:', gpsStatus)
    gpsStatusRef.current = gpsStatus
  }, [gpsStatus])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (userLocation) {
      console.log('📊 STATE CHANGE - userLocation:', userLocation)
    }
    userLocationRef.current = userLocation
  }, [userLocation])

  useEffect(() => {
    if (locationAccuracy !== null) {
      console.log('📊 STATE CHANGE - locationAccuracy:', locationAccuracy, 'm')
    }
  }, [locationAccuracy])

  useEffect(() => {
    console.log('📊 STATE CHANGE - hasLocation:', hasLocation)
    hasLocationRef.current = hasLocation
  }, [hasLocation])

  useEffect(() => {
    if (errorMessage) {
      console.log('📊 STATE CHANGE - errorMessage:', errorMessage)
    }
  }, [errorMessage])

  useEffect(() => {
    console.log('📊 STATE CHANGE - poiLoading:', poiLoading)
  }, [poiLoading])

  useEffect(() => {
    if (poiData.length) {
      console.log(`📊 STATE CHANGE - poiData (${poiData.length} tačaka)`)
    }
  }, [poiData])

  useEffect(() => {
    if (highlightPoi) {
      console.log('📊 STATE CHANGE - highlightPoi:', highlightPoi.name, highlightPoi.score)
    }
  }, [highlightPoi])

  useEffect(() => {
    if (poiZones.length) {
      console.log(`📊 STATE CHANGE - poiZones (${poiZones.length})`)
    }
  }, [poiZones])

  useEffect(() => {
    if (poiError) {
      console.log('📊 STATE CHANGE - poiError:', poiError)
    }
  }, [poiError])

  // Check if geolocation is available
  const isGeolocationAvailable = typeof navigator !== 'undefined' && 'geolocation' in navigator

  // Secure origin check - moved to state to avoid hydration issues
  const [isSecureOrigin, setIsSecureOrigin] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Check secure origin on mount (client-side only)
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const protocol = window.location.protocol
      
      // Check for secure origin: HTTPS, localhost, or Cloudflare Tunnel
      const isSecure = 
        protocol === 'https:' ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        // Cloudflare Tunnel domains
        hostname.endsWith('.trycloudflare.com') ||
        // Allow LAN IPs (private IP ranges) for development
        /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)\d+\.\d+$/.test(hostname)
      
      setIsSecureOrigin(isSecure)
    }
  }, [])

  // Initial component mount logging (client-side only)
  useEffect(() => {
    if (!isMounted) return
    
    const geolocationAvailable =
      typeof navigator !== 'undefined' && 'geolocation' in navigator
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📍 MapComponent MOUNTED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 Environment Check:')
    console.log('  • Geolocation available:', geolocationAvailable)
    console.log('  • Secure origin:', isSecureOrigin)
    console.log('  • Protocol:', typeof window !== 'undefined' ? window.location.protocol : 'N/A')
    console.log('  • Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A')
    console.log('  • User Agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }, [isMounted, isSecureOrigin])

  // Direct geolocation fallback (if Mapbox control fails)
  const requestLocationDirectly = useCallback(async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔄 requestLocationDirectly() CALLED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      if (!isGeolocationAvailable) {
        console.error('❌ Geolocation NOT available in this browser')
        setGpsStatus('error')
        setErrorMessage('Geolokacija nije podržana u ovom browseru')
        return
      }

    console.log('✅ Geolocation is available, checking permissions...')

    // Check permissions first (if available)
    if ('permissions' in navigator) {
      try {
        console.log('🔐 Checking permissions API...')
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        console.log('🔐 Permission state:', permission.state)
        
        if (permission.state === 'denied') {
          console.error('❌ Permission DENIED - user has permanently denied location access')
          setGpsStatus('error')
          setErrorMessage('GPS greška: Dozvola za lokaciju je trajno odbijena. Molimo omogućite pristup lokaciji u browser postavkama.')
          setShowManualTrigger(true)
          return
        }
        
        if (permission.state === 'prompt') {
          console.log('⚠️ Permission PROMPT - user will be asked')
        }
        
        if (permission.state === 'granted') {
          console.log('✅ Permission GRANTED - location access allowed')
        }
      } catch (e) {
        // Permissions API not fully supported, continue anyway
        console.warn('⚠️ Permissions API not available:', e)
      }
    } else {
      console.log('⚠️ Permissions API not supported, proceeding anyway...')
    }

    console.log('📍 Calling navigator.geolocation.getCurrentPosition()...')
    console.log('  • enableHighAccuracy: true')
    console.log('  • maximumAge: 60000ms (1 minute)')
    console.log('  • timeout: 30000ms (30 seconds)')
    
    setGpsStatus('acquiring')
    setErrorMessage('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords
        const location: [number, number] = [longitude, latitude]
        const timestamp = position.timestamp
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ GPS Location acquired (direct getCurrentPosition)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📍 Coordinates:')
        console.log('  • Latitude:', latitude)
        console.log('  • Longitude:', longitude)
        console.log('  • Location array:', location)
        console.log('')
        console.log('🎯 Accuracy:')
        console.log('  • Accuracy:', accuracy !== null ? `${accuracy.toFixed(2)}m` : 'null/unknown')
        console.log('  • Quality:', accuracy ? (accuracy < 50 ? 'EXCELLENT' : accuracy < 100 ? 'GOOD' : accuracy < 1000 ? 'FAIR' : 'POOR') : 'UNKNOWN')
        console.log('')
        console.log('📊 Additional Data:')
        console.log('  • Altitude:', altitude !== null ? `${altitude.toFixed(2)}m` : 'null')
        console.log('  • Altitude Accuracy:', altitudeAccuracy !== null ? `${altitudeAccuracy.toFixed(2)}m` : 'null')
        console.log('  • Heading:', heading !== null ? `${heading.toFixed(2)}°` : 'null')
        console.log('  • Speed:', speed !== null ? `${speed.toFixed(2)}m/s` : 'null')
        console.log('  • Timestamp:', new Date(timestamp).toISOString())
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        setUserLocation(location)
        setLocationAccuracy(accuracy || null)
        setHasLocation(true)
        setGpsStatus('active')
        setErrorMessage('')
        setShowManualTrigger(false)

        // Update map - adjust zoom based on accuracy
        if (map.current) {
          let zoom = 12 // Default for poor accuracy
          if (accuracy) {
            if (accuracy < 50) zoom = 16
            else if (accuracy < 100) zoom = 15
            else if (accuracy < 500) zoom = 14
            else if (accuracy < 1000) zoom = 13
          }

          console.log('🗺️ Updating map:')
          console.log('  • Center:', location)
          console.log('  • Zoom:', zoom, '(based on accuracy:', accuracy ? `${accuracy.toFixed(1)}m` : 'unknown', ')')
          
          map.current.flyTo({
            center: location,
            zoom: zoom,
            duration: 2000
          })
          
          console.log('✅ Map updated successfully')

          // Add custom marker
          const existingMarker = document.querySelector('.custom-gps-marker')
          if (existingMarker) {
            existingMarker.remove()
          }

          const el = document.createElement('div')
          el.className = 'custom-gps-marker'
          el.style.width = '20px'
          el.style.height = '20px'
          el.style.borderRadius = '50%'
          el.style.backgroundColor = '#4285F4'
          el.style.border = '3px solid white'
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
          el.style.cursor = 'pointer'

          // Add pulsing animation
          const pulse = document.createElement('div')
          pulse.style.position = 'absolute'
          pulse.style.width = '20px'
          pulse.style.height = '20px'
          pulse.style.borderRadius = '50%'
          pulse.style.backgroundColor = '#4285F4'
          pulse.style.opacity = '0.4'
          pulse.style.animation = 'pulse 2s infinite'
          pulse.style.transform = 'translate(-50%, -50%)'
          pulse.style.left = '50%'
          pulse.style.top = '50%'
          el.appendChild(pulse)

          new mapboxgl.Marker(el)
            .setLngLat(location)
            .addTo(map.current)
        }
      },
      (error) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('❌ Direct geolocation ERROR')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('Error Code:', error.code)
        console.error('Error Message:', error.message)
        console.error('Full Error Object:', error)
        console.log('')
        console.log('Error Code Meanings:')
        console.log('  • 1 = PERMISSION_DENIED - User denied location access')
        console.log('  • 2 = POSITION_UNAVAILABLE - Location unavailable')
        console.log('  • 3 = TIMEOUT - Request timed out')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        setGpsStatus('error')
        
        let message = 'GPS greška: '
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error('❌ PERMISSION_DENIED - User denied location access')
            message += 'Dozvola za lokaciju je odbijena. Molimo dozvolite pristup lokaciji u browser postavkama.'
            break
          case error.POSITION_UNAVAILABLE:
            console.error('❌ POSITION_UNAVAILABLE - Location unavailable (GPS off or no signal)')
            message += 'Lokacija nije dostupna. Proverite da li je GPS uključen.'
            break
          case error.TIMEOUT:
            console.error('❌ TIMEOUT - Request timed out after 30 seconds')
            message += 'Zahtev za lokaciju je istekao (30s). Možda GPS nije dostupan ili je signal slab. Pokušajte ponovo ili koristite Wi-Fi triangulaciju.'
            break
          default:
            console.error('❌ UNKNOWN ERROR:', error.message)
            message += error.message || 'Nepoznata greška'
        }
        
        setErrorMessage(message)
        setShowManualTrigger(true)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000, // Allow cached position up to 1 minute old
        timeout: 30000 // Increased from 15s to 30s
      }
    )
    } catch (error: any) {
      console.error('❌ Error in requestLocationDirectly:', error)
      setGpsStatus('error')
      setErrorMessage('Greška pri traženju lokacije. Pokušajte ponovo.')
      setShowManualTrigger(true)
    }
  }, [isGeolocationAvailable])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🗺️ Map Initialization useEffect TRIGGERED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (!mapContainer.current || map.current) {
      console.log('⚠️ Map container not ready or map already exists, skipping...')
      return
    }

    console.log('✅ Map container ready, initializing Mapbox...')

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!mapboxToken) {
      console.error('❌ Mapbox token is missing!')
      setGpsStatus('error')
      setErrorMessage('Mapbox token nedostaje')
      return
    }

    console.log('✅ Mapbox token found:', mapboxToken.substring(0, 20) + '...')
    mapboxgl.accessToken = mapboxToken

    // Initialize map - don't center on Podgorica, let GPS set the center
    // Start with a wider view of Montenegro
    console.log('🗺️ Creating Mapbox map instance...')
    console.log('  • Center:', [19.2594, 42.4304], '(Podgorica - initial only)')
    console.log('  • Zoom: 8 (wide view)')
    console.log('  • Style: mapbox://styles/mapbox/streets-v12')
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [19.2594, 42.4304], // Default: Podgorica (only as initial view)
      zoom: 8, // Wider zoom to show more area
      pitch: 0,
      bearing: 0
    })

    console.log('✅ Mapbox map instance created, waiting for load event...')

    map.current.on('load', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ Mapbox map LOADED successfully')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      setIsMapReady(true)
    })

    // Add navigation controls
    console.log('➕ Adding NavigationControl...')
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    console.log('✅ NavigationControl added')

    // Add GeolocateControl with high accuracy settings
    // Increased timeout to 30s for better reliability
    console.log('➕ Creating GeolocateControl...')
    console.log('  • enableHighAccuracy: true')
    console.log('  • maximumAge: 60000ms (1 minute cache)')
    console.log('  • timeout: 30000ms (30 seconds)')
    console.log('  • trackUserLocation: true')
    console.log('  • showAccuracyCircle: true')
    console.log('  • showUserHeading: true')
    
    geolocateControl.current = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        maximumAge: 60000, // Allow cached position up to 1 minute old
        timeout: 30000 // Increased from 12s to 30s
      },
      trackUserLocation: true,
      showAccuracyCircle: true,
      showUserHeading: true,
      fitBoundsOptions: {
        maxZoom: 16
      }
    })

    console.log('✅ GeolocateControl created, adding to map...')
    map.current.addControl(geolocateControl.current, 'top-right')
    console.log('✅ GeolocateControl added to map')

    // Handle geolocate events
    console.log('📡 Setting up GeolocateControl event listeners...')
    
    geolocateControl.current.on('geolocate', (e: any) => {
      const coords = e.coords || e
      const location: [number, number] = [coords.longitude, coords.latitude]
      const accuracy = coords.accuracy || null
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ GeolocateControl "geolocate" EVENT FIRED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📍 Coordinates:')
      console.log('  • Latitude:', coords.latitude)
      console.log('  • Longitude:', coords.longitude)
      console.log('  • Location array:', location)
      console.log('')
      console.log('🎯 Accuracy:', accuracy !== null ? `${accuracy.toFixed(2)}m` : 'null/unknown')
      console.log('  • Quality:', accuracy ? (accuracy < 50 ? 'EXCELLENT' : accuracy < 100 ? 'GOOD' : accuracy < 1000 ? 'FAIR' : 'POOR') : 'UNKNOWN')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      setUserLocation(location)
      setLocationAccuracy(accuracy)
      setHasLocation(true)
      setGpsStatus('active')
      setErrorMessage('')
      setShowManualTrigger(false)

      // Always update map center, regardless of accuracy
      if (map.current) {
        const zoom = accuracy && accuracy < 100 ? 16 : accuracy && accuracy < 1000 ? 14 : 12
        console.log('🗺️ Updating map center (from GeolocateControl):')
        console.log('  • Center:', location)
        console.log('  • Zoom:', zoom)
        map.current.flyTo({
          center: location,
          zoom: zoom,
          duration: 2000
        })
        console.log('✅ Map updated')
      }
    })
    
    console.log('✅ "geolocate" event listener registered')

    geolocateControl.current.on('error', (e: any) => {
      const error = e.error || e
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ GeolocateControl "error" EVENT FIRED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Error Code:', error.code)
      console.error('Error Message:', error.message)
      console.error('Full Error Object:', error)
      console.log('')
      console.log('Current State:')
      console.log('  • hasLocation:', hasLocationRef.current)
      console.log('  • userLocation:', userLocationRef.current)
      console.log('  • gpsStatus:', gpsStatusRef.current)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Don't set error status immediately - try fallback first
      // Only show error if we never got a location
      if (!hasLocationRef.current) {
        console.log('⚠️ No location yet, setting error status...')
        setGpsStatus('error')
      } else {
        console.log('✅ We already have a location, keeping current status')
      }
      
      let message = 'GPS greška: '
      if (error.code === 1 || error.message?.includes('denied')) {
        console.error('❌ PERMISSION_DENIED')
        message = 'Dozvola za lokaciju je odbijena. Kliknite na dugme ispod da pokušate ponovo.'
      } else if (error.message?.includes('secure origin') || error.message?.includes('Only secure origins')) {
        console.error('❌ SECURE_ORIGIN_REQUIRED')
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'unknown'
        message = 'Za GPS lokaciju potreban je HTTPS ili localhost. Trenutno: ' + protocol
      } else if (error.code === 2) {
        console.error('❌ POSITION_UNAVAILABLE')
        message = 'Lokacija nije dostupna. Proverite da li je GPS uključen.'
      } else if (error.code === 3) {
        console.error('❌ TIMEOUT')
        message = 'Zahtev za lokaciju je istekao (30s). Pokušajte ponovo ili prihvatite približnu lokaciju.'
      } else {
        console.error('❌ UNKNOWN ERROR')
        message = error.message || 'Nepoznata greška. Pokušajte direktno traženje lokacije.'
      }
      
      // Only show error message if we don't have any location
      if (!hasLocationRef.current) {
        console.log('⚠️ Setting error message and showing manual trigger button')
        setErrorMessage(message)
        setShowManualTrigger(true)
      } else {
        console.log('✅ Already have location, not showing error message')
      }
      
      // Try direct geolocation as fallback (with relaxed accuracy)
      if (isGeolocationAvailable) {
        console.log('🔄 Trying direct geolocation as fallback (accepting any accuracy)...')
        console.log('  • Will call requestLocationDirectly() in 1 second...')
        setTimeout(() => {
          console.log('⏰ Timeout expired, calling requestLocationDirectly() now...')
          requestLocationDirectly()
        }, 1000)
      } else {
        console.log('❌ Geolocation not available, cannot try fallback')
      }
    })
    
    console.log('✅ "error" event listener registered')

    geolocateControl.current.on('trackuserlocationstart', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔄 GeolocateControl "trackuserlocationstart" EVENT FIRED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📍 Started tracking user location')
      setGpsStatus('acquiring')
      setErrorMessage('')
    })
    
    console.log('✅ "trackuserlocationstart" event listener registered')

    geolocateControl.current.on('trackuserlocationend', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('⏸️ GeolocateControl "trackuserlocationend" EVENT FIRED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📍 Stopped tracking user location')
      setGpsStatus('idle')
    })
    
    console.log('✅ "trackuserlocationend" event listener registered')

    // Also use watchPosition as backup for continuous updates
    // REMOVED accuracy filter - accept any location, even with poor accuracy
    if (isGeolocationAvailable) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('👁️ Starting watchPosition (continuous location tracking)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('  • enableHighAccuracy: true')
      console.log('  • maximumAge: 0 (no cache)')
      console.log('  • timeout: 30000ms (30 seconds)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords
          const location: [number, number] = [longitude, latitude]
          const timestamp = position.timestamp
          
          // Accept ANY location, regardless of accuracy
          setUserLocation(location)
          setLocationAccuracy(accuracy || null)
          setHasLocation(true)

          const accuracyStr = accuracy ? `${accuracy.toFixed(1)}m` : 'unknown'
          const quality = accuracy ? (accuracy < 50 ? 'excellent' : accuracy < 100 ? 'good' : accuracy < 1000 ? 'fair' : 'poor') : 'unknown'
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log(`📍 watchPosition UPDATE (${quality.toUpperCase()})`)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('📍 Coordinates:')
          console.log('  • Latitude:', latitude)
          console.log('  • Longitude:', longitude)
          console.log('  • Location array:', location)
          console.log('')
          console.log('🎯 Accuracy:', accuracyStr, `(${quality})`)
          console.log('')
          console.log('📊 Additional Data:')
          console.log('  • Altitude:', altitude !== null ? `${altitude.toFixed(2)}m` : 'null')
          console.log('  • Altitude Accuracy:', altitudeAccuracy !== null ? `${altitudeAccuracy.toFixed(2)}m` : 'null')
          console.log('  • Heading:', heading !== null ? `${heading.toFixed(2)}°` : 'null')
          console.log('  • Speed:', speed !== null ? `${speed.toFixed(2)}m/s` : 'null')
          console.log('  • Timestamp:', new Date(timestamp).toISOString())
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

          // Update map center - adjust zoom based on accuracy
          if (map.current) {
            let zoom = 12 // Default for poor accuracy
            if (accuracy) {
              if (accuracy < 50) zoom = 16
              else if (accuracy < 100) zoom = 15
              else if (accuracy < 500) zoom = 14
              else if (accuracy < 1000) zoom = 13
            }

            map.current.flyTo({
              center: location,
              zoom: zoom,
              duration: 1000
            })
          }
        },
        (error) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.warn('⚠️ watchPosition ERROR')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.warn('Error Code:', error.code)
          console.warn('Error Message:', error.message)
          console.warn('Full Error:', error)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          // Don't set error status here, just log it
        },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000 // Increased from 15s to 30s
      }
    )
    }

    return () => {
      // Cleanup watchPosition
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      
      // Cleanup map
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [isGeolocationAvailable, requestLocationDirectly])

  // Auto-trigger geolocate when map is ready
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 Auto-trigger useEffect TRIGGERED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  • isMapReady:', isMapReady)
    console.log('  • geolocateControl.current:', geolocateControl.current ? 'exists' : 'null')
    console.log('  • isGeolocationAvailable:', isGeolocationAvailable)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (isMapReady && geolocateControl.current) {
      console.log('✅ Conditions met, will auto-trigger geolocate in 500ms...')
      // Small delay to ensure control is fully initialized
      setTimeout(() => {
        try {
          console.log('🎯 Attempting to trigger GeolocateControl.trigger()...')
          geolocateControl.current?.trigger()
          console.log('✅ GeolocateControl.trigger() called successfully')
        } catch (error) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.warn('❌ Could not auto-trigger geolocate:', error)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          // If auto-trigger fails, try direct geolocation
          if (isGeolocationAvailable) {
            console.log('🔄 Falling back to direct geolocation...')
            requestLocationDirectly()
          } else {
            console.log('❌ Geolocation not available, cannot fallback')
          }
        }
      }, 500)
    } else {
      console.log('⚠️ Conditions not met, skipping auto-trigger')
      if (!isMapReady) console.log('  • Map not ready yet')
      if (!geolocateControl.current) console.log('  • GeolocateControl not created yet')
    }
  }, [isMapReady, isGeolocationAvailable, requestLocationDirectly])

  // Fetch POI whenever location changes significantly
  useEffect(() => {
    if (!userLocation || !hasLocation || !isMapReady) return
    const [lng, lat] = userLocation

    const last = lastPoiFetchRef.current
    const distanceSinceLast =
      last ? haversineDistanceMeters(lat, lng, last[1], last[0]) : Infinity

    if (distanceSinceLast < 200) {
      return
    }

    lastPoiFetchRef.current = [lng, lat]
    fetchPoisForLocation(lat, lng)
  }, [userLocation, hasLocation, isMapReady, fetchPoisForLocation])

  try {
    console.log('🎨 MapComponent RENDER - About to render JSX')
    return (
      <>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      {/* GPS Status Indicator */}
      {gpsStatus !== 'idle' && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          backgroundColor: gpsStatus === 'active' ? '#4caf50' : 
                          gpsStatus === 'acquiring' ? '#ff9800' : '#f44336',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxWidth: '300px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {gpsStatus === 'active' && '✅ GPS Aktivan'}
            {gpsStatus === 'acquiring' && '🔄 Tražim GPS...'}
            {gpsStatus === 'error' && '❌ GPS Greška'}
          </div>
          {gpsStatus === 'active' && locationAccuracy !== null && (
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              {locationAccuracy < 50 ? '🎯 Tačnost: ' : locationAccuracy < 100 ? '✓ Tačnost: ' : '~ Tačnost: '}
              {locationAccuracy.toFixed(0)}m
              {locationAccuracy >= 100 && ' (približna)'}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div style={{
          position: 'absolute',
          top: gpsStatus !== 'idle' ? '130px' : '80px',
          right: '20px',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          maxWidth: '350px',
          lineHeight: '1.5'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Manual Trigger Button */}
      {showManualTrigger && (
        <button
          onClick={requestLocationDirectly}
          style={{
            position: 'absolute',
            top: errorMessage ? '200px' : (gpsStatus !== 'idle' ? '180px' : '130px'),
            right: '20px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#357ae8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4285F4'}
        >
          🔄 Pokušaj Ponovo
        </button>
      )}

      {/* Secure Origin Warning - only show on client after mount */}
      {isMounted && !isSecureOrigin && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          ⚠️ Za 100% tačnu GPS lokaciju koristi HTTPS ili localhost (trenutno: {typeof window !== 'undefined' ? window.location.protocol : 'unknown'})
        </div>
      )}

      {/* POI Loading Indicator */}
      {poiLoading && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#0d47a1',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          🔍 Učitavam turističke tačke...
        </div>
      )}

      {/* POI Error */}
      {poiError && (
        <div
          style={{
            position: 'absolute',
            bottom: poiLoading ? '70px' : '20px',
            right: '20px',
            backgroundColor: '#c62828',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            maxWidth: '320px',
            lineHeight: 1.4
          }}
        >
          ❌ POI greška: {poiError}
        </div>
      )}

      </>
    )
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ CRITICAL ERROR in MapComponent RENDER')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', error)
    console.error('Error Message:', error instanceof Error ? error.message : String(error))
    console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ color: '#f44336' }}>Greška u MapComponent</h2>
          <p style={{ color: '#666' }}>{error instanceof Error ? error.message : String(error)}</p>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            Proveri konzolu (F12) za detalje
          </p>
        </div>
      </div>
    )
  }
}

function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180

  const R = 6371e3
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lon2 - lon1)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
