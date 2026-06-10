import type {Metadata} from 'next'
import SiteCopyright from '@/app/components/SiteCopyright'
import {sanityFetch} from '@/sanity/lib/live'
import {pressQuery} from '@/sanity/lib/queries'
import type {PressQueryResult} from '@/sanity.types'
import {PressRowLink} from '@/app/press/PressRowLink'
import {formatPressPublicationDate} from '@/lib/FormatPressMeta'

export const metadata: Metadata = {title: 'Press'}

type PressRow = NonNullable<PressQueryResult>[number]

function resolvePressKind(row: PressRow): 'url' | 'pdf' | 'text' {
  if (row.kind === 'url' || row.kind === 'pdf' || row.kind === 'text') {
    return row.kind
  }
  if (row.pdfUrl) {
    return 'pdf'
  }
  if (row.url) {
    return 'url'
  }
  return 'text'
}

/** Match exhibition “about” copy: readable measure and ink color. */
const listShellClass = 'w-full max-w-[1260px]'
const listMeasureClass = 'max-w-[72ch] text-base text-[var(--color-ink)]'

/** Uniform row cursor; links also set !cursor-pointer on the anchor. */
const rowClass = 'cursor-pointer'
const dateClass = 'mt-1 text-sm text-[var(--color-ink)]'

function PressRowDate({value}: {value: string | null | undefined}) {
  const formatted = formatPressPublicationDate(value)
  if (!formatted) {
    return null
  }
  return <p className={dateClass}>{formatted}</p>
}

export default async function PressPage() {
  const {data: items} = await sanityFetch({query: pressQuery})

  return (
    <div className="px-5 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      {!items?.length ? (
        <div className={listShellClass}>
          <p className={listMeasureClass}>No press links yet.</p>
        </div>
      ) : (
        <div className={listShellClass}>
          <ul className={`${listMeasureClass} space-y-4`}>
            {items.map((row) => {
              const kind = resolvePressKind(row)

              if (kind === 'text') {
                const slug =
                  typeof row.slug === 'string' && row.slug.trim() ? row.slug.trim() : null
                if (slug) {
                  return (
                    <li key={row._id} className={rowClass}>
                      <PressRowLink
                        variant="internal"
                        href={`/press/${slug}`}
                        title="Article on this website"
                      >
                        {row.linkText}
                      </PressRowLink>
                      <PressRowDate value={row.publishedAt} />
                    </li>
                  )
                }
                return (
                  <li key={row._id} className={rowClass}>
                    <span className="text-base">{row.linkText}</span>
                    <span className="ml-2 text-sm">
                      (add a slug in Studio to publish this page)
                    </span>
                    <PressRowDate value={row.publishedAt} />
                  </li>
                )
              }

              const href = row.pdfUrl ?? row.url
              if (!href) {
                return null
              }

              if (kind === 'pdf') {
                return (
                  <li key={row._id} className={rowClass}>
                    <PressRowLink variant="pdf" href={href} title="Opens PDF in a new tab">
                      {row.linkText}
                    </PressRowLink>
                    <PressRowDate value={row.publishedAt} />
                  </li>
                )
              }

              return (
                <li key={row._id} className={rowClass}>
                  <PressRowLink
                    variant="external"
                    href={href}
                    title="External site (opens in a new tab)"
                  >
                    {row.linkText}
                  </PressRowLink>
                  <PressRowDate value={row.publishedAt} />
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <div className="flex w-full items-baseline justify-between">
        <SiteCopyright />
        <a
          href="https://www.contiguous.studio/"
          target="_blank"
          rel="noopener noreferrer"
          className={
            'text-base text-[var(--color-ink)] whitespace-nowrap ' +
            'transition-opacity hover:opacity-80 ' +
            'focus-visible:outline-2 focus-visible:outline-offset-2'
          }
        >
          Site by Contiguous Studio
        </a>
      </div>
    </div>
  )
}
