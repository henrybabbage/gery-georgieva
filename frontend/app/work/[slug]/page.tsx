import {notFound} from 'next/navigation'
import {draftMode} from 'next/headers'
import {ExhibitionDetail} from '@/app/exhibition/ExhibitionDetail'
import {WorkDetail} from '@/app/work/[slug]/WorkDetail'
import {sanityFetch} from '@/sanity/lib/live'
import {
  exhibitionQuery,
  workAndExhibitionSlugQuery,
  workQuery,
} from '@/sanity/lib/queries'
import type {Metadata} from 'next'
import type {ExhibitionQueryResult, WorkQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: workAndExhibitionSlugQuery,
    perspective: 'published',
    stega: false,
  })
  const slugs = [...new Set((data ?? []).map((row: {slug: string}) => row.slug))]
  return slugs.map((slug) => ({slug}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const {isEnabled: allowHidden} = await draftMode()
  const [{data: exhibitionData}, {data: workData}] = await Promise.all([
    sanityFetch({
      query: exhibitionQuery,
      params: {slug, allowHidden},
      stega: false,
    }),
    sanityFetch({
      query: workQuery,
      params: {slug, allowHidden},
      stega: false,
    }),
  ])
  const title =
    (exhibitionData as ExhibitionQueryResult | null)?.title ??
    (workData as WorkQueryResult | null)?.title
  return {title}
}

export default async function WorkSlugPage({params}: Props) {
  const {slug} = await params
  const {isEnabled: allowHidden} = await draftMode()
  const [{data: exhibitionData}, {data: workData}] = await Promise.all([
    sanityFetch({query: exhibitionQuery, params: {slug, allowHidden}}),
    sanityFetch({query: workQuery, params: {slug, allowHidden}}),
  ])

  const exhibition = exhibitionData as ExhibitionQueryResult
  if (exhibition) return <ExhibitionDetail exhibition={exhibition} />

  const work = workData as WorkQueryResult
  if (work) return <WorkDetail work={work} />

  notFound()
}
