import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../components/ui/ToastProvider'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { HydrationErrorBoundary } from '../components/ui/hydration-error-boundary'
import { BrowserExtensionHandler } from '../components/ui/browser-extension-handler'
import { HydrationLogger } from '../components/ui/hydration-logger'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DirectRent UK - Find Your Perfect Rental Property',
  description: 'The UK\'s premier property rental platform. Find flats, houses, and studios directly from landlords. No agency fees.',
  keywords: 'UK rental, property rental, flats, houses, landlords, tenants, London, Manchester, Birmingham',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full flex flex-col`} suppressHydrationWarning>
        <BrowserExtensionHandler />
        <HydrationLogger />
        <HydrationErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </HydrationErrorBoundary>
      </body>
    </html>
  )
}
