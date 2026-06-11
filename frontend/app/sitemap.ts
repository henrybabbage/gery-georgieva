import {type MetadataRoute} from 'next'
import {headers} from 'next/headers'
import {sanityFetch} from '@/sanity/lib/live'
import {workAndExhibitionSlugQuery, pressArticleSlugQuery} from '@/sanity/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const base = `https://${host}`

  const [{data: workAndExhibitionSlugs}, {data: pressArticles}] = await Promise.all([
    sanityFetch({query: workAndExhibitionSlugQuery, perspective: 'published', stega: false}),
    sanityFetch({query: pressArticleSlugQuery, perspective: 'published', stega: false}),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {url: base, lastModified: new Date(), priority: 1, changeFrequency: 'weekly'},
    {url: `${base}/feature`, lastModified: new Date(), priority: 0.8, changeFrequency: 'weekly'},
    {url: `${base}/work`, lastModified: new Date(), priority: 0.85, changeFrequency: 'weekly'},
    {url: `${base}/contact`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly'},
    {url: `${base}/cv`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly'},
    {url: `${base}/press`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly'},
    {url: `${base}/archive`, lastModified: new Date(), priority: 0.5, changeFrequency: 'yearly'},
  ]

  const uniqueSlugs = [
    ...new Set(
      (workAndExhibitionSlugs ?? []).map((row: {slug: string}) => row.slug).filter(Boolean),
    ),
  ]

  const workRoutes: MetadataRoute.Sitemap = uniqueSlugs.map((slug) => ({
    url: `${base}/work/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const pressArticleRoutes: MetadataRoute.Sitemap = (pressArticles ?? [])
    .filter((row): row is {slug: string} => typeof row.slug === 'string' && Boolean(row.slug))
    .map(({slug}) => ({
      url: `${base}/press/${slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.55,
    }))

  return [...staticRoutes, ...workRoutes, ...pressArticleRoutes]
}
