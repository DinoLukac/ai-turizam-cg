import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Turizam CG',
  description: 'Smart Tourism Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bs">
      <head>
        {/* Defensive script to prevent window.ethereum errors from browser extensions */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && !window.ethereum) {
                  // Create a safe dummy ethereum object to prevent errors
                  Object.defineProperty(window, 'ethereum', {
                    value: {
                      selectedAddress: null,
                      isMetaMask: false,
                      request: function() { return Promise.reject(new Error('No wallet available')); }
                    },
                    writable: true,
                    configurable: true
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

