import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AcadLund',
  description: 'Secure Management Interface.',
  robots: 'noindex, nofollow, noarchive, nosnippet', // Absolute privacy from all bots
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
        {children}
      </body>
    </html>
  )
}
