import type {Metadata} from 'next'

import ScrollingGallery048 from '@/app/components/feature/ScrollingGallery048'

export const metadata: Metadata = {
	title: 'Feature',
}

const FEATURE_GALLERY_IMAGE_SRCS = Array.from(
	{ length: 10 },
	(_, index) => `/images/gery-georgieva-${index + 1}.webp`,
) as readonly string[]

export default function FeaturePage () {
	return <ScrollingGallery048 imageSrcs={FEATURE_GALLERY_IMAGE_SRCS} />
}
