'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ APPLICATION ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error Message:', error.message)
    console.error('Error Stack:', error.stack)
    console.error('Error Digest:', error.digest)
    console.error('Full Error:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Nešto je pošlo po zlu</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        {error.message || 'Došlo je do greške u aplikaciji'}
      </p>
      <button
        onClick={() => reset()}
        style={{
          backgroundColor: '#4285F4',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Pokušaj ponovo
      </button>
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
        Proveri konzolu (F12) za detaljne informacije o grešci
      </div>
    </div>
  )
}

