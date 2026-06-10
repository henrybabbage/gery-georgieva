import Image from 'next/image'
import Link from 'next/link'
import {
  getEffectiveImageSizeOverride,
  getImageSizePreset,
  type ImageSizeOverride,
} from '@/sanity/lib/imageSize'
import {urlForImage} from '@/sanity/lib/utils'
import {
  COL_SPAN,
  DENSE_BAND_MARGIN,
  DENSE_OFFSET_PATTERN,
  DENSE_PORTRAIT_MAX,
  denseBandSizes,
  denseSpansForBand,
  type Orientation,
  type RowJustify,
} from '@/app/components/staggeredLayout'
import type {
  FeatureExhibitionListQueryResult,
  WorkPublicGridQueryResult,
} from '@/sanity.types'

type ExhibitionItem = FeatureExhibitionListQueryResult[number]
type WorkItem = WorkPublicGridQueryResult[number]

type ExhibitionLead =
  | NonNullable<ExhibitionItem['carouselImage']>
  | NonNullable<ExhibitionItem['firstInstallImage']>

type WorkLead =
  | NonNullable<WorkItem['coverImage']>
  | NonNullable<WorkItem['firstGalleryStill']>

export type TileLead = ExhibitionLead | WorkLead

export type GridRow = {
  _id: string
  href: string
  title: string
  metaLine: string
  lead: TileLead | null
  sortYear: number
  sortRank: string
}

/**
 * The Work index is an overview, so it packs works + exhibitions into dense bands of 2–3 shows per
 * row rather than the one-image-per-row reveal of the slug/detail pages. It still shares the slug
 * pages' visual language — the 12-column grid, asymmetric column spans, natural aspect ratios, fluid
 * spacing, and caption typography all come from the shared `staggeredLayout` primitives — so the
 * index reads as the same system while scanning quickly instead of forcing a long single-file scroll.
 *
 * A constant seed keeps the band sizes, column spans, and offsets deterministic across visits.
 */
const LAYOUT_SEED = 'Work'

function leadOrientation(lead: TileLead): Orientation {
  const d = lead.asset?.metadata?.dimensions
  if (d?.width && d?.height && d.width > 0 && d.height > 0) {
    return d.height > d.width ? 'portrait' : 'landscape'
  }
  return 'landscape'
}

function LeadImage({
  lead,
  title,
  orientation,
  tier,
}: {
  lead: TileLead
  title: string
  orientation: Orientation
  tier: ImageSizeOverride
}) {
  const preset = getImageSizePreset(tier)
  const url = lead.asset ? urlForImage(lead)?.width(preset.width).auto('format').url() : null
  const d = lead.asset?.metadata?.dimensions
  const naturalW = d?.width && d.width > 0 ? d.width : preset.width
  const naturalH = d?.height && d.height > 0 ? d.height : preset.height
  const portraitMax = orientation === 'portrait' ? DENSE_PORTRAIT_MAX : ''
  // Dense tiles are ~⅓ width on desktop, half width on mobile.
  const sizes = '(min-width: 768px) 33vw, 50vw'

  if (!url) {
    return <div className="aspect-[4/3] w-full bg-placeholder" />
  }
  return (
    <div className={`relative w-full bg-placeholder ${portraitMax}`}>
      <Image
        src={url}
        alt={title}
        width={naturalW}
        height={naturalH}
        sizes={sizes}
        className="block h-auto w-full object-contain"
      />
    </div>
  )
}

function LeadPlaceholder({title}: {title: string}) {
  return (
    <div className="flex aspect-[4/3] w-full items-end bg-placeholder p-3">
      <span className="text-sm text-[var(--color-ink)]">{title}</span>
    </div>
  )
}

function RowCaption({
  title,
  metaLine,
  justify,
}: {
  title: string
  metaLine: string
  justify: RowJustify
}) {
  const alignClass = justify === 'right' ? 'items-end text-right' : 'items-start text-left'
  return (
    <div
      className={`mt-2 flex flex-col gap-px text-sm leading-snug text-[var(--color-ink)] ${alignClass}`}
    >
      <p className="m-0">{title}</p>
      {metaLine !== '' && <p className="m-0">{metaLine}</p>}
    </div>
  )
}

/** One clickable show — image + caption. Shared by the desktop bands and the mobile grid. */
function Tile({row}: {row: GridRow}) {
  const orientation = row.lead ? leadOrientation(row.lead) : 'landscape'
  const tier = (row.lead ? getEffectiveImageSizeOverride(row.lead) : undefined) ?? 'md'
  return (
    <Link href={row.href} className="block min-w-0 no-underline">
      {row.lead ? (
        <LeadImage lead={row.lead} title={row.title} orientation={orientation} tier={tier} />
      ) : (
        <LeadPlaceholder title={row.title} />
      )}
      <RowCaption title={row.title} metaLine={row.metaLine} justify="left" />
    </Link>
  )
}

/**
 * A desktop band of 2–3 shows laid across the 12-column grid. Column spans and small vertical
 * offsets come from the shared dense primitives, so the band keeps the slug pages' asymmetric,
 * staggered rhythm while packing several shows into one viewport.
 */
function DesktopBand({items, bandIndex}: {items: GridRow[]; bandIndex: number}) {
  const spans = denseSpansForBand(items.length, bandIndex, LAYOUT_SEED)
  return (
    <div className={`grid w-full grid-cols-12 items-start gap-x-5 ${DENSE_BAND_MARGIN} last:mb-0`}>
      {items.map((row, i) => (
        <div
          key={row._id}
          className={`min-w-0 ${COL_SPAN[spans[i]]} ${DENSE_OFFSET_PATTERN[i % DENSE_OFFSET_PATTERN.length]}`}
        >
          <Tile row={row} />
        </div>
      ))}
    </div>
  )
}

export function WorkIndexStaggered({rows}: {rows: GridRow[]}) {
  if (!rows.length) return null

  // Slice the sorted rows into deterministic bands of 2–3 for the desktop grid.
  const bandSizes = denseBandSizes(rows.length, LAYOUT_SEED)
  const bands: GridRow[][] = []
  let cursor = 0
  for (const size of bandSizes) {
    bands.push(rows.slice(cursor, cursor + size))
    cursor += size
  }

  return (
    <div className="w-full">
      <div className="grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-8 md:hidden">
        {rows.map((row) => (
          <Tile key={row._id} row={row} />
        ))}
      </div>
      <div className="hidden w-full min-w-0 flex-col md:flex">
        {bands.map((items, bandIndex) => (
          <DesktopBand key={items[0]._id} items={items} bandIndex={bandIndex} />
        ))}
      </div>
    </div>
  )
}
