import './globals.css'
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#0c4a6e',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Trailer Inspection Report Generator',
  description: 'Generate professional PDF inspection reports for trailers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Inspection',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
