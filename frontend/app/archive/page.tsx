import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {archiveQuery} from '@/sanity/lib/queries'
import type {Metadata} from 'next'

export const metadata: Metadata = {title: 'Archive'}

export default async function ArchivePage() {
  const {data: works} = await sanityFetch({query: archiveQuery})

  return (
    <div className="px-5 py-8">
      <h1 className="text-base font-normal mb-6">Archive — pre-2015</h1>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {works?.map((work: {_id: string; slug: string; title: string; year?: number}) => (
          <li key={work._id}>
            <Link href={`/work/${work.slug}`} className="block text-base">
              <div className="aspect-[4/3] bg-placeholder mb-1" />
              <span>{work.title}</span>
              {work.year && <span className="ml-2">{work.year}</span>}
            </Link>
          </li>
        ))}
        {!works?.length && (
          <li className="col-span-full text-base">No archived works yet.</li>
        )}
      </ul>
    </div>
  )
}
