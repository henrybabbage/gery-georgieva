import type {SanityImageSource} from '@sanity/image-url'

import {SANITY_IMAGE_PALETTE_MOOD_FOR_HOMEPAGE_DEPTH_GALLERY} from '@/lib/depth-gallery/HomepageBackgroundMood'
import {moodColorsFromSanityPalette} from '@/lib/depth-gallery/SanityPaletteMood'
import {urlForImage} from '@/sanity/lib/utils'
import type {SanityImagePalette} from '@/sanity.types'

export interface HomepageCarouselSlideMood {
  background: string
  blob1: string
  blob2: string
  accent: string
}

export interface HomepageCarouselSlide {
  key: string
  imageUrl: string
  title: string
  href: string | null
  /** Sanity-derived blob background colors when asset metadata.palette exists. */
  moodColors?: HomepageCarouselSlideMood
}

function imagePaletteFromResolvedSource(
  img: SanityImageSource | null | undefined,
): SanityImagePalette | undefined {
  if (!img || typeof img !== 'object') return undefined
  const asset = (img as {asset?: {metadata?: {palette?: SanityImagePalette}}}).asset
  return asset?.metadata?.palette
}

/** Matches `homepageCarouselQuery` shape; typegen does not infer `select` branches reliably. */
export interface HomepageCarouselQueryData {
  homepageCarousel?: Array<{
    _key: string
    workSlide?: {
      _id: string
      title?: string | null
      slug?: string | null
      hidePublicPage?: boolean | null
      carouselImage?: SanityImageSource | null
      firstGalleryImage?: SanityImageSource | null
      coverImage?: SanityImageSource | null
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

interface SanityImageAssetLike {
  _id?: string
  _ref?: string
}

interface SanityImageSourceLike {
  _id?: string
  _ref?: string
  asset?: SanityImageAssetLike | null
}

function hasUsableImageAsset(
  img: SanityImageSource | null | undefined,
): img is SanityImageSource {
  if (!img) return false
  if (typeof img === 'string') return img.length > 0
  if (typeof img !== 'object') return false

  const source = img as SanityImageSourceLike
  if (typeof source._ref === 'string' || typeof source._id === 'string') {
    return true
  }

  const asset = source.asset
  if (!asset || typeof asset !== 'object') return false

  return typeof asset._ref === 'string' || typeof asset._id === 'string'
}

function homepageCarouselImageUrl(
  img: SanityImageSource | null | undefined,
): string | undefined {
  if (!hasUsableImageAsset(img)) return undefined
  return urlForImage(img)?.width(2400).auto('format').url()
}

function firstUsableHomepageCarouselImage(
  ...images: Array<SanityImageSource | null | undefined>
): SanityImageSource | undefined {
  return images.find(hasUsableImageAsset)
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

interface CarouselWorkProjection {
  title?: string | null
  slug?: string | null
  hidePublicPage?: boolean | null
}

function workHrefAndTitle(
  w: CarouselWorkProjection | null | undefined,
  fallbackTitle: string,
): {href: string | null; title: string} {
  const hidden = w?.hidePublicPage === true
  const slug = w?.slug
  const href =
    !hidden && typeof slug === 'string' && slug.length > 0 ? `/work/${slug}` : null
  const title =
    (typeof w?.title === 'string' ? w.title.trim() : '') || fallbackTitle || 'Work'
  return {href, title}
}

export function buildHomepageCarouselSlides(
  data: HomepageCarouselQueryData | null | undefined,
): HomepageCarouselSlide[] {
  const out: HomepageCarouselSlide[] = []
  for (const row of data?.homepageCarousel ?? []) {
    const w = row.workSlide
    if (w) {
      const img = firstUsableHomepageCarouselImage(
        w.carouselImage as SanityImageSource | null | undefined,
        w.firstGalleryImage as SanityImageSource | null | undefined,
        w.coverImage as SanityImageSource | null | undefined,
      )
      const url = homepageCarouselImageUrl(img)
      const imageUrl = url ?? ''
      const {href, title} = workHrefAndTitle(
        w,
        typeof w.title === 'string' ? w.title.trim() : '',
      )
      if (!href) continue
      const palette = imagePaletteFromResolvedSource(img)
      const moodColors =
        SANITY_IMAGE_PALETTE_MOOD_FOR_HOMEPAGE_DEPTH_GALLERY
          ? (moodColorsFromSanityPalette(palette) ?? undefined)
          : undefined
      out.push({
        key: `work:${row._key}`,
        imageUrl,
        title,
        href,
        ...(moodColors ? {moodColors} : {}),
      })
      continue
    }
    const ex = row.exhibitionSlide
    if (ex) {
      const img = firstUsableHomepageCarouselImage(
        ex.carouselImage as SanityImageSource | null | undefined,
        ex.firstInstallImage as SanityImageSource | null | undefined,
      )
      const url = homepageCarouselImageUrl(img)
      const imageUrl = url ?? ''
      const {href, title} = exhibitionHrefAndTitle(
        ex,
        typeof ex.title === 'string' ? ex.title.trim() : '',
      )
      if (!href) continue
      const palette = imagePaletteFromResolvedSource(img)
      const moodColors =
        SANITY_IMAGE_PALETTE_MOOD_FOR_HOMEPAGE_DEPTH_GALLERY
          ? (moodColorsFromSanityPalette(palette) ?? undefined)
          : undefined
      out.push({
        key: `exhibition:${row._key}`,
        imageUrl,
        title,
        href,
        ...(moodColors ? {moodColors} : {}),
      })
    }
  }
  return out
}
