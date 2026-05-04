import Image from 'next/image'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {featureExhibitionListQuery} from '@/sanity/lib/queries'
import {getEffectiveImageSizeOverride, getImageSizePreset} from '@/sanity/lib/imageSize'
import {urlForImage} from '@/sanity/lib/utils'
import type {Metadata} from 'next'
import type {FeatureExhibitionListQueryResult} from '@/sanity.types'

export const metadata: Metadata = {title: 'Work'}

const shellClass = 'w-full max-w-[1260px]'

type ExhibitionListItem = FeatureExhibitionListQueryResult[number]

type MediaImageLead =
  | NonNullable<ExhibitionListItem['carouselImage']>
  | NonNullable<ExhibitionListItem['firstInstallImage']>

function leadMediaForExhibition(ex: ExhibitionListItem): MediaImageLead | null {
  if (ex.carouselImage?.asset) return ex.carouselImage
  if (ex.firstInstallImage?.asset) return ex.firstInstallImage
  return null
}

function ExhibitionGridTileImage({image, title}: {image: MediaImageLead; title: string}) {
  const preset = getImageSizePreset(getEffectiveImageSizeOverride(image))
  const url = image.asset ? urlForImage(image)?.width(preset.width).auto('format').url() : null
  if (!url) {
    return <div className="aspect-[4/3] w-full bg-placeholder" />
  }
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-placeholder">
      <Image
        src={url}
        alt={title}
        width={preset.width}
        height={preset.height}
        sizes="(max-width: 767px) 100vw, 33vw"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      />
    </div>
  )
}

export default async function ShowsIndexPage() {
  const {data} = await sanityFetch({
    query: featureExhibitionListQuery,
    perspective: 'published',
    stega: false,
  })
  const list = (data ?? []) as FeatureExhibitionListQueryResult

  return (
    <div className="px-5 py-6">
      <div className={`${shellClass} text-left`}>
        {list.length === 0 ? (
          <p className="text-base">No exhibitions yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 md:gap-y-7">
            {list.map((ex) => {
              const lead = leadMediaForExhibition(ex)
              const metaLine = [ex.venue, ex.location, ex.year]
                .filter((v) => v != null && v !== '')
                .join(', ')
              return (
                <Link
                  key={ex._id}
                  href={`/shows/${ex.slug}`}
                  className="group block text-left no-underline"
                >
                  {lead ? (
                    <ExhibitionGridTileImage image={lead} title={ex.title} />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-end bg-placeholder p-3">
                      <span className="text-sm text-[var(--color-ink)]">{ex.title}</span>
                    </div>
                  )}
                  <div className="mt-2 flex flex-col gap-px text-left text-sm leading-snug text-[var(--color-ink)]">
                    <p className="m-0">{ex.title}</p>
                    {metaLine !== '' && <p className="m-0">{metaLine}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
