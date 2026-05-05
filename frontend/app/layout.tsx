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

import {handleError} from '@/app/ClientUtils'
import DraftModeToast from '@/app/components/DraftModeToast'
import LenisRoot from '@/app/components/LenisRoot'
import SiteNav from '@/app/components/SiteNav'
import {sanityFetch, SanityLive} from '@/sanity/lib/live'
import {aboutSiteMetadataQuery} from '@/sanity/lib/queries'
import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import type {AboutSiteMetadataQueryResult} from '@/sanity.types'

const SITE_TITLE_DEFAULT = 'Gery Georgieva'
const SITE_DESCRIPTION_DEFAULT = 'Artist'

export async function generateMetadata(): Promise<Metadata> {
  const {data} = await sanityFetch({
    query: aboutSiteMetadataQuery,
    stega: false,
  })
  const about = data as AboutSiteMetadataQueryResult | null
  const title =
    typeof about?.metaTitle === 'string' && about.metaTitle.trim()
      ? about.metaTitle.trim()
      : SITE_TITLE_DEFAULT
  const description =
    typeof about?.metaDescription === 'string' && about.metaDescription.trim()
      ? about.metaDescription.trim()
      : SITE_DESCRIPTION_DEFAULT
  const ogImage = resolveOpenGraphImage(about?.ogImage ?? undefined)

  return {
    title: {
      default: title,
      template: `%s — ${SITE_TITLE_DEFAULT}`,
    },
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      ...(ogImage && {images: [ogImage]}),
    },
    ...(ogImage && {
      twitter: {
        card: 'summary_large_image',
        images: [ogImage.url],
      },
    }),
  }
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
