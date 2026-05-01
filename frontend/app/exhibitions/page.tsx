import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {featureExhibitionListQuery} from '@/sanity/lib/queries'
import type {Metadata} from 'next'

export const metadata: Metadata = {title: 'Exhibitions'}

export default async function ExhibitionsPage() {
  const {data: exhibitions} = await sanityFetch({query: featureExhibitionListQuery})

  return (
    <div className="px-5 py-8">
      <p className="text-base opacity-50 mb-6 max-w-3xl">
        <Link href="/">← Work</Link>
      </p>
      <h1 className="text-base font-normal mb-6 max-w-3xl">Exhibitions</h1>
      <ul className="max-w-3xl space-y-3">
        {exhibitions?.map((ex) => {
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
        {!exhibitions?.length && <li className="text-base opacity-40">No exhibitions yet.</li>}
      </ul>
    </div>
  )
}
