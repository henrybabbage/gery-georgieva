import type {SanityImageSource} from '@sanity/image-url'

import {urlForImage} from '@/sanity/lib/utils'

export interface HomepageCarouselSlide {
  key: string
  imageUrl: string
  title: string
  href: string | null
}

/** Matches `homepageCarouselQuery` shape; typegen does not infer `select` branches reliably. */
export interface HomepageCarouselQueryData {
  homepageCarousel?: Array<{
    _key: string
    workSlide?: {
      _id: string
      title?: string | null
      carouselImage?: SanityImageSource | null
      firstGalleryImage?: SanityImageSource | null
      coverImage?: SanityImageSource | null
      exhibition?: {
        title?: string | null
        slug?: string | null
        hidePublicPage?: boolean | null
      } | null
    } | null
    exhibitionSlide?: {
      _id: string
      title?: string | null
      slug?: string | null
      hidePublicPage?: boolean | null
      carouselImage?: SanityImageSource | null
      /** First still image in installationImages. */
      firstInstallImage?: SanityImageSource | null
    } | null
  }> | null
}

interface CarouselExhibitionProjection {
  title?: string | null
  slug?: string | null
  hidePublicPage?: boolean | null
}

function exhibitionHrefAndTitle(
  ex: CarouselExhibitionProjection | null | undefined,
  fallbackTitle: string,
): {href: string | null; title: string} {
  const hidden = ex?.hidePublicPage === true
  const slug = ex?.slug
  const href = !hidden && typeof slug === 'string' && slug.length > 0 ? `/exhibition/${slug}` : null
  const title = (typeof ex?.title === 'string' ? ex.title.trim() : '') || fallbackTitle
  return {href, title}
}

export function buildHomepageCarouselSlides(
  data: HomepageCarouselQueryData | null | undefined,
): HomepageCarouselSlide[] {
  const out: HomepageCarouselSlide[] = []
  for (const row of data?.homepageCarousel ?? []) {
    const w = row.workSlide
    if (w) {
      const img =
        (w.carouselImage as SanityImageSource | null | undefined) ??
        (w.firstGalleryImage as SanityImageSource | null | undefined) ??
        (w.coverImage as SanityImageSource | null | undefined)
      const url = img ? urlForImage(img)?.width(2400).auto('format').url() : undefined
      const imageUrl = url ?? ''
      const {href, title} = exhibitionHrefAndTitle(
        w.exhibition,
        typeof w.title === 'string' ? w.title.trim() : '',
      )
      if (!href) continue
      out.push({
        key: `work:${row._key}`,
        imageUrl,
        title,
        href,
      })
      continue
    }
    const ex = row.exhibitionSlide
    if (ex) {
      const img =
        (ex.carouselImage as SanityImageSource | null | undefined) ??
        (ex.firstInstallImage as SanityImageSource | null | undefined)
      const url = img ? urlForImage(img)?.width(2400).auto('format').url() : undefined
      const imageUrl = url ?? ''
      const {href, title} = exhibitionHrefAndTitle(
        ex,
        typeof ex.title === 'string' ? ex.title.trim() : '',
      )
      if (!href) continue
      out.push({
        key: `exhibition:${row._key}`,
        imageUrl,
        title,
        href,
      })
    }
  }
  return out
}
