'use client'

import { useState, useEffect } from 'react'
import type { Poi, PoiZone } from '@/types/poi'

interface SidePanelProps {
  pois: Poi[]
  highlight: Poi | null
  zones: PoiZone[]
  isLoading: boolean
  error?: string | null
}

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export default function SidePanel({
  pois,
  highlight,
  zones,
  isLoading,
  error
}: SidePanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration error - only render button on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const topPois = pois.slice(0, 8)

  return (
    <div
      style={{
        position: 'absolute',
        left: isOpen ? 0 : -350,
        top: 0,
        width: '350px',
        height: '100%',
        backgroundColor: 'white',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        transition: 'left 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Toggle Button - only render on client to avoid hydration error */}
      {isMounted && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: -40,
            top: '20px',
            width: '40px',
            height: '40px',
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            zIndex: 1001
          }}
        >
          {isOpen ? '‹' : '›'}
        </button>
      )}

      {/* Panel Content */}
      <div
        style={{
          padding: '20px',
          height: '100%',
          overflowY: 'auto'
        }}
      >
        <h2 style={{ marginBottom: '8px', fontSize: '24px', fontWeight: 'bold' }}>
          AI Turizam CG
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
          Turistički vodič u realnom vremenu
        </p>

        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Dnevna tačka</h3>
          {highlight ? (
            <div
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: '12px',
                padding: '14px',
                borderLeft: '4px solid #ffd600'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '16px' }}>{highlight.name}</div>
              <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
                {highlight.address || 'Lokacija u blizini'}
              </div>
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  gap: '10px',
                  fontSize: '12px',
                  color: '#333'
                }}
              >
                {highlight.rating && (
                  <span>⭐ {highlight.rating.toFixed(1)} ({highlight.userRatingsTotal || 0})</span>
                )}
                <span>📍 {formatDistance(highlight.distanceMeters)}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#888', fontSize: '13px' }}>
              Dnevna preporuka će se pojaviti nakon što pronađemo lokaciju.
            </p>
          )}
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Popularne tačke</h3>
          {isLoading && <p style={{ color: '#666' }}>Učitavam tačke u blizini...</p>}
          {error && (
            <p style={{ color: '#c62828', fontSize: '13px' }}>
              Greška pri učitavanju: {error}
            </p>
          )}
          {!isLoading && !error && topPois.length === 0 && (
            <p style={{ color: '#666', fontSize: '13px' }}>
              Još uvijek nemamo tačke za prikaz. Sačekaj GPS lokaciju.
            </p>
          )}

          {!isLoading && topPois.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {topPois.map((poi) => (
                <li
                  key={poi.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{poi.name}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    {poi.address || poi.types?.[0] || 'POI'}
                  </div>
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      gap: '12px',
                      fontSize: '12px',
                      color: '#444'
                    }}
                  >
                    {poi.rating && (
                      <span>⭐ {poi.rating.toFixed(1)} ({poi.userRatingsTotal || 0})</span>
                    )}
                    <span>📍 {formatDistance(poi.distanceMeters)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {zones.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Mikro zone</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {zones.slice(0, 5).map((zone) => (
                <li
                  key={zone.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #eee',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{zone.name}</div>
                  <div style={{ color: '#666' }}>
                    {zone.poiIds.length} tačaka • radijus {formatDistance(zone.radiusMeters)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

