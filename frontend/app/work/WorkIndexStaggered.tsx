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
  DENSE_PORTRAIT_MAX,
  DENSE_ROW_MARGIN,
  featureTemplate,
  type Orientation,
  pairTemplate,
  type RowJustify,
} from '@/app/components/staggeredLayout'
import type {GridRow, TileLead} from '@/app/work/workIndexRows'

/**
 * The Work index is an overview, so it places works + exhibitions TWO per row on the same 12-column
 * grid as the slug/detail pages rather than the one-image-per-row reveal. Each paired row draws an
 * orientation-aware template from the shared `staggeredLayout` primitives (portraits narrow,
 * landscapes wide) with `aria-hidden` spacer columns for deliberate negative space; tiles align to
 * the top of the row (no offsets), so rows tile cleanly and never overlap. The result reads as the
 * same visual system as the slug pages while roughly halving the scroll.
 *
 * A constant seed keeps the template choices deterministic across visits.
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
  // Paired tiles are roughly half the grid width on desktop, half-width on mobile.
  const sizes = '(min-width: 768px) 45vw, 50vw'

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

/** One clickable show — image + caption. Shared by the desktop paired rows and the mobile grid. */
function Tile({row, captionJustify}: {row: GridRow; captionJustify: RowJustify}) {
  const orientation = row.lead ? leadOrientation(row.lead) : 'landscape'
  const tier = (row.lead ? getEffectiveImageSizeOverride(row.lead) : undefined) ?? 'md'
  return (
    <Link href={row.href} className="block min-w-0 no-underline">
      {row.lead ? (
        <LeadImage lead={row.lead} title={row.title} orientation={orientation} tier={tier} />
      ) : (
        <LeadPlaceholder title={row.title} />
      )}
      <RowCaption title={row.title} metaLine={row.metaLine} justify={captionJustify} />
    </Link>
  )
}

function orientationOf(row: GridRow): Orientation {
  return row.lead ? leadOrientation(row.lead) : 'landscape'
}

/**
 * Two shows on the same 12-column grid as the slug pages. An orientation-aware template places a
 * narrow portrait beside a wide landscape (etc.) with `aria-hidden` spacer columns for negative
 * space; `items-start` aligns the tops so rows tile cleanly. Captions align to each tile's outer
 * edge (left tile left, right tile right), echoing the slug pages' position-aligned captions.
 */
function PairedRow({left, right, pairIndex}: {left: GridRow; right: GridRow; pairIndex: number}) {
  const t = pairTemplate(orientationOf(left), orientationOf(right), pairIndex, LAYOUT_SEED)
  return (
    <div className={`grid w-full grid-cols-12 items-start gap-x-5 ${DENSE_ROW_MARGIN} last:mb-0`}>
      {t.lead > 0 && <div className={`min-w-0 ${COL_SPAN[t.lead]}`} aria-hidden />}
      <div className={`min-w-0 ${COL_SPAN[t.left]}`}>
        <Tile row={left} captionJustify="left" />
      </div>
      {t.gap > 0 && <div className={`min-w-0 ${COL_SPAN[t.gap]}`} aria-hidden />}
      <div className={`min-w-0 ${COL_SPAN[t.right]}`}>
        <Tile row={right} captionJustify="right" />
      </div>
      {t.tail > 0 && <div className={`min-w-0 ${COL_SPAN[t.tail]}`} aria-hidden />}
    </div>
  )
}

/** A lone trailing show (odd count) rendered centered, reusing the slug center-row spans. */
function FeatureRow({row}: {row: GridRow}) {
  const spans = featureTemplate(orientationOf(row))
  return (
    <div className={`grid w-full grid-cols-12 items-start gap-x-5 ${DENSE_ROW_MARGIN} last:mb-0`}>
      <div className={`min-w-0 ${COL_SPAN[spans.lead]}`} aria-hidden />
      <div className={`min-w-0 ${COL_SPAN[spans.img]}`}>
        <Tile row={row} captionJustify="left" />
      </div>
      <div className={`min-w-0 ${COL_SPAN[spans.tail]}`} aria-hidden />
    </div>
  )
}

export function WorkIndexStaggered({rows}: {rows: GridRow[]}) {
  if (!rows.length) return null

  // Pair the sorted rows two at a time for the desktop grid; a trailing odd item becomes a feature row.
  const desktopRows: ReactNode[] = []
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i]
    const right = rows[i + 1]
    if (right) {
      desktopRows.push(
        <PairedRow key={left._id} left={left} right={right} pairIndex={i / 2} />,
      )
    } else {
      desktopRows.push(<FeatureRow key={left._id} row={left} />)
    }
  }

  return (
    <div className="w-full">
      <div className="grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-8 md:hidden">
        {rows.map((row) => (
          <Tile key={row._id} row={row} captionJustify="left" />
        ))}
      </div>
      <div className="hidden w-full min-w-0 flex-col md:flex">{desktopRows}</div>
    </div>
  )
}
