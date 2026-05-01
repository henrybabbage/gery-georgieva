import type {Metadata} from 'next'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {pressQuery} from '@/sanity/lib/queries'
import type {PressQueryResult} from '@/sanity.types'

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

export default async function PressPage() {
  const {data: items} = await sanityFetch({query: pressQuery})

  return (
    <div className="px-5 py-8 max-w-2xl">
      <h1 className="text-base font-normal mb-8">Press</h1>

      {!items?.length ? (
        <p className="text-base opacity-50">No press links yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((row) => {
            const kind = resolvePressKind(row)

            if (kind === 'text') {
              const slug = typeof row.slug === 'string' && row.slug.trim() ? row.slug.trim() : null
              if (slug) {
                return (
                  <li key={row._id} className="text-base">
                    <Link href={`/press/${slug}`} className="underline underline-offset-2">
                      {row.linkText}
                    </Link>
                  </li>
                )
              }
              return (
                <li key={row._id} className="text-base opacity-50">
                  {row.linkText}
                  <span className="ml-2 text-sm">(add a slug in Studio to publish this page)</span>
                </li>
              )
            }

            const href = row.pdfUrl ?? row.url
            if (!href) {
              return null
            }
            return (
              <li key={row._id} className="text-base">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {row.linkText}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
