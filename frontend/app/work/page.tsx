import type {Metadata} from 'next'
import SiteCopyright from '@/app/components/SiteCopyright'
import {WorkIndexStaggered, type GridRow} from '@/app/work/WorkIndexStaggered'
import {sanityFetch} from '@/sanity/lib/live'
import {
  featureExhibitionListQuery,
  workPublicGridQuery,
} from '@/sanity/lib/queries'
import type {
  FeatureExhibitionListQueryResult,
  WorkPublicGridQueryResult,
} from '@/sanity.types'

export const metadata: Metadata = {title: 'Work'}

const shellClass = 'w-full max-w-[1260px] mx-auto'

type ExhibitionItem = FeatureExhibitionListQueryResult[number]
type WorkItem = WorkPublicGridQueryResult[number]

function leadMediaForExhibition(ex: ExhibitionItem): GridRow['lead'] {
  if (ex.carouselImage?.asset) return ex.carouselImage
  if (ex.firstInstallImage?.asset) return ex.firstInstallImage
  return null
}

function leadMediaForWork(work: WorkItem): GridRow['lead'] {
  if (work.coverImage?.asset) return work.coverImage
  if (work.firstGalleryStill?.asset) return work.firstGalleryStill
  return null
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
    <div className="px-5 py-6 pb-10">
      <div className={`${shellClass} text-left`}>
        {rows.length === 0 ? (
          <p className="text-base">No work or exhibitions yet.</p>
        ) : (
          <WorkIndexStaggered rows={rows} />
        )}
      </div>
      <SiteCopyright />
    </div>
  )
}
