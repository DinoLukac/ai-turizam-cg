'use client'

import { useState, useEffect, useCallback } from 'react'
import MapComponent, { PoiUpdatePayload } from '@/components/MapComponent'
import SidePanel from '@/components/SidePanel'
import type { Poi, PoiZone } from '@/types/poi'

export default function Home() {
  const [isSecureOrigin, setIsSecureOrigin] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [pois, setPois] = useState<Poi[]>([])
  const [highlightPoi, setHighlightPoi] = useState<Poi | null>(null)
  const [zones, setZones] = useState<PoiZone[]>([])
  const [poiLoading, setPoiLoading] = useState(false)
  const [poiError, setPoiError] = useState<string | null>(null)

  // Check secure origin on mount (client-side only to avoid hydration issues)
  useEffect(() => {
    setIsMounted(true)
    try {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        const protocol = window.location.protocol
        
        console.log('🔍 Home useEffect - Checking secure origin...')
        // Check if we're on a secure origin (https, localhost, Cloudflare Tunnel, or LAN IP)
        const isSecure = 
          protocol === 'https:' || 
          hostname === 'localhost' || 
          hostname === '127.0.0.1' ||
          // Cloudflare Tunnel domains
          hostname.endsWith('.trycloudflare.com') ||
          // Allow LAN IPs (private IP ranges) for development
          /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)\d+\.\d+$/.test(hostname)
        
        console.log('  • Protocol:', protocol)
        console.log('  • Hostname:', hostname)
        console.log('  • Is Secure:', isSecure)
        setIsSecureOrigin(isSecure)

        if (!isSecure) {
          console.warn('⚠️ GPS high-accuracy requires HTTPS or localhost. Current protocol:', protocol)
        }
      }
    } catch (error) {
      console.error('❌ Error in Home useEffect:', error)
      // Don't crash - just assume not secure
      setIsSecureOrigin(false)
    }
  }, [])

  const handlePoiUpdate = useCallback(
    ({ pois, highlight, zones, loading, error }: PoiUpdatePayload) => {
      try {
        console.log('📊 Home handlePoiUpdate called:', { 
          poisCount: Array.isArray(pois) ? pois.length : 'not array',
          highlight: highlight?.name || 'none',
          zonesCount: zones?.length || 0,
          loading,
          error
        })
        
        if (Array.isArray(pois)) {
          setPois(pois)
        }
        if (zones) {
          setZones(zones)
        }
        if (typeof loading === 'boolean') {
          setPoiLoading(loading)
        }
        if (typeof error === 'string') {
          setPoiError(error)
        } else if (error === null) {
          setPoiError(null)
        }
        if (highlight !== undefined) {
          setHighlightPoi(highlight ?? null)
        }
      } catch (error) {
        console.error('❌ Error in handlePoiUpdate:', error)
      }
    },
    []
  )

  try {
    return (
      <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            ⚠️ Za 100% tačnu GPS lokaciju koristi HTTPS ili localhost
          </div>
        )}
        <MapComponent onPoiUpdate={handlePoiUpdate} />
        <SidePanel
          pois={pois}
          highlight={highlightPoi}
          zones={zones}
          isLoading={poiLoading}
          error={poiError}
        />
      </main>
    )
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ CRITICAL ERROR in Home Component RENDER')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', error)
    console.error('Error Message:', error instanceof Error ? error.message : String(error))
    console.error('Error Stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return (
      <main style={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ color: '#f44336' }}>Greška u renderovanju</h2>
          <p style={{ color: '#666' }}>{error instanceof Error ? error.message : String(error)}</p>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            Proveri konzolu (F12) za detalje
          </p>
        </div>
      </main>
    )
  }
}

