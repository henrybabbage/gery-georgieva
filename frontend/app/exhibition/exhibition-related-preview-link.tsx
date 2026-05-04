import Image from 'next/image'
import Link from 'next/link'
import type {SanityImageSource} from '@sanity/image-url'
import {
  type GalleryLeadPreview,
  resolveEphemeraDestinationPreview,
  resolveWorkDestinationPreview,
} from '@/sanity/lib/resolve-gallery-lead-preview'

/**
 * Tile matching /shows index: 4:3 media, title + subtitle beneath in small type.
 */
export function ExhibitionRelatedPreviewLink({
  href,
  label,
  destination,
  galleryLead,
  coverImage,
  descriptionPlain,
  subtitle,
}: {
  href: string
  label: string
  destination: 'work' | 'ephemera'
  /** `gallery[0]` or `images[0]` from GROQ */
  galleryLead?: unknown
  coverImage?: SanityImageSource | null
  descriptionPlain?: string | null
  /** Second line (year, medium, category, etc.) */
  subtitle?: string | null
}) {
  const resolved: GalleryLeadPreview =
    destination === 'work'
      ? resolveWorkDestinationPreview(galleryLead, coverImage)
      : resolveEphemeraDestinationPreview(galleryLead, descriptionPlain, 220)

  const sub = subtitle?.trim()
  const hasSubtitle = sub != null && sub !== ''

  return (
    <Link href={href} className="group block w-full min-w-0 text-left no-underline">
      <span className="sr-only">
        {destination === 'work' ? 'Work: ' : 'Research & Ephemera: '}
        {label}
        {hasSubtitle ? `. ${sub}` : ''}
      </span>
      <DestinationPreviewBlock preview={resolved} label={label} />
      <div className="mt-2 flex flex-col gap-px text-left text-sm leading-snug text-[var(--color-ink)]">
        <p className="m-0">{label}</p>
        {hasSubtitle ? <p className="m-0">{sub}</p> : null}
      </div>
    </Link>
  )
}

function DestinationPreviewBlock({preview, label}: {preview: GalleryLeadPreview; label: string}) {
  if (preview.kind === 'image') {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-placeholder">
        <Image
          src={preview.url}
          alt=""
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          sizes="(max-width: 767px) 100vw, 33vw"
        />
      </div>
    )
  }

  if (preview.kind === 'video') {
    const posterUrl = preview.posterUrl ?? ''
    const hasPoster = posterUrl !== ''
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
        {hasPoster ? (
          // eslint-disable-next-line @next/next/no-img-element -- Vimeo/YouTube hosts; avoids remotePatterns churn
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
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
            <svg
              className="size-3.5 translate-x-px sm:size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </div>
    )
  }

  if (preview.kind === 'text') {
    return (
      <div className="flex aspect-[4/3] w-full items-start overflow-hidden border border-hairline bg-paper p-3">
        <p className="m-0 line-clamp-5 text-left text-sm leading-snug text-[var(--color-ink)]">
          {preview.text}
        </p>
      </div>
    )
  }

  return (
    <div className="flex aspect-[4/3] w-full items-end bg-placeholder p-3" aria-hidden>
      <span className="text-sm text-[var(--color-ink)]">{label}</span>
    </div>
  )
}
