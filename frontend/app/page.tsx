import FeatureShowcase from '@/app/feature/FeatureShowcase'
import {sanityFetch} from '@/sanity/lib/live'
import {featureExhibitionListQuery} from '@/sanity/lib/queries'

const FEATURE_GALLERY_IMAGE_SRCS = Array.from(
	{length: 10},
	(_, index) => `/images/gery-georgieva-${index + 1}.webp`,
) as readonly string[]

export default async function Page () {
	const {data: exhibitions} = await sanityFetch({
		query: featureExhibitionListQuery,
	})

	return (
		<FeatureShowcase
			imageSrcs={FEATURE_GALLERY_IMAGE_SRCS}
			exhibitions={exhibitions}
		/>
	)
}
