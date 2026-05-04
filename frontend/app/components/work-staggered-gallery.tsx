import {
  ExhibitionStaggeredMedia,
  type ExhibitionInstallationImage,
} from '@/app/components/exhibition-staggered-media'
import type {WorkQueryResult} from '@/sanity.types'

type WorkGalleryItems = NonNullable<NonNullable<WorkQueryResult>['gallery']>

type WorkStaggeredGalleryProps = {
  items: WorkGalleryItems
  altBase: string
  layoutTitle: string
  layoutIndexOffset?: number
  galleryImageCount?: number
}

/**
 * Work detail `gallery` uses the same staggered grid + caption-below-media layout as
 * exhibition installation images (`ExhibitionStaggeredMedia`).
 */
export function WorkStaggeredGallery({
  items,
  galleryImageCount,
  ...props
}: WorkStaggeredGalleryProps) {
  if (!items.length) return null
  return (
    <ExhibitionStaggeredMedia
      {...props}
      items={items as ExhibitionInstallationImage[]}
      galleryImageCount={galleryImageCount ?? items.length}
    />
  )
}
