import Image from 'next/image'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {
  featureExhibitionListQuery,
  workPublicGridQuery,
} from '@/sanity/lib/queries'
import {getEffectiveImageSizeOverride, getImageSizePreset} from '@/sanity/lib/imageSize'
import {urlForImage} from '@/sanity/lib/utils'
import type {Metadata} from 'next'
import type {
  FeatureExhibitionListQueryResult,
  WorkPublicGridQueryResult,
} from '@/sanity.types'

export const metadata: Metadata = {title: 'Work'}

const shellClass = 'w-full max-w-[1260px] mx-auto'

type ExhibitionItem = FeatureExhibitionListQueryResult[number]
type WorkItem = WorkPublicGridQueryResult[number]

type ExhibitionLead =
  | NonNullable<ExhibitionItem['carouselImage']>
  | NonNullable<ExhibitionItem['firstInstallImage']>

type WorkLead = NonNullable<WorkItem['coverImage']> | NonNullable<WorkItem['firstGalleryStill']>

type TileLead = ExhibitionLead | WorkLead

type GridRow = {
  _id: string
  href: string
  title: string
  metaLine: string
  lead: TileLead | null
  sortYear: number
  sortRank: string
}

function leadMediaForExhibition(ex: ExhibitionItem): ExhibitionLead | null {
  if (ex.carouselImage?.asset) return ex.carouselImage
  if (ex.firstInstallImage?.asset) return ex.firstInstallImage
  return null
}

function leadMediaForWork(work: WorkItem): WorkLead | null {
  if (work.coverImage?.asset) return work.coverImage
  if (work.firstGalleryStill?.asset) return work.firstGalleryStill
  return null
}

function GridTileImage({image, title}: {image: TileLead; title: string}) {
  const preset = getImageSizePreset(getEffectiveImageSizeOverride(image))
  const url = image.asset ? urlForImage(image)?.width(preset.width).auto('format').url() : null
  if (!url) {
    return <div className="aspect-[4/3] w-full bg-placeholder" />
  }
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-placeholder">
      <Image
        src={url}
        alt={title}
        width={preset.width}
        height={preset.height}
        sizes="(max-width: 767px) 100vw, 33vw"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      />
    </div>
  )
}

function buildGridRows(
  exhibitions: FeatureExhibitionListQueryResult,
  works: WorkPublicGridQueryResult,
): GridRow[] {
  const rows: GridRow[] = [
    ...exhibitions.map((ex) => ({
      _id: ex._id,
      href: `/exhibition/${ex.slug}`,
      title: ex.title,
      metaLine: [ex.venue, ex.location, ex.year].filter((v) => v != null && v !== '').join(', '),
      lead: leadMediaForExhibition(ex),
      sortYear: ex.year ?? -1,
      sortRank: ex.orderRank ?? '',
    })),
    ...works.map((work) => ({
      _id: work._id,
      href: `/work/${work.slug}`,
      title: work.title,
      metaLine: [work.year, work.medium].filter((v) => v != null && v !== '').join(', '),
      lead: leadMediaForWork(work),
      sortYear: work.year ?? -1,
      sortRank: work.orderRank ?? '',
    })),
  ]

  rows.sort((a, b) => {
    if (b.sortYear !== a.sortYear) return b.sortYear - a.sortYear
    const rankCmp = a.sortRank.localeCompare(b.sortRank)
    if (rankCmp !== 0) return rankCmp
    return a.title.localeCompare(b.title)
  })

  return rows
}

export default async function WorkIndexPage() {
  const [{data: exhibitionData}, {data: workData}] = await Promise.all([
    sanityFetch({
      query: featureExhibitionListQuery,
      perspective: 'published',
      stega: false,
    }),
    sanityFetch({
      query: workPublicGridQuery,
      perspective: 'published',
      stega: false,
    }),
  ])

  const exhibitions = (exhibitionData ?? []) as FeatureExhibitionListQueryResult
  const works = (workData ?? []) as WorkPublicGridQueryResult
  const rows = buildGridRows(exhibitions, works)

  return (
    <div className="px-5 py-6">
      <div className={`${shellClass} text-left`}>
        {rows.length === 0 ? (
          <p className="text-base">No work or exhibitions yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 md:gap-y-7">
            {rows.map((row) => (
              <Link
                key={row._id}
                href={row.href}
                className="group block text-left no-underline"
              >
                {row.lead ? (
                  <GridTileImage image={row.lead} title={row.title} />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-end bg-placeholder p-3">
                    <span className="text-sm text-[var(--color-ink)]">{row.title}</span>
                  </div>
                )}
                <div className="mt-2 flex flex-col gap-px text-left text-sm leading-snug text-[var(--color-ink)]">
                  <p className="m-0">{row.title}</p>
                  {row.metaLine !== '' && <p className="m-0">{row.metaLine}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
