import FeatureShowcase from '@/app/feature/FeatureShowcase'
import {buildHomepageCarouselSlides} from '@/sanity/lib/homepage-carousel'
import {sanityFetch} from '@/sanity/lib/live'
import {homepageCarouselQuery} from '@/sanity/lib/queries'

export default async function Page () {
	const {data} = await sanityFetch({
		query: homepageCarouselQuery,
	})
	const slides = buildHomepageCarouselSlides(data)

	return <FeatureShowcase slides={slides} />
}
