import type {FeatureExhibitionListQueryResult} from '@/sanity.types'

type ExhibitionItem = FeatureExhibitionListQueryResult[number]

type ExhibitionLead =
  | NonNullable<ExhibitionItem['carouselImage']>
  | NonNullable<ExhibitionItem['firstInstallImage']>

export type TileLead = ExhibitionLead

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

export function buildGridRows(
  exhibitions: FeatureExhibitionListQueryResult,
): GridRow[] {
  const rows: GridRow[] = exhibitions
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
    }))

  rows.sort((a, b) => {
    if (b.sortYear !== a.sortYear) return b.sortYear - a.sortYear
    const rankCmp = a.sortRank.localeCompare(b.sortRank)
    if (rankCmp !== 0) return rankCmp
    return a.title.localeCompare(b.title)
  })

  return rows
}
