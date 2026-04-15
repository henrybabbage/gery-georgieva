import {notFound} from 'next/navigation'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {ephemeraQuery, ephemeraSlugQuery} from '@/sanity/lib/queries'
import CustomPortableText from '@/app/components/PortableText'
import type {Metadata} from 'next'

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
  const {data: item} = await sanityFetch({query: ephemeraQuery, params: {slug}})

  if (!item) notFound()

  return (
    <div className="px-5 py-8 max-w-2xl">
      <p className="text-xs opacity-50 mb-6">
        <Link href="/">← Work</Link>
      </p>

      <h1 className="text-lg font-normal mb-1">{item.title}</h1>
      {(item.category || item.year) && (
        <p className="text-sm opacity-50 mb-6">
          {[item.category, item.year].filter(Boolean).join(', ')}
        </p>
      )}

      {item.description && item.description.length > 0 && (
        <CustomPortableText
          className="text-sm mb-8"
          value={item.description}
        />
      )}

      {item.relatedWork && item.relatedWork.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-widest opacity-40 mb-2">Works</h2>
          <ul className="space-y-1">
            {item.relatedWork.map((work: {_id: string; slug: string; title: string; year?: number; medium?: string}) => (
              <li key={work._id} className="text-sm">
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
          <h2 className="text-xs uppercase tracking-widest opacity-40 mb-2">Exhibitions</h2>
          <ul className="space-y-1">
            {item.relatedExhibitions.map((ex: {_id: string; slug: string; title: string; year?: number; venue?: string; location?: string}) => (
              <li key={ex._id} className="text-sm">
                <Link href={`/exhibition/${ex.slug}`} className="underline underline-offset-2">
                  {ex.title}
                </Link>
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
