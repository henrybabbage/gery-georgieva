import './globals.css'

import {SpeedInsights} from '@vercel/speed-insights/next'
import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {Toaster} from 'sonner'

import DraftModeToast from '@/app/components/DraftModeToast'
import {SanityLive} from '@/sanity/lib/live'
import {handleError} from '@/app/client-utils'

export const metadata: Metadata = {
  title: {
    default: 'Gery Georgieva',
    template: '%s — Gery Georgieva',
  },
  description: 'Artist',
  openGraph: {type: 'website'},
}

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()

  return (
    <html lang="en" className={inter.variable} style={{background: '#f4f3ef', color: '#1c1b18'}}>
      <body className="min-h-screen font-sans antialiased">
        <Toaster position="bottom-center" />
        {isDraftMode && (
          <>
            <DraftModeToast />
            <VisualEditing />
          </>
        )}
        <SanityLive onError={handleError} />
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between px-5 py-4 text-sm">
          <a href="/">Gery Georgieva</a>
          <div className="flex gap-6">
            <a href="/archive">Archive</a>
            <a href="/cv">CV</a>
          </div>
        </nav>
        <main className="pt-12">{children}</main>
        <SpeedInsights />
      </body>
    </html>
  )
}
