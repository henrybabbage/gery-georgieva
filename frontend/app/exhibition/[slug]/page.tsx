import {notFound} from 'next/navigation'
import Link from 'next/link'
import {stegaClean} from '@sanity/client/stega'
import {sanityFetch} from '@/sanity/lib/live'
import {exhibitionQuery, exhibitionSlugQuery} from '@/sanity/lib/queries'
import type {Metadata} from 'next'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: exhibitionSlugQuery,
    perspective: 'published',
    stega: false,
  })
  return data ?? []
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const {data} = await sanityFetch({query: exhibitionQuery, params: {slug}, stega: false})
  return {title: data?.title}
}

export default async function ExhibitionPage({params}: Props) {
  const {slug} = await params
  const {data: exhibition} = await sanityFetch({query: exhibitionQuery, params: {slug}})

  if (!exhibition) notFound()

  return (
    <div className="px-5 py-8 max-w-3xl">
      <p className="text-base opacity-50 mb-6">
        <Link href="/">← Work</Link>
      </p>

      <h1 className="text-base font-normal mb-1">{exhibition.title}</h1>
      <p className="text-base opacity-50 mb-1">
        {[exhibition.exhibitionType, exhibition.venue, exhibition.location, exhibition.year]
          .filter(Boolean)
          .join(', ')}
      </p>
      {exhibition.startDate && (
        <p className="text-base opacity-40 mb-6">
          {exhibition.startDate}
          {exhibition.endDate && ` — ${exhibition.endDate}`}
        </p>
      )}

      {/* Installation images placeholder */}
      {exhibition.installationImages && exhibition.installationImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-8">
          {exhibition.installationImages.map((item, i) => {
            const isAudience =
              item._type === 'mediaImage' &&
              stegaClean(item.isAudiencePhoto)
            return (
              <div
                key={item._key ?? i}
                className={`bg-[#e8e7e3] aspect-video ${isAudience ? 'outline outline-1 outline-offset-[-4px] outline-[#deded9]' : ''}`}
              />
            )
          })}
        </div>
      )}

      {/* Works in this exhibition */}
      {exhibition.relatedWorks && exhibition.relatedWorks.length > 0 && (
        <section>
          <h2 className="text-base uppercase tracking-widest opacity-40 mb-2">Works</h2>
          <ul className="space-y-1">
            {exhibition.relatedWorks.map((work) => (
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

      {exhibition.relatedEphemera && exhibition.relatedEphemera.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base uppercase tracking-widest opacity-40 mb-2">Research & ephemera</h2>
          <ul className="space-y-1">
            {exhibition.relatedEphemera.map((ep) => (
              <li key={ep._id} className="text-base">
                <Link href={`/ephemera/${ep.slug}`} className="underline underline-offset-2">
                  {ep.title}
                </Link>
                {ep.category && <span className="opacity-50 ml-2">{ep.category}</span>}
                {ep.year && <span className="opacity-50 ml-2">{ep.year}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {exhibition.externalDocumentationLink && (
        <p className="mt-6 text-base">
          <a
            href={exhibition.externalDocumentationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 opacity-50"
          >
            External documentation ↗
          </a>
        </p>
      )}
    </div>
  )
}
