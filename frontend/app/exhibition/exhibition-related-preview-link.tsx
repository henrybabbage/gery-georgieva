import Image from 'next/image'
import Link from 'next/link'
import type {ReactNode} from 'react'
import type {SanityImageSource} from '@sanity/image-url'
import {
  type GalleryLeadPreview,
  resolveEphemeraDestinationPreview,
  resolveWorkDestinationPreview,
} from '@/sanity/lib/resolve-gallery-lead-preview'

/** Max width for lead media block only (title/meta stay full measure). */
const PREVIEW_MAX_W = 'max-w-[11.25rem] sm:max-w-[12rem]'

/** Preview of destination media: work gallery lead, ephemera images or description excerpt. */
export function ExhibitionRelatedPreviewLink({
  href,
  label,
  destination,
  galleryLead,
  coverImage,
  descriptionPlain,
  meta,
}: {
  href: string
  label: string
  destination: 'work' | 'ephemera'
  /** `gallery[0]` or `images[0]` from GROQ */
  galleryLead?: unknown
  coverImage?: SanityImageSource | null
  descriptionPlain?: string | null
  meta?: ReactNode
}) {
  const resolved: GalleryLeadPreview =
    destination === 'work'
      ? resolveWorkDestinationPreview(galleryLead, coverImage)
      : resolveEphemeraDestinationPreview(galleryLead, descriptionPlain, 220)

  return (
    <Link
      href={href}
      className="group flex flex-col items-stretch gap-2 text-left no-underline"
    >
      <div className="min-w-0">
        <span className="block text-base leading-snug text-[var(--color-ink)] group-hover:opacity-80">
          {label}
        </span>
        {meta ? (
          <div className="mt-1 text-base leading-snug text-[var(--color-ink)]">{meta}</div>
        ) : null}
      </div>
      <div className={`min-w-0 self-start ${PREVIEW_MAX_W} w-full`}>
        <span className="sr-only">
          {destination === 'work' ? 'Preview of work page. ' : 'Preview of Research & Ephemera page. '}
        </span>
        <DestinationPreviewBlock preview={resolved} />
      </div>
    </Link>
  )
}

function DestinationPreviewBlock({preview}: {preview: GalleryLeadPreview}) {
  if (preview.kind === 'image') {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-placeholder">
        <Image
          src={preview.url}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 45vw, 192px"
        />
      </div>
    )
  }

  if (preview.kind === 'video') {
    const posterUrl = preview.posterUrl ?? ''
    const hasPoster = posterUrl !== ''
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
        {hasPoster ? (
          // eslint-disable-next-line @next/next/no-img-element -- Vimeo/YouTube hosts; avoids remotePatterns churn
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        <div
          className={
            hasPoster
              ? 'pointer-events-none absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--color-ink)_35%,transparent)] to-transparent'
              : 'absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]'
          }
          aria-hidden
        />
        <span
          className={
            hasPoster
              ? 'pointer-events-none absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-[color-mix(in_srgb,#fff_92%,transparent)] text-[var(--color-ink)] shadow-sm backdrop-blur-[2px]'
              : 'absolute inset-0 flex items-center justify-center'
          }
        >
          <span
            className={
              hasPoster
                ? 'flex size-7 items-center justify-center'
                : 'flex size-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-ink)_6%,#fff)] text-[var(--color-ink)] shadow-sm'
            }
          >
            <svg className="size-3.5 translate-x-px sm:size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </div>
    )
  }

  if (preview.kind === 'text') {
    return (
      <p className="m-0 line-clamp-4 text-left text-sm leading-snug text-[var(--color-ink)] opacity-80">
        {preview.text}
      </p>
    )
  }

  return (
    <div
      className="flex aspect-video w-full items-center justify-center bg-placeholder"
      aria-hidden
    >
      <div className="h-8 w-12 bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]" />
    </div>
  )
}
