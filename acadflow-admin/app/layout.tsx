import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AcadFlow Admin Panel | PVPPCOE',
  description: 'Administrative dashboard for AcadFlow educational management platform at PVPPCOE.',
  robots: 'noindex, nofollow', // Keep admin panel off search engines
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
        {children}
      </body>
    </html>
  )
}
