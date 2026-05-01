import type {ReactNode} from 'react'
import Image from 'next/image'
import {stegaClean} from '@sanity/client/stega'
import type {ExhibitionQueryResult} from '@/sanity.types'
import {
  ExhibitionExpandableGalleryImage,
  type ExhibitionExpandableGalleryImageProps,
} from '@/app/components/exhibition-expandable-gallery-image'
import {getEffectiveImageSizeOverride, getImageSizePreset} from '@/sanity/lib/imageSize'
import {urlForImage} from '@/sanity/lib/utils'

/** Matches `installationImages` from `exhibitionQuery` (TypeGen); allows `asset: null` from GROQ. */
export type ExhibitionInstallationImage = NonNullable<
  NonNullable<ExhibitionQueryResult>['installationImages']
>[number]

/**
 * Desktop layout from Paper frame `3K-0` (MCP `get_computed_styles`):
 * - One image per row, `align-items: flex-end`, `justify-content` cycles below.
 * - Row spacing ~10% frame width (125.3px on 1253px artboard).
 * - Image band ~30% width portrait, ~45% landscape (Paper aspect-ratio boxes).
 */

type RowJustify = 'left' | 'center' | 'right'

/** Paper nodes 3L-0 … 4T-0 in order (`flex-start` → left, `flex-end` → right, `space-around` → center). */
const ROW_JUSTIFY_PATTERN: RowJustify[] = [
  'left',
  'left',
  'right',
  'center',
  'right',
  'right',
  'left',
  'center',
  'left',
  'center',
  'center',
]

const PATTERN_LEN = ROW_JUSTIFY_PATTERN.length

/** Stable per-title phase so layout is identical on every visit until title or image order changes. */
function layoutSeedFromTitle(title: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < title.length; i++) {
    h ^= title.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function justifyForIndex(index: number, title: string): RowJustify {
  const seed = layoutSeedFromTitle(title)
  return ROW_JUSTIFY_PATTERN[(seed + index) % PATTERN_LEN]
}

type Orientation = 'portrait' | 'landscape'

function getItemOrientation(item: ExhibitionInstallationImage): Orientation {
  if (item._type === 'mediaImage') {
    const d = item.asset?.metadata?.dimensions
    if (d?.width && d?.height && d.width > 0 && d.height > 0) {
      return d.height > d.width ? 'portrait' : 'landscape'
    }
    return 'landscape'
  }
  if (item._type === 'mediaVideoFile') {
    return 'landscape'
  }
  if (item._type === 'mediaVideoLink') {
    const w = item.vimeo?.asset?.width
    const h = item.vimeo?.asset?.height
    if (w && h && w > 0 && h > 0) return h > w ? 'portrait' : 'landscape'
    return 'landscape'
  }
  return 'landscape'
}

function getImageAlt(item: ExhibitionInstallationImage & {_type: 'mediaImage'}, altBase: string): string {
  const asset = item.asset as {altText?: string} | null | undefined
  return asset?.altText?.trim() || item.caption?.trim() || altBase
}

function getExpandableImageProps(
  item: ExhibitionInstallationImage & {_type: 'mediaImage'},
  altBase: string,
  sizes: string,
  orientation: Orientation,
): ExhibitionExpandableGalleryImageProps | null {
  const preset = getImageSizePreset(getEffectiveImageSizeOverride(item))
  const url = item.asset ? urlForImage(item)?.width(preset.width).auto('format').url() : null
  if (!url) return null

  const meta = item.asset?.metadata?.dimensions
  const ratio =
    meta?.width && meta?.height && meta.width > 0 && meta.height > 0
      ? meta.width / meta.height
      : 4 / 3

  const popupPixelW =
    meta?.width && meta.width > 0 ? Math.min(meta.width, 2400) : Math.min(preset.width * 2, 2400)
  const popupUrl = item.asset ? urlForImage(item)?.width(popupPixelW).auto('format').url() : null
  if (!popupUrl) return null

  const naturalW = meta?.width && meta.width > 0 ? meta.width : preset.width
  const naturalH =
    meta?.height && meta.height > 0 ? meta.height : Math.round(preset.width / ratio)

  const isAudience = stegaClean(item.isAudiencePhoto)
  const frameClass = isAudience
    ? 'outline outline-1 outline-offset-[-4px] outline-[#deded9]'
    : ''

  const palette = item.asset?.metadata?.palette
  const popupPlaceholderColor =
    palette?.dominant?.background ??
    palette?.muted?.background ??
    palette?.vibrant?.background ??
    null
  const popupLqip = item.asset?.metadata?.lqip?.trim() || null

  return {
    imageUrl: url,
    popupUrl,
    width: naturalW,
    height: naturalH,
    alt: getImageAlt(item, altBase),
    sizes,
    frameClass,
    orientation,
    caption: item.caption,
    credit: item.credit,
    popupLqip,
    popupPlaceholderColor,
  }
}

function GalleryMediaTile({
  item,
  altBase,
  sizes,
  orientation,
}: {
  item: ExhibitionInstallationImage
  altBase: string
  sizes: string
  orientation: Orientation
}) {
  const portraitMax = 'max-h-[min(85vh,900px)]'

  if (item._type === 'mediaImage') {
    const preset = getImageSizePreset(getEffectiveImageSizeOverride(item))
    const url = item.asset ? urlForImage(item)?.width(preset.width).auto('format').url() : null
    const meta = item.asset?.metadata?.dimensions
    const ratio =
      meta?.width && meta?.height && meta.width > 0 && meta.height > 0
        ? meta.width / meta.height
        : 4 / 3

    const isAudience = stegaClean(item.isAudiencePhoto)
    const frameClass = isAudience
      ? 'outline outline-1 outline-offset-[-4px] outline-[#deded9]'
      : ''

    if (!url) {
      return (
        <div className={`relative w-full overflow-hidden bg-placeholder ${frameClass}`} style={{aspectRatio: ratio}} />
      )
    }

    const naturalW = meta?.width && meta.width > 0 ? meta.width : preset.width
    const naturalH =
      meta?.height && meta.height > 0 ? meta.height : Math.round(preset.width / ratio)

    return (
      <div
        className={`relative w-full bg-placeholder ${frameClass} ${orientation === 'portrait' ? portraitMax : ''}`}
      >
        <Image
          src={url}
          alt={getImageAlt(item, altBase)}
          width={naturalW}
          height={naturalH}
          sizes={sizes}
          className="h-auto w-full max-w-full object-contain"
        />
      </div>
    )
  }

  if (item._type === 'mediaVideoFile') {
    const src = item.asset?.url
    if (!src) {
      return <div className="aspect-video w-full bg-placeholder" />
    }
    return (
      <video
        className={`aspect-video w-full max-w-full bg-black object-contain ${orientation === 'portrait' ? portraitMax : ''}`}
        controls
        playsInline
        preload="metadata"
      >
        <source src={src} type={item.asset?.mimeType ?? undefined} />
      </video>
    )
  }

  if (item._type === 'mediaVideoLink') {
    if (item.provider === 'vimeo') {
      const id = item.vimeo?.asset?.vimeoId
      if (!id) {
        return <VideoFallback caption={item.caption} credit={item.credit} />
      }
      return (
        <div className="relative aspect-video w-full max-w-full overflow-hidden bg-black">
          <iframe
            title={item.vimeo?.asset?.name ?? 'Vimeo video'}
            src={`https://player.vimeo.com/video/${id}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )
    }

    if (item.provider === 'youtube') {
      const id = item.youtube?.id
      if (!id) {
        return <VideoFallback caption={item.caption} credit={item.credit} />
      }
      return (
        <div className="relative aspect-video w-full max-w-full overflow-hidden bg-black">
          <iframe
            title={item.youtube?.title ?? 'YouTube video'}
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )
    }

    return <VideoFallback caption={item.caption} credit={item.credit} />
  }

  return null
}

function VideoFallback({caption, credit}: {caption?: string | null; credit?: string | null}) {
  if (!caption?.trim() && !credit?.trim()) {
    return <div className="aspect-video w-full bg-placeholder" />
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-placeholder px-4 text-center text-base text-[#8a8880]">
      {[caption, credit].filter(Boolean).join(' — ')}
    </div>
  )
}

function SideCaption({item}: {item: ExhibitionInstallationImage}) {
  const caption = item.caption?.trim()
  const credit = item.credit?.trim()
  if (!caption && !credit) return null
  return (
    <div className="space-y-1 text-base leading-snug text-[#8a8880] self-end pb-1">
      {caption && <p>{caption}</p>}
      {credit && <p className="opacity-70">{credit}</p>}
    </div>
  )
}

/** Single-column stack only below `md` (see MobileStack / `md:flex` block). Tablet+: 12-col staggered rows. */
const GRID_SIZES_PORTRAIT = `(min-width: 768px) 30vw, 100vw`
const GRID_SIZES_LANDSCAPE = `(min-width: 768px) 45vw, 100vw`

/** ~125.3px at 1253px artboard ≈ 10% width */
const ROW_MARGIN_BOTTOM = 'mb-[min(125px,10vw)]'

type StaggeredGridRowProps = {
  item: ExhibitionInstallationImage
  index: number
  altBase: string
  layoutTitle: string
}

function StaggeredGridRow({item, index, altBase, layoutTitle}: StaggeredGridRowProps) {
  const justify = justifyForIndex(index, layoutTitle)
  const orientation = getItemOrientation(item)
  const hasSideCaption = !!(item.caption?.trim() || item.credit?.trim())
  const sizes = orientation === 'portrait' ? GRID_SIZES_PORTRAIT : GRID_SIZES_LANDSCAPE

  const imgSpan = orientation === 'portrait' ? 'col-span-4' : 'col-span-6'
  const capSpan = orientation === 'portrait' ? 'col-span-8' : 'col-span-6'
  const rightImageStart = orientation === 'portrait' ? 'col-start-9' : 'col-start-7'

  const expandableProps =
    item._type === 'mediaImage' ? getExpandableImageProps(item, altBase, sizes, orientation) : null

  const media =
    expandableProps != null ? (
      <ExhibitionExpandableGalleryImage {...expandableProps} />
    ) : (
      <GalleryMediaTile item={item} altBase={altBase} sizes={sizes} orientation={orientation} />
    )
  const captionEl = hasSideCaption ? <SideCaption item={item} /> : null

  let grid: ReactNode

  if (justify === 'left') {
    grid = (
      <div className="grid w-full grid-cols-12 items-end gap-x-6 gap-y-4">
        <div className={`min-w-0 ${imgSpan}`}>{media}</div>
        {captionEl && <div className={`min-w-0 ${capSpan} text-left`}>{captionEl}</div>}
      </div>
    )
  } else if (justify === 'right') {
    grid = (
      <div className="grid w-full grid-cols-12 items-end gap-x-6 gap-y-4">
        {captionEl && <div className={`min-w-0 ${capSpan} text-left`}>{captionEl}</div>}
        <div className={`min-w-0 ${imgSpan} ${captionEl ? '' : rightImageStart}`}>{media}</div>
      </div>
    )
  } else {
    const leadSpacer = orientation === 'portrait' ? 'col-span-3' : 'col-span-2'
    const centerImgSpan = orientation === 'portrait' ? 'col-span-4' : 'col-span-6'
    const tailCaption = orientation === 'portrait' ? 'col-span-5' : 'col-span-4'
    grid = (
      <div className="grid w-full grid-cols-12 items-end gap-x-6 gap-y-4">
        <div className={`${leadSpacer} min-w-0`} aria-hidden />
        <div className={`min-w-0 ${centerImgSpan}`}>{media}</div>
        {captionEl ? (
          <div className={`min-w-0 ${tailCaption} text-left`}>{captionEl}</div>
        ) : (
          <div className={`min-w-0 ${tailCaption}`} aria-hidden />
        )}
      </div>
    )
  }

  const outerJustify =
    justify === 'left'
      ? 'justify-start'
      : justify === 'right'
        ? 'justify-end'
        : 'justify-center'

  return (
    <div className={`flex w-full items-end ${outerJustify} ${ROW_MARGIN_BOTTOM} last:mb-0`}>
      <div className="w-full min-w-0">{grid}</div>
    </div>
  )
}

function MobileStack({
  items,
  altBase,
}: {
  items: ExhibitionInstallationImage[]
  altBase: string
}) {
  return (
    <div className={`flex w-full min-w-0 flex-col gap-14 sm:gap-16 md:hidden`}>
      {items.map((item, i) => {
        const orientation = getItemOrientation(item)
        return (
          <div key={item._key ?? i} className="min-w-0">
            <GalleryMediaTile
              item={item}
              altBase={altBase}
              sizes="100vw"
              orientation={orientation}
            />
            {(item.caption?.trim() || item.credit?.trim()) && (
              <div className="mt-3 space-y-1 text-base text-[#8a8880]">
                {item.caption?.trim() && <p>{item.caption.trim()}</p>}
                {item.credit?.trim() && <p className="opacity-70">{item.credit.trim()}</p>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ExhibitionStaggeredMedia({
  items,
  altBase,
  layoutTitle,
  layoutIndexOffset = 0,
}: {
  items: NonNullable<NonNullable<ExhibitionQueryResult>['installationImages']>
  altBase: string
  /** Exhibition title (or any stable string) — seeds deterministic left/center/right rhythm. */
  layoutTitle: string
  /** When the gallery is split across sections, offset so desktop row rhythm continues (e.g. 5 after first block of 5). */
  layoutIndexOffset?: number
}) {
  if (!items.length) return null

  const seedSource = layoutTitle.trim() || altBase

  return (
    <div className="w-full">
      <MobileStack items={items} altBase={altBase} />
      <div className={`hidden w-full min-w-0 flex-col md:flex`}>
        {items.map((item, index) => (
          <StaggeredGridRow
            key={item._key ?? index}
            item={item}
            index={index + layoutIndexOffset}
            altBase={altBase}
            layoutTitle={seedSource}
          />
        ))}
      </div>
    </div>
  )
}
