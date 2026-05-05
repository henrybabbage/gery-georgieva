import FeatureShowcase from '@/app/FeatureShowcase'
import {buildHomepageCarouselSlides} from '@/sanity/lib/HomepageCarousel'
import {sanityFetch} from '@/sanity/lib/live'
import {homepageCarouselQuery} from '@/sanity/lib/queries'

export default async function Page() {
  const {data} = await sanityFetch({
    query: homepageCarouselQuery,
  })
  const slides = buildHomepageCarouselSlides(data)

  return <FeatureShowcase slides={slides} />
}
