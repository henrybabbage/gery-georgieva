import type {ValidationContext} from 'sanity'

const STAGGERED_GALLERY_FIELD_NAMES = ['installationImages', 'articleImages'] as const

type StaggeredGalleryFieldName = (typeof STAGGERED_GALLERY_FIELD_NAMES)[number]

/** Exhibition installation gallery + press article gallery (same staggered UI on the site). */
export function pathTargetsStaggeredInstallationGallery(
  path: ValidationContext['path'] | undefined,
): boolean {
  if (!Array.isArray(path)) return false
  return path.some(
    (seg): seg is StaggeredGalleryFieldName =>
      typeof seg === 'string' &&
      (STAGGERED_GALLERY_FIELD_NAMES as readonly string[]).includes(seg),
  )
}

type CaptionCreditParent = {
  caption?: string | null
  credit?: string | null
  asset?: {_ref?: string} | null
  provider?: string
  vimeo?: {_type?: string; asset?: {_ref?: string}}
  youtube?: {id?: string}
}

function assetHasRef(asset: unknown): boolean {
  return (
    typeof asset === 'object' &&
    asset !== null &&
    '_ref' in asset &&
    typeof (asset as {_ref?: unknown})._ref === 'string' &&
    (asset as {_ref: string})._ref.length > 0
  )
}

function hasRenderableMedia(parent: CaptionCreditParent | undefined): boolean {
  if (!parent || typeof parent !== 'object') return false
  if (assetHasRef(parent.asset)) return true
  if (parent.provider === 'vimeo') return assetHasRef(parent.vimeo?.asset)
  if (parent.provider === 'youtube') {
    const id = parent.youtube?.id
    return typeof id === 'string' && id.trim().length > 0
  }
  return false
}

/**
 * Non-blocking warning when caption and credit are both empty for staggered show/press galleries.
 * Attach to the `caption` field only (see plan).
 */
export function staggeredGalleryCaptionEmptyWarning(
  caption: unknown,
  context: ValidationContext,
): true | {level: 'warning'; message: string} {
  if (!pathTargetsStaggeredInstallationGallery(context.path)) return true
  const parent = context.parent as CaptionCreditParent | undefined
  if (!hasRenderableMedia(parent)) return true
  const cap = typeof caption === 'string' ? caption.trim() : ''
  const cred =
    typeof parent?.credit === 'string' ? parent.credit.trim() : ''
  if (cap !== '' || cred !== '') return true
  return {
    level: 'warning',
    message:
      'Caption and photo credit are both empty. Nothing appears under this media on show and press pages.',
  }
}
