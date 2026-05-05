import {notFound} from 'next/navigation'
import {draftMode} from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import {WorkStaggeredGallery} from '@/app/work/[slug]/WorkStaggeredGallery'
import {detailPagePinReferenceRootClass} from '@/lib/DetailPagePinReferenceClasses'
import {sanityFetch} from '@/sanity/lib/live'
import {workQuery, workSlugQuery} from '@/sanity/lib/queries'
import {urlForImage} from '@/sanity/lib/utils'
import type {Metadata} from 'next'
import type {WorkQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

/** Match `frontend/app/exhibition/[slug]/page.tsx` so installation-style media uses the same width. */
const installationGalleryShellClass = 'mb-12 w-full max-w-[1260px] mx-auto lg:mb-[100px]'

const textColumnShellClass = 'w-full max-w-[1260px] mx-auto'
const textMeasureClass = 'max-w-[72ch]'

/**
 * Cover image is used on grids / carousel; the primary work media block is `gallery`.
 * When the gallery is empty, still show the cover so the page is not blank.
 */
function WorkCoverOnly({
  coverImage,
  altBase,
}: {
  coverImage: NonNullable<NonNullable<WorkQueryResult>['coverImage']>
  altBase: string
}) {
  const asset = coverImage.asset
  if (!asset) return null
  const url = urlForImage(coverImage)?.width(1200).auto('format').url()
  if (!url) return null
  const meta = asset.metadata?.dimensions
  const ratio =
    meta?.width && meta?.height && meta.width > 0 && meta.height > 0
      ? meta.width / meta.height
      : 4 / 3
  const w = meta?.width && meta.width > 0 ? meta.width : 1200
  const h = meta?.height && meta.height > 0 ? meta.height : Math.round(1200 / ratio)
  const alt = asset.altText?.trim() || altBase

  return (
    <div className="relative w-full min-w-0 bg-placeholder">
      <Image
        src={url}
        alt={alt}
        width={w}
        height={h}
        sizes="(max-width: 768px) 100vw, 48rem"
        className="block h-auto w-full max-w-full object-contain"
      />
    </div>
  )
}

export async function generateStaticParams() {
  const {data} = await sanityFetch({query: workSlugQuery, perspective: 'published', stega: false})
  return data ?? []
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const {isEnabled: allowHidden} = await draftMode()
  const {data} = await sanityFetch({
    query: workQuery,
    params: {slug, allowHidden},
    stega: false,
  })
  return {title: data?.title}
}

export default async function WorkPage({params}: Props) {
  const {slug} = await params
  const {isEnabled: allowHidden} = await draftMode()
  const {data} = await sanityFetch({query: workQuery, params: {slug, allowHidden}})
  const work = data as WorkQueryResult

  if (!work) notFound()

  const isRelatedResearchVisible =
    work.showRelatedResearchSection === true && (work.relatedEphemera?.length ?? 0) > 0

  const hasFooterSections =
    isRelatedResearchVisible || (work.exhibitions && work.exhibitions.length > 0)

  const hasExhibitions = Boolean(work.exhibitions && work.exhibitions.length > 0)

  const galleryBlock =
    work.gallery && work.gallery.length > 0 ? (
      <div className={installationGalleryShellClass}>
        <WorkStaggeredGallery
          items={work.gallery}
          altBase={work.title}
          layoutTitle={work.title}
          galleryImageCount={work.gallery.length}
        />
      </div>
    ) : (
      work.coverImage && (
        <div className={installationGalleryShellClass}>
          <WorkCoverOnly coverImage={work.coverImage} altBase={work.title} />
        </div>
      )
    )

  const relatedResearchSection = isRelatedResearchVisible && (
    <section>
      <h2 className={`${textMeasureClass} text-base tracking-widest mb-2 text-left`}>
        Related research
      </h2>
      <ul className="space-y-1">
        {(work.relatedEphemera ?? []).map((ep) => (
          <li key={ep._id} className={`${textMeasureClass} text-base`}>
            {ep.title}
            {ep.category && <span className="ml-2">{ep.category}</span>}
          </li>
        ))}
      </ul>
    </section>
  )

  const exhibitedInSection = hasExhibitions && (
    <section>
      <h2 className={`${textMeasureClass} text-base tracking-widest mb-2 text-left`}>
        Exhibited in
      </h2>
      <ul className="space-y-1">
        {(work.exhibitions ?? []).map((ex) => (
          <li key={ex._id} className={`${textMeasureClass} text-base`}>
            {ex.hidePublicPage === true ? (
              <span>{ex.title}</span>
            ) : (
              <Link href={`/exhibition/${ex.slug}`}>{ex.title}</Link>
            )}
            {ex.venue && <span className="ml-2">{ex.venue}</span>}
            {ex.year && <span className="ml-2">{ex.year}</span>}
          </li>
        ))}
      </ul>
    </section>
  )

  const pageChromeClass = ['px-5', 'py-8', hasExhibitions ? detailPagePinReferenceRootClass : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={pageChromeClass}>
      <div className="min-h-0">
        <header className={`${textColumnShellClass} mb-10 sm:mb-12`}>
          <h1 className={`${textMeasureClass} text-base font-normal mb-1`}>{work.title}</h1>
          <p className={`${textMeasureClass} text-base mb-6`}>
            {[work.year, work.medium, work.dimensions].filter(Boolean).join(', ')}
          </p>
        </header>

        {galleryBlock}

        {hasExhibitions
          ? relatedResearchSection && (
              <div className={`${textColumnShellClass} text-left`}>{relatedResearchSection}</div>
            )
          : hasFooterSections &&
            relatedResearchSection && (
              <div className={`${textColumnShellClass} text-left`}>{relatedResearchSection}</div>
            )}
      </div>

      {hasExhibitions && (
        <div className={`${textColumnShellClass} text-left`}>{exhibitedInSection}</div>
      )}
    </div>
  )
}
