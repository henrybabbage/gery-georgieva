import {notFound} from 'next/navigation'
import Link from 'next/link'
import {draftMode} from 'next/headers'
import {ExhibitionStaggeredMedia} from '@/app/components/exhibition-staggered-media'
import CustomPortableText from '@/app/components/PortableText'
import {sanityFetch} from '@/sanity/lib/live'
import {exhibitionQuery, exhibitionSlugQuery} from '@/sanity/lib/queries'
import type {PortableTextBlock} from 'next-sanity'
import type {Metadata} from 'next'
import type {ExhibitionQueryResult} from '@/sanity.types'

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
  const {isEnabled: allowHidden} = await draftMode()
  const {data} = await sanityFetch({
    query: exhibitionQuery,
    params: {slug, allowHidden},
    stega: false,
  })
  return {title: data?.title}
}

export default async function ExhibitionPage({params}: Props) {
  const {slug} = await params
  const {isEnabled: allowHidden} = await draftMode()
  const {data} = await sanityFetch({
    query: exhibitionQuery,
    params: {slug, allowHidden},
  })
  const exhibition = data as ExhibitionQueryResult

  if (!exhibition) notFound()

  const placeLine = [exhibition.venue, exhibition.location].filter(Boolean).join(' · ')
  const yearPlaceLine = [exhibition.year != null ? String(exhibition.year) : null, placeLine || null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="px-5 py-8">
      <header className="mx-auto max-w-3xl mb-10 sm:mb-12">
        <h1 className="text-[22px] leading-tight sm:text-[28px] font-normal mb-3">{exhibition.title}</h1>
        {yearPlaceLine && <p className="text-base opacity-60 mb-2">{yearPlaceLine}</p>}
        {(exhibition.startDate || exhibition.endDate) && (
          <p className="text-sm opacity-50 mb-4">
            {exhibition.startDate && exhibition.endDate
              ? `${exhibition.startDate} — ${exhibition.endDate}`
              : (exhibition.startDate ?? exhibition.endDate)}
          </p>
        )}
        {exhibition.description && exhibition.description.length > 0 && (
          <CustomPortableText
            className="text-base opacity-90 max-w-prose"
            value={exhibition.description as PortableTextBlock[]}
          />
        )}
      </header>

      {exhibition.installationImages && exhibition.installationImages.length > 0 && (
        <div className="mx-auto mb-12 w-full max-w-[1260px] lg:mb-[100px] lg:px-[30px]">
          <ExhibitionStaggeredMedia
            items={exhibition.installationImages}
            altBase={exhibition.title ?? 'Installation'}
          />
        </div>
      )}

      <div className="mx-auto max-w-3xl">
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
    </div>
  )
}
