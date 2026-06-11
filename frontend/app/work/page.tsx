import type {Metadata} from 'next'
import SiteCopyright from '@/app/components/SiteCopyright'
import {WorkIndexStaggered} from '@/app/work/WorkIndexStaggered'
import {buildGridRows} from '@/app/work/workIndexRows'
import {sanityFetch} from '@/sanity/lib/live'
import {featureExhibitionListQuery} from '@/sanity/lib/queries'
import type {FeatureExhibitionListQueryResult} from '@/sanity.types'

export const metadata: Metadata = {title: 'Work'}

const shellClass = 'w-full max-w-[1260px] mx-auto'

export default async function WorkIndexPage() {
  const {data: exhibitionData} = await sanityFetch({
    query: featureExhibitionListQuery,
    perspective: 'published',
    stega: false,
  })

  const exhibitions = (exhibitionData ?? []) as FeatureExhibitionListQueryResult
  const rows = buildGridRows(exhibitions)

  return (
    <div className="px-5 py-6 pb-10">
      <div className={`${shellClass} text-left`}>
        {rows.length === 0 ? (
          <p className="text-base">No work yet.</p>
        ) : (
          <WorkIndexStaggered rows={rows} />
        )}
      </div>
      <SiteCopyright />
    </div>
  )
}
