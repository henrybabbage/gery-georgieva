import {notFound} from 'next/navigation'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {workQuery, workSlugQuery} from '@/sanity/lib/queries'
import type {Metadata} from 'next'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const {data} = await sanityFetch({query: workSlugQuery, perspective: 'published', stega: false})
  return data ?? []
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const {data} = await sanityFetch({query: workQuery, params: {slug}, stega: false})
  return {title: data?.title}
}

export default async function WorkPage({params}: Props) {
  const {slug} = await params
  const {data: work} = await sanityFetch({query: workQuery, params: {slug}})

  if (!work) notFound()

  return (
    <div className="px-5 py-8 max-w-3xl">
      <p className="text-xs opacity-50 mb-6">
        <Link href="/">← Work</Link>
      </p>

      <h1 className="text-lg font-normal mb-1">{work.title}</h1>
      <p className="text-sm opacity-50 mb-6">
        {[work.year, work.medium, work.dimensions].filter(Boolean).join(', ')}
      </p>

      {/* Gallery placeholder — swap in MediaGallery component */}
      {work.gallery && work.gallery.length > 0 && (
        <div className="space-y-2 mb-8">
          {work.gallery.map((_item: unknown, i: number) => (
            <div
              key={i}
              className="bg-[#e8e7e3] aspect-video"
            />
          ))}
        </div>
      )}

      {/* Relational back-links */}
      {work.exhibitions && work.exhibitions.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest opacity-40 mb-2">Exhibited in</h2>
          <ul className="space-y-1">
            {work.exhibitions.map((ex) => (
              <li key={ex._id} className="text-sm">
                <Link href={`/exhibition/${ex.slug}`} className="underline underline-offset-2">
                  {ex.title}
                </Link>
                {ex.venue && <span className="opacity-50 ml-2">{ex.venue}</span>}
                {ex.year && <span className="opacity-50 ml-2">{ex.year}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {work.relatedEphemera && work.relatedEphemera.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest opacity-40 mb-2">Related research</h2>
          <ul className="space-y-1">
            {work.relatedEphemera.map((ep) => (
              <li key={ep._id} className="text-sm">
                {ep.title}
                {ep.category && <span className="opacity-50 ml-2">{ep.category}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
