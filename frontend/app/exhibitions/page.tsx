import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {featureExhibitionListQuery} from '@/sanity/lib/queries'
import type {FeatureExhibitionListQueryResult} from '@/sanity.types'
import type {Metadata} from 'next'

export const metadata: Metadata = {title: 'Work'}

export default async function ExhibitionsPage() {
  const {data: exhibitions} = await sanityFetch({
    query: featureExhibitionListQuery,
  })
  const list = exhibitions as FeatureExhibitionListQueryResult | null

  return (
    <div className="px-5 py-8">
      <p className="text-base opacity-50 mb-6 max-w-3xl">
        <Link href="/">← Home</Link>
      </p>
      <h1 className="text-base font-normal mb-6 max-w-3xl">Work</h1>
      <ul className="max-w-3xl space-y-3">
        {list?.map((ex) => {
          const meta = [ex.venue, ex.location, ex.year].filter(Boolean).join(', ')
          return (
            <li key={ex._id} className="text-base">
              <Link href={`/exhibition/${ex.slug}`} className="underline underline-offset-2">
                {ex.title}
              </Link>
              {meta && <span className="opacity-50 ml-2">{meta}</span>}
            </li>
          )
        })}
        {!list?.length && <li className="text-base opacity-40">No exhibitions yet.</li>}
      </ul>
    </div>
  )
}
