import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: {
    default: 'SiteCheck — Digital Clinical Records for Nigerian Site Medics',
    template: '%s | SiteCheck',
  },
  description: 'SiteCheck eliminates double-entry for Nigerian site medics. Patient intake, drug tracking, and automatic reports — all in one place. Works offline.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'SiteCheck — Digital Clinical Records',
    description: 'Replace paper records with one digital workflow. NDPA compliant. Made for Nigeria.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="theme-color" content="#1A9E78" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SiteCheck" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans bg-neutral-50 text-neutral-700 antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
