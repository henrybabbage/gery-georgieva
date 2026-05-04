import type {Metadata} from 'next'
import {sanityFetch} from '@/sanity/lib/live'
import {pressQuery} from '@/sanity/lib/queries'
import type {PressQueryResult} from '@/sanity.types'
import {PressRowLink} from '@/app/press/press-row-link'

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

export default async function PressPage() {
  const {data: items} = await sanityFetch({query: pressQuery})

  return (
    <div className="px-5 py-8">
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
                    </li>
                  )
                }
                return (
                  <li key={row._id} className={rowClass}>
                    <span className="text-base">{row.linkText}</span>
                    <span className="ml-2 text-sm">
                      (add a slug in Studio to publish this page)
                    </span>
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
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
