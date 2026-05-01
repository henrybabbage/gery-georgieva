import {notFound} from 'next/navigation'
import Link from 'next/link'
import {draftMode} from 'next/headers'
import {ExhibitionStaggeredMedia} from '@/app/components/exhibition-staggered-media'
import CustomPortableText from '@/app/components/PortableText'
import {formatExhibitionRun, formatExhibitionVenueLine} from '@/lib/format-exhibition-meta'
import {sanityFetch} from '@/sanity/lib/live'
import {exhibitionQuery, exhibitionSlugQuery} from '@/sanity/lib/queries'
import type {PortableTextBlock} from 'next-sanity'
import type {Metadata} from 'next'
import type {ExhibitionQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

/** Above this count, show 5 images → about → remaining images. */
const INSTALLATION_GALLERY_SPLIT_THRESHOLD = 10
const INSTALLATION_GALLERY_LEAD_COUNT = 5

const installationGalleryShellClass =
  'mx-auto mb-12 w-full max-w-[1260px] lg:mb-[100px] lg:px-[30px]'

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

  const runLabel = formatExhibitionRun(exhibition.startDate, exhibition.endDate, exhibition.year)
  const venueLine = formatExhibitionVenueLine(exhibition.venue, exhibition.location)
  const hasDescription = (exhibition.description?.length ?? 0) > 0
  const hasAboutMeta = Boolean(runLabel || venueLine)
  const showAboutSection = hasDescription || hasAboutMeta

  const installationImages = exhibition.installationImages ?? []
  const splitInstallationGallery = installationImages.length > INSTALLATION_GALLERY_SPLIT_THRESHOLD
  const leadInstallationImages = splitInstallationGallery
    ? installationImages.slice(0, INSTALLATION_GALLERY_LEAD_COUNT)
    : installationImages
  const tailInstallationImages = splitInstallationGallery
    ? installationImages.slice(INSTALLATION_GALLERY_LEAD_COUNT)
    : []

  const layoutTitle = exhibition.title ?? ''
  const altBase = exhibition.title ?? 'Installation'

  return (
    <div className="px-5 py-8">
      <header className="mx-auto max-w-3xl mb-10 sm:mb-12">
        <h1 className="text-base font-normal">{exhibition.title}</h1>
      </header>

      {leadInstallationImages.length > 0 && (
        <div className={installationGalleryShellClass}>
          <ExhibitionStaggeredMedia
            items={leadInstallationImages}
            altBase={altBase}
            layoutTitle={layoutTitle}
          />
        </div>
      )}

      {showAboutSection && (
        <section
          className="mx-auto mb-12 w-full max-w-[1260px] lg:mb-16 lg:px-[30px]"
          aria-label="About this exhibition"
        >
          {hasAboutMeta && (
            <div
              className={`max-w-[72ch] space-y-2 text-base text-[var(--color-ink)] ${hasDescription ? 'mb-8' : ''}`}
            >
              {runLabel && <p>{runLabel}</p>}
              {venueLine && <p>{venueLine}</p>}
            </div>
          )}
          {hasDescription && (
            <CustomPortableText
              className="max-w-[72ch] text-base"
              value={exhibition.description as PortableTextBlock[]}
            />
          )}
        </section>
      )}

      {tailInstallationImages.length > 0 && (
        <div className={installationGalleryShellClass}>
          <ExhibitionStaggeredMedia
            items={tailInstallationImages}
            altBase={altBase}
            layoutTitle={layoutTitle}
            layoutIndexOffset={INSTALLATION_GALLERY_LEAD_COUNT}
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
