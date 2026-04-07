import type { Metadata } from 'next'
import './globals.css'
import MaintenanceGate from '@/components/MaintenanceGate'

export const metadata: Metadata = {
  title: 'AcadLund',
  description: 'Secure Management Interface.',
  robots: 'noindex, nofollow, noarchive, nosnippet',
  creator: 'Admin',
  publisher: 'Admin',
  generator: 'SecureSystem v1.0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-dark-950 text-dark-100 antialiased">
        {/* MaintenanceGate wraps EVERY page — login, dashboard, all routes */}
        <MaintenanceGate>
          {children}
        </MaintenanceGate>
      </body>
    </html>
  )
}
