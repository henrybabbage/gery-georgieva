import type {Metadata} from 'next'
import SiteCopyright from '@/app/components/SiteCopyright'
import {WorkIndexStaggered} from '@/app/work/WorkIndexStaggered'
import {buildGridRows} from '@/app/work/workIndexRows'
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
