import type {ReactNode} from 'react'
import Image from 'next/image'
import {stegaClean} from '@sanity/client/stega'
import type {ExhibitionQueryResult} from '@/sanity.types'
import {
  ExhibitionExpandableGalleryImage,
  type ExhibitionExpandableGalleryImageProps,
} from '@/app/components/exhibition-expandable-gallery-image'
import {
  getEffectiveImageSizeOverride,
  getImageSizePreset,
  type ImageSizeOverride,
} from '@/sanity/lib/imageSize'
import {urlForImage} from '@/sanity/lib/utils'
import {
  ExhibitionVimeoEmbed,
  ExhibitionVimeoPlaybackProvider,
} from '@/app/components/exhibition-vimeo-embed'

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

/** Tier for grid + portrait cap: videos use `md` anchor. */
function getInstallationLayoutTier(item: ExhibitionInstallationImage): ImageSizeOverride {
  if (item._type !== 'mediaImage') return 'md'
  return getEffectiveImageSizeOverride(item) ?? 'md'
}

/** Subtle portrait height steps; `md` matches historical single cap. */
const EXHIBITION_PORTRAIT_MAX: Record<ImageSizeOverride, string> = {
  sm: 'max-h-[min(78vh,820px)]',
  md: 'max-h-[min(85vh,900px)]',
  lg: 'max-h-[min(88vh,940px)]',
  xl: 'max-h-[min(91vh,980px)]',
}

const COL_SPAN: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
}

/** `col-start-{13 - imgSpan}` so a right-aligned image block ends at column 12. */
const RIGHT_IMAGE_START: Record<number, string> = {
  3: 'col-start-10',
  4: 'col-start-9',
  5: 'col-start-8',
  6: 'col-start-7',
  7: 'col-start-6',
  8: 'col-start-5',
}

function leftRightImageColSpan(orientation: Orientation, tier: ImageSizeOverride): number {
  if (orientation === 'portrait') {
    const byTier: Record<ImageSizeOverride, number> = {sm: 3, md: 4, lg: 5, xl: 6}
    return byTier[tier]
  }
  /** `md` was identical to `lg` here (both 6) — landscape never grew for lg; step by column. */
  const byTier: Record<ImageSizeOverride, number> = {sm: 5, md: 6, lg: 7, xl: 8}
  return byTier[tier]
}

function getCenterRowSpans(
  orientation: Orientation,
  tier: ImageSizeOverride,
): {lead: number; img: number; tail: number} {
  if (orientation === 'portrait') {
    switch (tier) {
      case 'sm':
        return {lead: 4, img: 3, tail: 5}
      case 'md':
        return {lead: 3, img: 4, tail: 5}
      case 'lg':
        return {lead: 3, img: 5, tail: 4}
      case 'xl':
        return {lead: 2, img: 6, tail: 4}
    }
  }
  switch (tier) {
    case 'sm':
      return {lead: 3, img: 5, tail: 4}
    case 'md':
      return {lead: 2, img: 6, tail: 4}
    case 'lg':
      return {lead: 1, img: 7, tail: 4}
    case 'xl':
      return {lead: 1, img: 8, tail: 3}
  }
}

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
  const tier = getInstallationLayoutTier(item)
  const preset = getImageSizePreset(getEffectiveImageSizeOverride(item) ?? 'md')
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
    portraitMaxClass: orientation === 'portrait' ? EXHIBITION_PORTRAIT_MAX[tier] : '',
  }
}

function GalleryMediaTile({
  item,
  altBase,
  sizes,
  orientation,
  playbackKey,
}: {
  item: ExhibitionInstallationImage
  altBase: string
  sizes: string
  orientation: Orientation
  /** Stable id for single-active Vimeo playback within the gallery. */
  playbackKey?: string
}) {
  const tier = getInstallationLayoutTier(item)
  const portraitMax = orientation === 'portrait' ? EXHIBITION_PORTRAIT_MAX[tier] : ''

  if (item._type === 'mediaImage') {
    const preset = getImageSizePreset(getEffectiveImageSizeOverride(item) ?? 'md')
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
          className="block h-auto w-full max-w-full object-contain"
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
      const vimeoWrap = `relative aspect-video w-full max-w-full overflow-hidden bg-black ${orientation === 'portrait' ? portraitMax : ''}`
      return (
        <ExhibitionVimeoEmbed
          vimeoId={id}
          play={item.vimeo?.asset?.play ?? undefined}
          title={item.vimeo?.asset?.name ?? 'Vimeo video'}
          posterUrl={item.vimeo?.asset?.thumbnail ?? null}
          playbackId={playbackKey ?? id}
          className={vimeoWrap}
        />
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
    <div className="flex aspect-video w-full items-center justify-center bg-placeholder px-4 text-center text-sm leading-snug text-[var(--color-muted)]">
      {[caption, credit].filter(Boolean).join(' — ')}
    </div>
  )
}

function SideCaption({item}: {item: ExhibitionInstallationImage}) {
  const caption = item.caption?.trim()
  const credit = item.credit?.trim()
  if (!caption && !credit) return null
  return (
    <div className="flex flex-col gap-px text-sm text-[var(--color-muted)]">
      {caption && (
        <p className={`m-0 max-w-prose ${credit ? 'leading-tight' : 'leading-none'}`}>{caption}</p>
      )}
      {credit && <p className="m-0 max-w-prose leading-none">{credit}</p>}
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

  const tier = getInstallationLayoutTier(item)
  const imgColN = leftRightImageColSpan(orientation, tier)
  const capColN = 12 - imgColN
  const imgSpan = COL_SPAN[imgColN]
  const capSpan = COL_SPAN[capColN]
  const rightImageStart = RIGHT_IMAGE_START[imgColN]
  const centerSpans = getCenterRowSpans(orientation, tier)
  const leadSpacerClass = COL_SPAN[centerSpans.lead]
  const centerImgSpanClass = COL_SPAN[centerSpans.img]
  const tailCaptionClass = COL_SPAN[centerSpans.tail]

  const expandableProps =
    item._type === 'mediaImage' ? getExpandableImageProps(item, altBase, sizes, orientation) : null

  const media =
    expandableProps != null ? (
      <ExhibitionExpandableGalleryImage {...expandableProps} />
    ) : (
      <GalleryMediaTile
        item={item}
        altBase={altBase}
        sizes={sizes}
        orientation={orientation}
        playbackKey={item._key}
      />
    )
  const captionEl = hasSideCaption ? <SideCaption item={item} /> : null

  let grid: ReactNode

  const mediaCellClass = (extra: string) =>
    `min-w-0 ${imgSpan} flex flex-col justify-end self-stretch ${extra}`.trim()
  const captionCellClass = `min-w-0 ${capSpan} flex flex-col justify-end self-stretch text-left`
  const captionCellClassCenter = (span: string) =>
    `min-w-0 ${span} flex flex-col justify-end self-stretch text-left`

  if (justify === 'left') {
    grid = (
      <div className="grid w-full grid-cols-12 items-stretch gap-x-5 gap-y-4">
        <div className={mediaCellClass('')}>{media}</div>
        {captionEl && <div className={captionCellClass}>{captionEl}</div>}
      </div>
    )
  } else if (justify === 'right') {
    grid = (
      <div className="grid w-full grid-cols-12 items-stretch gap-x-5 gap-y-4">
        {captionEl && <div className={captionCellClass}>{captionEl}</div>}
        <div className={mediaCellClass(captionEl ? '' : rightImageStart)}>{media}</div>
      </div>
    )
  } else {
    grid = (
      <div className="grid w-full grid-cols-12 items-stretch gap-x-5 gap-y-4">
        <div className={`${leadSpacerClass} min-w-0`} aria-hidden />
        <div className={`min-w-0 ${centerImgSpanClass} flex flex-col justify-end self-stretch`}>{media}</div>
        {captionEl ? (
          <div className={captionCellClassCenter(tailCaptionClass)}>{captionEl}</div>
        ) : (
          <div className={`min-w-0 ${tailCaptionClass}`} aria-hidden />
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
              playbackKey={item._key}
            />
            {(item.caption?.trim() || item.credit?.trim()) && (
              <div className="mt-3 flex flex-col gap-px text-sm text-[var(--color-muted)]">
                {item.caption?.trim() && (
                  <p
                    className={`m-0 max-w-prose ${item.credit?.trim() ? 'leading-tight' : 'leading-none'}`}
                  >
                    {item.caption.trim()}
                  </p>
                )}
                {item.credit?.trim() && (
                  <p className="m-0 max-w-prose leading-none">{item.credit.trim()}</p>
                )}
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
  items: ExhibitionInstallationImage[]
  altBase: string
  /** Exhibition title (or any stable string) — seeds deterministic left/center/right rhythm. */
  layoutTitle: string
  /** When the gallery is split across sections, offset so desktop row rhythm continues (e.g. 5 after first block of 5). */
  layoutIndexOffset?: number
}) {
  if (!items.length) return null

  const seedSource = layoutTitle.trim() || altBase

  return (
    <ExhibitionVimeoPlaybackProvider>
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
    </ExhibitionVimeoPlaybackProvider>
  )
}
