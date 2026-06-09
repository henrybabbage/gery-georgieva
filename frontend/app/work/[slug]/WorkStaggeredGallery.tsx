import {
  ExhibitionStaggeredMedia,
  type ExhibitionInstallationImage,
} from '@/app/exhibition/components/ExhibitionStaggeredMedia'
import type {WorkQueryResult} from '@/sanity.types'

type WorkGalleryItems = NonNullable<NonNullable<WorkQueryResult>['gallery']>

type WorkStaggeredGalleryProps = {
  items: WorkGalleryItems
  altBase: string
  layoutTitle: string
  layoutIndexOffset?: number
  galleryImageCount?: number
  showInlineCredits?: boolean
}

/**
 * Work detail `gallery` uses the same staggered grid + caption-below-media layout as
 * exhibition installation images (`ExhibitionStaggeredMedia`).
 */
export function WorkStaggeredGallery({
  items,
  galleryImageCount,
  showInlineCredits,
  ...props
}: WorkStaggeredGalleryProps) {
  if (!items.length) return null
  return (
    <ExhibitionStaggeredMedia
      {...props}
      items={items as ExhibitionInstallationImage[]}
      galleryImageCount={galleryImageCount ?? items.length}
      showInlineCredits={showInlineCredits}
    />
  )
}
