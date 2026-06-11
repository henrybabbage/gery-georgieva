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

export function buildGridRows(
  exhibitions: FeatureExhibitionListQueryResult,
  works: WorkPublicGridQueryResult,
): GridRow[] {
  const rows: GridRow[] = [
    ...exhibitions
      .filter((ex) => ex.hidePublicPage !== true)
      .map((ex) => ({
        _id: ex._id,
        href: `/work/${ex.slug}`,
        title: ex.title,
        metaLine: [ex.venue, ex.location, ex.year]
          .filter((v) => v != null && v !== '')
          .join(', '),
        lead: leadMediaForExhibition(ex),
        sortYear: ex.year ?? -1,
        sortRank: ex.orderRank ?? '',
      })),
    ...works
      .filter((work) => work.hidePublicPage !== true)
      .map((work) => ({
        _id: work._id,
        href: `/work/${work.slug}`,
        title: work.title,
        metaLine: [work.year, work.medium]
          .filter((v) => v != null && v !== '')
          .join(', '),
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
