import {notFound} from 'next/navigation'
import {draftMode} from 'next/headers'
import {ExhibitionDetail} from '@/app/exhibition/ExhibitionDetail'
import {sanityFetch} from '@/sanity/lib/live'
import {exhibitionQuery, exhibitionSlugQuery} from '@/sanity/lib/queries'
import type {Metadata} from 'next'
import type {ExhibitionQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: exhibitionSlugQuery,
    perspective: 'published',
    stega: false,
  })
  return data ?? []
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const {isEnabled: allowHidden} = await draftMode()
  const {data} = await sanityFetch({
    query: exhibitionQuery,
    params: {slug, allowHidden},
    stega: false,
  })
  return {title: (data as ExhibitionQueryResult | null)?.title}
}

export default async function WorkSlugPage({params}: Props) {
  const {slug} = await params
  const {isEnabled: allowHidden} = await draftMode()
  const {data} = await sanityFetch({
    query: exhibitionQuery,
    params: {slug, allowHidden},
  })

  const exhibition = data as ExhibitionQueryResult
  if (!exhibition) notFound()

  return <ExhibitionDetail exhibition={exhibition} />
}
