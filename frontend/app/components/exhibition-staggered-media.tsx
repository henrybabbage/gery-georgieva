import Image from 'next/image'
import {stegaClean} from '@sanity/client/stega'
import type {ExhibitionQueryResult} from '@/sanity.types'
import {getEffectiveImageSizeOverride, getImageSizePreset} from '@/sanity/lib/imageSize'
import {urlForImage} from '@/sanity/lib/utils'

/** Matches `installationImages` from `exhibitionQuery` (TypeGen); allows `asset: null` from GROQ. */
export type ExhibitionInstallationImage = NonNullable<
  NonNullable<ExhibitionQueryResult>['installationImages']
>[number]

/**
 * Desktop layout copied from the selected Paper panel (MCP: `get_selection` → Frame `C-0` “Gery Georgieva”):
 * - Row containers: `align-items: flex-start` (Paper MCP), 24-col grid, horizontal gap 12px, `margin` 30px L/R,
 *   `margin-bottom` 100px on each row in Paper — we use a slightly larger gap on web so stacked rows read clearly.
 * - Slot placement from `get_computed_styles` on each row’s direct children (DOM order = slot order).
 * - Long galleries: repeat this full 11-row panel cycle so rhythm matches the design.
 *
 * Row index | Paper node | Slots (col span / start / -100px stagger)
 * 0  D-0  | 8+8+8
 * 1  V-0  | 12+12
 * 2  13-0 | 8+8+8, stagger on 3rd slot
 * 3  1C-0 | start 4, span 18 (single wide)
 * 4  1J-0 | 8+8+8, stagger on 1st slot
 * 5  1X-0 | 8+8+8
 * 6  26-0 | 8+8+8
 * 7  2M-0 | 8+8+8
 * 8  2V-0 | start 4, span 18
 * 9  32-0 | 8+8+8
 * 10 3B-0 | 8+8+8, stagger on 3rd slot
 */

type PaperSlot = {
  colSpan: 8 | 12 | 18
  /** Explicit grid column start (1-based). When set with colSpan 18, matches Paper `gridColumnStart: "4"`. */
  colStart?: number
  /** Paper uses `marginTop: "-100px"` on specific cells for vertical stagger (desktop only). */
  staggerUp?: boolean
}

type PaperPanelRow = {slots: PaperSlot[]}

const PAPER_PANEL_ROWS: PaperPanelRow[] = [
  {slots: [{colSpan: 8}, {colSpan: 8}, {colSpan: 8}]},
  {slots: [{colSpan: 12}, {colSpan: 12}]},
  {slots: [{colSpan: 8}, {colSpan: 8}, {colSpan: 8, staggerUp: true}]},
  {slots: [{colSpan: 18, colStart: 4}]},
  {slots: [{colSpan: 8, staggerUp: true}, {colSpan: 8}, {colSpan: 8}]},
  {slots: [{colSpan: 8}, {colSpan: 8}, {colSpan: 8}]},
  {slots: [{colSpan: 8}, {colSpan: 8}, {colSpan: 8}]},
  {slots: [{colSpan: 8}, {colSpan: 8}, {colSpan: 8}]},
  {slots: [{colSpan: 18, colStart: 4}]},
  {slots: [{colSpan: 8}, {colSpan: 8}, {colSpan: 8}]},
  {slots: [{colSpan: 8}, {colSpan: 8}, {colSpan: 8, staggerUp: true}]},
]

type PlannedPaperRow = {
  slots: PaperSlot[]
  items: ExhibitionInstallationImage[]
}

function selectPaperSlots(template: PaperPanelRow, useSlots: number): PaperSlot[] {
  if (useSlots >= template.slots.length) return template.slots
  if (useSlots === 1) return [template.slots[Math.floor(template.slots.length / 2)]]
  if (useSlots === 2 && template.slots.length === 3) return [template.slots[0], template.slots[2]]
  return template.slots.slice(0, useSlots)
}

function planRowsFromPaperPanel(items: ExhibitionInstallationImage[]): PlannedPaperRow[] {
  const rows: PlannedPaperRow[] = []
  let itemIndex = 0
  let templateIndex = 0

  while (itemIndex < items.length) {
    const template = PAPER_PANEL_ROWS[templateIndex % PAPER_PANEL_ROWS.length]
    templateIndex += 1
    const remaining = items.length - itemIndex
    const useSlots = Math.min(template.slots.length, remaining)
    rows.push({
      slots: selectPaperSlots(template, useSlots),
      items: items.slice(itemIndex, itemIndex + useSlots),
    })
    itemIndex += useSlots
  }

  return rows
}

function paperSlotClassName(slot: PaperSlot): string {
  const spanClass =
    slot.colSpan === 8 ? 'col-span-8' : slot.colSpan === 12 ? 'col-span-12' : 'col-span-[18]'
  /** Paper wide blocks use `grid-column: 4 / span 18` only; keep literal for Tailwind JIT. */
  const startClass = slot.colStart === 4 ? 'col-start-4' : ''
  const staggerClass = slot.staggerUp ? 'lg:-mt-[100px]' : ''
  return ['min-w-0', spanClass, startClass, staggerClass].filter(Boolean).join(' ')
}

function getImageAlt(item: ExhibitionInstallationImage & {_type: 'mediaImage'}, altBase: string): string {
  const asset = item.asset as {altText?: string} | null | undefined
  return asset?.altText?.trim() || item.caption?.trim() || altBase
}

function GalleryMediaTile({
  item,
  altBase,
  sizes,
}: {
  item: ExhibitionInstallationImage
  altBase: string
  sizes: string
}) {
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
      <div className={`relative w-full bg-placeholder ${frameClass}`}>
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
      <video className="aspect-video w-full bg-black object-contain" controls playsInline preload="metadata">
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
        <div className="relative aspect-video w-full overflow-hidden bg-black">
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
        <div className="relative aspect-video w-full overflow-hidden bg-black">
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

function MediaCaption({item}: {item: ExhibitionInstallationImage}) {
  const caption = item.caption?.trim()
  const credit = item.credit?.trim()
  if (!caption && !credit) return null
  return (
    <div className="mt-2 space-y-0.5 text-base text-[#8a8880]">
      {caption && <p>{caption}</p>}
      {credit && <p className="opacity-70">{credit}</p>}
    </div>
  )
}

/** Match ~1260px artboard layout; below this, single-column scroll (design is desktop-first). */
const EXHIBITION_DESKTOP_MIN = '(min-width: 1100px)'

function MobileStack({items, altBase}: {items: ExhibitionInstallationImage[]; altBase: string}) {
  return (
    <div className="flex min-[1100px]:hidden w-full min-w-0 flex-col gap-14 sm:gap-16">
      {items.map((item, i) => (
        <div key={item._key ?? i} className="min-w-0">
          <GalleryMediaTile
            item={item}
            altBase={altBase}
            sizes="100vw"
          />
          <MediaCaption item={item} />
        </div>
      ))}
    </div>
  )
}

function desktopSizesForSlot(slot: PaperSlot): string {
  if (slot.colSpan === 18) {
    return `${EXHIBITION_DESKTOP_MIN} min(900px, 75vw), (max-width: 1099px) 100vw`
  }
  if (slot.colSpan === 12) {
    return `${EXHIBITION_DESKTOP_MIN} 50vw, (max-width: 1099px) 100vw`
  }
  return `${EXHIBITION_DESKTOP_MIN} 33vw, (max-width: 1099px) 100vw`
}

/** Vertical space between row groups — Paper row `margin-bottom` is 100px; extra margin reads as “between images” on the web. */
const ROW_GROUP_MARGIN_BOTTOM = 'mb-[190px]'

function DesktopStagger({items, altBase}: {items: ExhibitionInstallationImage[]; altBase: string}) {
  const rows = planRowsFromPaperPanel(items)

  return (
    <div className="hidden min-[1100px]:flex w-full min-w-0 flex-col">
      {rows.map((row, rowIndex) => {
        const isLast = rowIndex === rows.length - 1
        const rowMb = isLast ? '' : ROW_GROUP_MARGIN_BOTTOM

        return (
          <div
            key={`row-${rowIndex}`}
            className={`grid w-full grid-cols-[repeat(24,minmax(0,1fr))] items-start gap-x-3 ${rowMb}`}
          >
            {row.items.map((item, slotIndex) => {
              const slot = row.slots[slotIndex]
              if (!slot) return null
              return (
                <div key={item._key ?? `${rowIndex}-${slotIndex}`} className={paperSlotClassName(slot)}>
                  <GalleryMediaTile item={item} altBase={altBase} sizes={desktopSizesForSlot(slot)} />
                  <MediaCaption item={item} />
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export function ExhibitionStaggeredMedia({
  items,
  altBase,
}: {
  items: NonNullable<NonNullable<ExhibitionQueryResult>['installationImages']>
  altBase: string
}) {
  if (!items.length) return null

  return (
    <div className="w-full">
      <MobileStack items={items} altBase={altBase} />
      <DesktopStagger items={items} altBase={altBase} />
    </div>
  )
}
