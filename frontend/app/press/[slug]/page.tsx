import {notFound} from 'next/navigation'
import Link from 'next/link'
import type {PortableTextBlock} from 'next-sanity'
import type {Metadata} from 'next'
import {
  ExhibitionStaggeredMedia,
  type ExhibitionInstallationImage,
} from '@/app/components/exhibition-staggered-media'
import CustomPortableText from '@/app/components/PortableText'
import {formatPressPublicationDate} from '@/lib/format-press-meta'
import {sanityFetch} from '@/sanity/lib/live'
import {pressArticleBySlugQuery, pressArticleSlugQuery} from '@/sanity/lib/queries'
import type {PressArticleBySlugQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

type PressArticle = NonNullable<PressArticleBySlugQueryResult>

/** New internal press pages remain reachable without a production rebuild (on-demand ISR). */
export const dynamicParams = true

/** Same staggered layout as exhibition installation images (split when >10). Here: article text first, then gallery beneath. */
const INSTALLATION_GALLERY_SPLIT_THRESHOLD = 10
const INSTALLATION_GALLERY_LEAD_COUNT = 5

const installationGalleryShellClass =
  'mb-12 w-full max-w-[1260px] lg:mb-[100px]'

function isWrittenPressArticle(article: PressArticle): boolean {
  if (article.kind === 'url' || article.kind === 'pdf') {
    return false
  }
  if (article.kind === 'text') {
    return true
  }
  const hasOutbound = Boolean(
    (typeof article.url === 'string' && article.url.trim()) || article.pdfUrl,
  )
  return !hasOutbound
}

export async function generateStaticParams() {
  const {data} = await sanityFetch({
    query: pressArticleSlugQuery,
    perspective: 'published',
    stega: false,
  })
  return (data ?? []).filter((row) => row.slug).map((row) => ({slug: row.slug as string}))
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const {data} = await sanityFetch({
    query: pressArticleBySlugQuery,
    params: {slug},
    stega: false,
  })
  const article = data as PressArticle | null
  if (!article || !isWrittenPressArticle(article)) {
    return {title: 'Press'}
  }
  return {title: article.linkText ?? 'Press'}
}

export default async function PressArticlePage({params}: Props) {
  const {slug} = await params
  const {data} = await sanityFetch({
    query: pressArticleBySlugQuery,
    params: {slug},
  })
  const article = data as PressArticle | null

  if (!article || !isWrittenPressArticle(article)) {
    notFound()
  }

  const body = article.body as PortableTextBlock[] | null | undefined
  if (!body?.length) {
    notFound()
  }

  const articleImages = (article.articleImages ?? []) as ExhibitionInstallationImage[]
  const splitGallery = articleImages.length > INSTALLATION_GALLERY_SPLIT_THRESHOLD
  const leadArticleImages = splitGallery
    ? articleImages.slice(0, INSTALLATION_GALLERY_LEAD_COUNT)
    : articleImages
  const tailArticleImages = splitGallery ? articleImages.slice(INSTALLATION_GALLERY_LEAD_COUNT) : []

  const layoutTitle = article.linkText ?? 'Press'
  const altBase = article.linkText ?? 'Press'

  const dateLine = formatPressPublicationDate(article.publishedAt ?? null)
  const publication = article.publication?.trim()
  const author = article.author?.trim()
  const hasDescription = (body?.length ?? 0) > 0
  const hasAboutMeta = Boolean(dateLine || publication || author)
  const showAboutSection = hasDescription || hasAboutMeta

  return (
    <div className="px-5 py-8">
      <p className="max-w-3xl mb-6 text-base">
        <Link href="/press" className="underline underline-offset-2">
          Press
        </Link>
      </p>

      <header className="max-w-3xl mb-10 sm:mb-12">
        <h1 className="text-base font-normal">{article.linkText}</h1>
      </header>

      {showAboutSection && (
        <section
          className="mb-12 w-full max-w-[1260px] lg:mb-16"
          aria-label="Article"
        >
          {hasAboutMeta && (
            <div
              className={`max-w-[72ch] space-y-2 text-base text-[var(--color-ink)] ${hasDescription ? 'mb-8' : ''}`}
            >
              {dateLine && <p>{dateLine}</p>}
              {publication && <p>{publication}</p>}
              {author && <p>{author}</p>}
            </div>
          )}
          {hasDescription && <CustomPortableText className="max-w-[72ch] text-base" value={body} />}
        </section>
      )}

      {(leadArticleImages.length > 0 || tailArticleImages.length > 0) && (
        <section aria-label="Images and video" className="w-full">
          {leadArticleImages.length > 0 && (
            <div className={installationGalleryShellClass}>
              <ExhibitionStaggeredMedia
                items={leadArticleImages}
                altBase={altBase}
                layoutTitle={layoutTitle}
                galleryImageCount={articleImages.length}
              />
            </div>
          )}

          {tailArticleImages.length > 0 && (
            <div className={installationGalleryShellClass}>
              <ExhibitionStaggeredMedia
                items={tailArticleImages}
                altBase={altBase}
                layoutTitle={layoutTitle}
                layoutIndexOffset={INSTALLATION_GALLERY_LEAD_COUNT}
                galleryImageCount={articleImages.length}
              />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
