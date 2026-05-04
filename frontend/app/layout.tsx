import 'dialkit/styles.css'
import 'lenis/dist/lenis.css'
import './globals.css'

import {SpeedInsights} from '@vercel/speed-insights/next'
import {DialRoot} from 'dialkit'
import type {Metadata} from 'next'
import {VisualEditing} from 'next-sanity/visual-editing'
import localFont from 'next/font/local'
import {draftMode} from 'next/headers'
import {Toaster} from 'sonner'

import {handleError} from '@/app/client-utils'
import DraftModeToast from '@/app/components/DraftModeToast'
import LenisRoot from '@/app/components/LenisRoot'
import SiteNav from '@/app/components/SiteNav'
import {SanityLive} from '@/sanity/lib/live'

export const metadata: Metadata = {
  title: {
    default: 'Gery Georgieva',
    template: '%s — Gery Georgieva',
  },
  description: 'Artist',
  openGraph: {type: 'website'},
}

const rillus = localFont({
  src: [
    {
      path: '../public/fonts/Rillus/for-rillusunlicensedtrial-extralight.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/fonts/Rillus/for-rillusunlicensedtrial-light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Rillus/for-rillusunlicensedtrial-semilight.otf',
      weight: '350',
      style: 'normal',
    },
    {
      path: '../public/fonts/Rillus/for-rillusunlicensedtrial-regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Rillus/for-rillusunlicensedtrial-medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Rillus/for-rillusunlicensedtrial-bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/Rillus/for-rillusunlicensedtrial-extrabold.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/Rillus/for-rillusunlicensedtrial-black.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-rillus',
  display: 'swap',
})

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()

  return (
    <html
      lang="en"
      className={rillus.variable}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Gery Georgieva" />
      </head>
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
          <main className="pt-12">
            {children}
            <DialRoot productionEnabled defaultOpen={false} />
          </main>
          <SpeedInsights />
        </LenisRoot>
      </body>
    </html>
  )
}
