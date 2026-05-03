import type {SanityImageSource} from '@sanity/image-url'
import type {MediaImageItem, MediaVideoLinkItem} from '@/sanity/lib/types'
import {urlForImage} from '@/sanity/lib/utils'

const PREVIEW_W = 520
const PREVIEW_H = 294

export type GalleryLeadPreview =
  | {kind: 'image'; url: string}
  | {kind: 'video'; posterUrl: string | null}
  | {kind: 'text'; text: string}
  | {kind: 'skeleton'}

function imageUrlFromSanity(source: SanityImageSource | null | undefined): string | null {
  if (source == null) return null
  return urlForImage(source)?.width(PREVIEW_W).height(PREVIEW_H).fit('max').auto('format').url() ?? null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

/**
 * First slot in a work `gallery` or ephemera `images` array (mediaImage | mediaVideoFile | mediaVideoLink).
 */
export function resolveGalleryLeadPreview(item: unknown): GalleryLeadPreview | null {
  if (!isRecord(item) || typeof item._type !== 'string') return null

  if (item._type === 'mediaImage') {
    const img = item as unknown as MediaImageItem
    const url = imageUrlFromSanity(img as SanityImageSource)
    if (!url) return null
    return {kind: 'image', url}
  }

  if (item._type === 'mediaVideoLink') {
    const link = item as unknown as MediaVideoLinkItem
    if (link.provider === 'vimeo') {
      const poster = link.vimeo?.asset?.thumbnail ?? null
      return {kind: 'video', posterUrl: poster}
    }
    if (link.provider === 'youtube' && link.youtube?.id) {
      const thumbs = link.youtube.thumbnails
      const poster =
        Array.isArray(thumbs) && typeof thumbs[0] === 'string' && thumbs[0] !== ''
          ? thumbs[0]
          : `https://i.ytimg.com/vi/${link.youtube.id}/hqdefault.jpg`
      return {kind: 'video', posterUrl: poster}
    }
    return {kind: 'video', posterUrl: null}
  }

  if (item._type === 'mediaVideoFile') {
    return {kind: 'video', posterUrl: null}
  }

  return null
}

export function resolveWorkDestinationPreview(
  galleryLead: unknown,
  coverImage: SanityImageSource | null | undefined,
): GalleryLeadPreview {
  const fromGallery = resolveGalleryLeadPreview(galleryLead)
  if (fromGallery) return fromGallery

  const coverUrl = imageUrlFromSanity(coverImage ?? undefined)
  if (coverUrl) return {kind: 'image', url: coverUrl}

  return {kind: 'skeleton'}
}

export function resolveEphemeraDestinationPreview(
  imagesLead: unknown,
  descriptionPlain: string | null | undefined,
  excerptMaxLen: number,
): GalleryLeadPreview {
  const fromImages = resolveGalleryLeadPreview(imagesLead)
  if (fromImages) return fromImages

  const excerpt = truncatePlain(descriptionPlain, excerptMaxLen)
  if (excerpt) return {kind: 'text', text: excerpt}

  return {kind: 'skeleton'}
}

function truncatePlain(text: string | null | undefined, maxLen: number): string | null {
  if (text == null || text === '') return null
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized === '') return null
  if (normalized.length <= maxLen) return normalized
  return `${normalized.slice(0, maxLen - 1).trimEnd()}…`
}
