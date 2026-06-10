import Image from 'next/image'
import type {PortableTextBlock} from 'next-sanity'
import CustomPortableText from '@/app/components/PortableText'
import {
  buildMediaIndexRows,
  collectUniqueMediaCredits,
  hasText,
  type MediaIndexRow,
  type MediaTextItem,
} from '@/app/exhibition/components/DetailMediaTextHelpers'

type SupportLogo = {
  _key?: string | null
  asset?: {
    url?: string | null
    altText?: string | null
    metadata?: {
      dimensions?: {
        width?: number | null
        height?: number | null
      } | null
    } | null
  } | null
}

function hasPortableText(value: unknown[] | null | undefined): value is PortableTextBlock[] {
  return Array.isArray(value) && value.length > 0
}

function SupportLogoRow({logos}: {logos: readonly SupportLogo[]}) {
  const renderableLogos = logos.filter((logo) => hasText(logo.asset?.url))
  if (!renderableLogos.length) return null

  return (
    <div className="mt-8 flex max-w-[72ch] flex-wrap items-center gap-x-8 gap-y-5">
      {renderableLogos.map((logo, index) => {
        const asset = logo.asset
        const src = asset?.url?.trim() ?? ''
        const dimensions = asset?.metadata?.dimensions
        const width = dimensions?.width && dimensions.width > 0 ? dimensions.width : 240
        const height = dimensions?.height && dimensions.height > 0 ? dimensions.height : 120
        return (
          <Image
            key={logo._key ?? `${src}-${index}`}
            src={src}
            alt={asset?.altText?.trim() ?? ''}
            width={width}
            height={height}
            className="h-auto max-h-12 w-auto max-w-[10rem] object-contain"
          />
        )
      })}
    </div>
  )
}

function MediaCredits({credits}: {credits: readonly string[]}) {
  if (!credits.length) return null
  return (
    <div className="mt-8 max-w-[72ch] space-y-1 text-base text-[var(--color-ink)]">
      {credits.map((credit) => (
        <p key={credit} className="m-0">
          {credit}
        </p>
      ))}
    </div>
  )
}

function MediaIndexList({rows}: {rows: readonly MediaIndexRow[]}) {
  if (!rows.length) return null
  return (
    <ol className="mt-8 max-w-[72ch] space-y-2 text-base text-[var(--color-ink)]">
      {rows.map((row) => (
        <li key={row.number} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4">
          <span>{row.number}</span>
          <span>
            {[row.caption, row.credit].filter(Boolean).join(' — ')}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function DetailMediaText({
  description,
  supportText,
  supportLogos,
  mediaItems,
  showMediaIndexList = false,
  textMeasureClass = 'max-w-[72ch]',
}: {
  description?: unknown[] | null
  supportText?: unknown[] | null
  supportLogos?: readonly SupportLogo[] | null
  mediaItems: readonly MediaTextItem[]
  showMediaIndexList?: boolean | null
  textMeasureClass?: string
}) {
  const hasDescription = hasPortableText(description)
  const hasSupportText = hasPortableText(supportText)
  const credits = collectUniqueMediaCredits(mediaItems)
  const mediaIndexRows = showMediaIndexList === true ? buildMediaIndexRows(mediaItems) : []
  const hasSupportLogos = supportLogos?.some((logo) => hasText(logo.asset?.url)) ?? false

  if (
    !hasDescription &&
    !hasSupportText &&
    !hasSupportLogos &&
    !credits.length &&
    !mediaIndexRows.length
  ) {
    return null
  }

  return (
    <>
      {hasDescription && (
        <CustomPortableText className={`${textMeasureClass} text-base`} value={description} />
      )}
      {hasSupportText && (
        <CustomPortableText
          className={`${textMeasureClass} ${hasDescription ? 'mt-8' : ''} text-base`}
          value={supportText}
        />
      )}
      {supportLogos && <SupportLogoRow logos={supportLogos} />}
      <MediaCredits credits={credits} />
      <MediaIndexList rows={mediaIndexRows} />
    </>
  )
}
