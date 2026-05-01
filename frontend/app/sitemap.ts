import {type MetadataRoute} from 'next'
import {headers} from 'next/headers'
import {sanityFetch} from '@/sanity/lib/live'
import {workSlugQuery, exhibitionSlugQuery} from '@/sanity/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const base = `https://${host}`

  const [{data: works}, {data: exhibitions}] = await Promise.all([
    sanityFetch({query: workSlugQuery, perspective: 'published', stega: false}),
    sanityFetch({query: exhibitionSlugQuery, perspective: 'published', stega: false}),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    {url: base, lastModified: new Date(), priority: 1, changeFrequency: 'weekly'},
    {url: `${base}/feature`, lastModified: new Date(), priority: 0.8, changeFrequency: 'weekly'},
    {url: `${base}/exhibitions`, lastModified: new Date(), priority: 0.85, changeFrequency: 'weekly'},
    {url: `${base}/contact`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly'},
    {url: `${base}/cv`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly'},
    {url: `${base}/press`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly'},
    {url: `${base}/archive`, lastModified: new Date(), priority: 0.5, changeFrequency: 'yearly'},
  ]

  const workRoutes: MetadataRoute.Sitemap = (works ?? []).map(({slug}: {slug: string}) => ({
    url: `${base}/work/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const exhibitionRoutes: MetadataRoute.Sitemap = (exhibitions ?? []).map(
    ({slug}: {slug: string}) => ({
      url: `${base}/exhibition/${slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    }),
  )

  return [...staticRoutes, ...workRoutes, ...exhibitionRoutes]
}
