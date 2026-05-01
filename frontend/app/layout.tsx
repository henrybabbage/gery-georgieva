import './globals.css'
import 'lenis/dist/lenis.css'

import {SpeedInsights} from '@vercel/speed-insights/next'
import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import {draftMode, headers} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {Toaster} from 'sonner'

import DraftModeToast from '@/app/components/DraftModeToast'
import SiteNav from '@/app/components/SiteNav'
import LenisRoot from '@/app/components/LenisRoot'
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
  const holdShell = (await headers()).get('x-hold-shell') === '1'

  if (holdShell) {
    return (
      <html lang="en" className={inter.variable} style={{background: '#fafafa', color: '#1c1b18'}}>
        <body className="isolate min-h-screen text-base font-sans antialiased">
          {children}
        </body>
      </html>
    )
  }

  return (
    <html lang="en" className={inter.variable} style={{background: '#fafafa', color: '#1c1b18'}}>
      <body className="isolate min-h-screen text-base font-sans antialiased">
        <LenisRoot>
          <Toaster position="bottom-center" />
          {isDraftMode && (
            <>
              <DraftModeToast />
              <VisualEditing />
            </>
          )}
          <SanityLive onError={handleError} />
          <SiteNav />
          <main className="pt-12">{children}</main>
          <SpeedInsights />
        </LenisRoot>
      </body>
    </html>
  )
}
