import {notFound} from 'next/navigation'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {ephemeraQuery, ephemeraSlugQuery} from '@/sanity/lib/queries'
import CustomPortableText from '@/app/components/PortableText'
import type {PortableTextBlock} from 'next-sanity'
import type {Metadata} from 'next'
import type {EphemeraQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: ephemeraSlugQuery,
    perspective: 'published',
    stega: false,
  })
  return data ?? []
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const {data} = await sanityFetch({query: ephemeraQuery, params: {slug}, stega: false})
  return {title: data?.title}
}

export default async function EphemeraPage({params}: Props) {
  const {slug} = await params
  const {data} = await sanityFetch({query: ephemeraQuery, params: {slug}})
  const item = data as EphemeraQueryResult

  if (!item) notFound()

  return (
    <div className="px-5 py-8 max-w-2xl">
      <p className="text-base opacity-50 mb-6">
        <Link href="/">← Work</Link>
      </p>

      <h1 className="text-base font-normal mb-1">{item.title}</h1>
      {(item.category || item.year) && (
        <p className="text-base opacity-50 mb-6">
          {[item.category, item.year].filter(Boolean).join(', ')}
        </p>
      )}

      {item.description && item.description.length > 0 && (
        <CustomPortableText
          className="text-base mb-8"
          value={item.description as PortableTextBlock[]}
        />
      )}

      {item.relatedWork && item.relatedWork.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base uppercase tracking-widest opacity-40 mb-2">Works</h2>
          <ul className="space-y-1">
            {item.relatedWork.map((work) => (
              <li key={work._id} className="text-base">
                <Link href={`/work/${work.slug}`} className="underline underline-offset-2">
                  {work.title}
                </Link>
                {work.year && <span className="opacity-50 ml-2">{work.year}</span>}
                {work.medium && <span className="opacity-50 ml-2">{work.medium}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.relatedExhibitions && item.relatedExhibitions.length > 0 && (
        <section>
          <h2 className="text-base uppercase tracking-widest opacity-40 mb-2">Exhibitions</h2>
          <ul className="space-y-1">
            {item.relatedExhibitions.map((ex) => (
              <li key={ex._id} className="text-base">
                {ex.hidePublicPage === true ? (
                  <span>{ex.title}</span>
                ) : (
                  <Link href={`/exhibition/${ex.slug}`} className="underline underline-offset-2">
                    {ex.title}
                  </Link>
                )}
                {ex.venue && <span className="opacity-50 ml-2">{ex.venue}</span>}
                {ex.location && <span className="opacity-50 ml-2">{ex.location}</span>}
                {ex.year && <span className="opacity-50 ml-2">{ex.year}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
