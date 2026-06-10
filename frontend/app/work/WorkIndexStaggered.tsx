import type {ReactNode} from 'react'
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
  getCenterRowSpans,
  justifyForIndex,
  leftRightImageColSpan,
  MOBILE_STACK_GAP,
  type Orientation,
  PORTRAIT_MAX,
  RIGHT_IMAGE_START,
  ROW_MARGIN_BOTTOM,
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
 * The Work index lays out works + exhibitions in the same staggered single-image-per-row rhythm as
 * the slug/detail pages (`ExhibitionStaggeredMedia`), so the index reads as the same visual system
 * as the pages it links into. All layout math comes from the shared `staggeredLayout` primitives.
 *
 * A constant seed keeps the left/center/right rhythm deterministic across visits; because the index
 * always has more than three rows, the first three force left → center → right (via `justifyForIndex`).
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
  const portraitMax = orientation === 'portrait' ? PORTRAIT_MAX[tier] : ''
  const sizes =
    orientation === 'portrait' ? '(min-width: 768px) 30vw, 100vw' : '(min-width: 768px) 45vw, 100vw'

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
        className="block h-auto w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]"
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

function DesktopRow({row, index, count}: {row: GridRow; index: number; count: number}) {
  const justify = justifyForIndex(index, LAYOUT_SEED, count)
  const orientation = row.lead ? leadOrientation(row.lead) : 'landscape'
  const tier = (row.lead ? getEffectiveImageSizeOverride(row.lead) : undefined) ?? 'md'

  const media = row.lead ? (
    <LeadImage lead={row.lead} title={row.title} orientation={orientation} tier={tier} />
  ) : (
    <LeadPlaceholder title={row.title} />
  )

  const content = (
    <>
      {media}
      <RowCaption title={row.title} metaLine={row.metaLine} justify={justify} />
    </>
  )

  let cells: ReactNode
  if (justify === 'left') {
    const imgSpan = COL_SPAN[leftRightImageColSpan(orientation, tier)]
    cells = <div className={`min-w-0 ${imgSpan}`}>{content}</div>
  } else if (justify === 'right') {
    const colN = leftRightImageColSpan(orientation, tier)
    cells = (
      <div className={`min-w-0 ${COL_SPAN[colN]} ${RIGHT_IMAGE_START[colN]}`}>{content}</div>
    )
  } else {
    const spans = getCenterRowSpans(orientation, tier)
    cells = (
      <>
        <div className={`min-w-0 ${COL_SPAN[spans.lead]}`} aria-hidden />
        <div className={`min-w-0 ${COL_SPAN[spans.img]}`}>{content}</div>
        <div className={`min-w-0 ${COL_SPAN[spans.tail]}`} aria-hidden />
      </>
    )
  }

  return (
    <Link
      href={row.href}
      className={`group block no-underline ${ROW_MARGIN_BOTTOM} last:mb-0`}
    >
      <div className="grid w-full grid-cols-12 gap-x-5">{cells}</div>
    </Link>
  )
}

function MobileRow({row}: {row: GridRow}) {
  const orientation = row.lead ? leadOrientation(row.lead) : 'landscape'
  const tier = (row.lead ? getEffectiveImageSizeOverride(row.lead) : undefined) ?? 'md'
  return (
    <Link href={row.href} className="group block min-w-0 no-underline">
      {row.lead ? (
        <LeadImage lead={row.lead} title={row.title} orientation={orientation} tier={tier} />
      ) : (
        <LeadPlaceholder title={row.title} />
      )}
      <RowCaption title={row.title} metaLine={row.metaLine} justify="left" />
    </Link>
  )
}

export function WorkIndexStaggered({rows}: {rows: GridRow[]}) {
  if (!rows.length) return null
  return (
    <div className="w-full">
      <div className={`flex w-full min-w-0 flex-col md:hidden ${MOBILE_STACK_GAP}`}>
        {rows.map((row) => (
          <MobileRow key={row._id} row={row} />
        ))}
      </div>
      <div className="hidden w-full min-w-0 flex-col md:flex">
        {rows.map((row, index) => (
          <DesktopRow key={row._id} row={row} index={index} count={rows.length} />
        ))}
      </div>
    </div>
  )
}
