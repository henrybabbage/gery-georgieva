import {notFound} from 'next/navigation'
import {draftMode} from 'next/headers'
import {ExhibitionStaggeredMedia} from '@/app/components/exhibition-staggered-media'
import CustomPortableText from '@/app/components/PortableText'
import {ExhibitionRelatedPreviewLink} from '@/app/exhibition/exhibition-related-preview-link'
import {formatExhibitionRun, formatExhibitionVenueLine} from '@/lib/format-exhibition-meta'
import {detailPagePinReferenceRootClass} from '@/lib/detail-page-pin-reference-classes'
import {sanityFetch} from '@/sanity/lib/live'
import {exhibitionQuery, exhibitionSlugQuery} from '@/sanity/lib/queries'
import type {PortableTextBlock} from 'next-sanity'
import type {Metadata} from 'next'
import type {ExhibitionQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

/** Above this count, show 5 images → about → remaining images. */
const INSTALLATION_GALLERY_SPLIT_THRESHOLD = 10
const INSTALLATION_GALLERY_LEAD_COUNT = 5

const installationGalleryShellClass = 'mb-12 w-full max-w-[1260px] mx-auto lg:mb-[100px]'

const EPHEMERA_CATEGORY_LABEL: Record<string, string> = {
  research: 'Research',
  sketch: 'Sketch',
  reference: 'Reference',
  documentation: 'Documentation',
  correspondence: 'Correspondence',
  other: 'Other',
}

function ephemeraCategoryLabel(category: string): string {
  return EPHEMERA_CATEGORY_LABEL[category] ?? category
}

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
  const isWorksSectionVisible =
    exhibition.showWorksSection === true && (exhibition.relatedWorks?.length ?? 0) > 0
  const isEphemeraSectionVisible =
    exhibition.showEphemeraSection === true && (exhibition.relatedEphemera?.length ?? 0) > 0

  const textColumnShellClass = 'w-full max-w-[1260px] mx-auto'
  const textMeasureClass = 'max-w-[72ch]'
  const hasTrailingLinksColumn =
    isWorksSectionVisible ||
    isEphemeraSectionVisible ||
    Boolean(exhibition.externalDocumentationLink)

  const pageChromeClass = [
    'px-5',
    'py-8',
    hasTrailingLinksColumn ? detailPagePinReferenceRootClass : '',
  ]
    .filter(Boolean)
    .join(' ')

  const mainColumn = (
    <>
      <header className={`${textColumnShellClass} mb-10 sm:mb-12`}>
        <h1 className={`${textMeasureClass} text-base font-normal`}>{exhibition.title}</h1>
      </header>

      {leadInstallationImages.length > 0 && (
        <div className={installationGalleryShellClass}>
          <ExhibitionStaggeredMedia
            items={leadInstallationImages}
            altBase={altBase}
            layoutTitle={layoutTitle}
            galleryImageCount={installationImages.length}
          />
        </div>
      )}

      {showAboutSection && (
        <section
          className={`${textColumnShellClass} mb-12 lg:mb-16`}
          aria-label="About this exhibition"
        >
          {hasAboutMeta && (
            <div
              className={`${textMeasureClass} space-y-2 text-base text-[var(--color-ink)] ${hasDescription ? 'mb-8' : ''}`}
            >
              {runLabel && <p>{runLabel}</p>}
              {venueLine && <p>{venueLine}</p>}
            </div>
          )}
          {hasDescription && (
            <CustomPortableText
              className={`${textMeasureClass} text-base`}
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
            galleryImageCount={installationImages.length}
          />
        </div>
      )}
    </>
  )

  const trailingLinksColumn = (
    <div className={`${textColumnShellClass} text-left`}>
      {isWorksSectionVisible && (
        <section>
          <h2 className={`${textMeasureClass} text-base mb-2 text-left`}>Works</h2>
          <div className="grid grid-cols-1 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 md:gap-y-7">
            {(exhibition.relatedWorks ?? []).map((work) => (
              <ExhibitionRelatedPreviewLink
                key={work._id}
                href={`/work/${work.slug}`}
                label={work.title}
                destination="work"
                galleryLead={work.galleryLead}
                coverImage={work.coverImage}
                subtitle={
                  [work.year, work.medium].filter(Boolean).length > 0
                    ? [work.year, work.medium].filter(Boolean).join(', ')
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {isEphemeraSectionVisible && (
        <section className={isWorksSectionVisible ? 'mt-10 lg:mt-12' : 'mt-6'}>
          <h2 className={`${textMeasureClass} text-base mb-2 text-left`}>Research & Ephemera</h2>
          <div className="grid grid-cols-1 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 md:gap-y-7">
            {(exhibition.relatedEphemera ?? []).map((ep) => (
              <ExhibitionRelatedPreviewLink
                key={ep._id}
                href={`/ephemera/${ep.slug}`}
                label={ep.title}
                destination="ephemera"
                galleryLead={ep.imagesLead}
                descriptionPlain={ep.descriptionPlain}
                subtitle={
                  [ep.category ? ephemeraCategoryLabel(ep.category) : null, ep.year].filter(
                    (v) => v != null && v !== '',
                  ).length > 0
                    ? [ep.category ? ephemeraCategoryLabel(ep.category) : null, ep.year]
                        .filter((v) => v != null && v !== '')
                        .join(', ')
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {exhibition.externalDocumentationLink && (
        <p className={`${textMeasureClass} mt-6 text-base text-left`}>
          <a
            href={exhibition.externalDocumentationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            External documentation ↗
          </a>
        </p>
      )}
    </div>
  )

  return (
    <div className={pageChromeClass}>
      {hasTrailingLinksColumn ? (
        <>
          <div className="min-h-0">{mainColumn}</div>
          {trailingLinksColumn}
        </>
      ) : (
        mainColumn
      )}
    </div>
  )
}
