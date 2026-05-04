import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {cvPageQuery} from '@/sanity/lib/queries'
import type {Metadata} from 'next'

export const metadata: Metadata = {title: 'CV'}

// Group entries by category for display
const CATEGORY_ORDER = [
  'exhibition',
  'commission',
  'residency',
  'award',
  'publication',
  'screening',
  'performance',
  'lecture',
  'education',
  'other',
]

export default async function CVPage() {
  const {data} = await sanityFetch({query: cvPageQuery})
  const entries = data?.entries
  const cvFileUrl =
    typeof data?.cvFileUrl === 'string' && data.cvFileUrl.trim() ? data.cvFileUrl.trim() : null

  if (!entries) return null

  // Group by category
  type Entry = (typeof entries)[number]
  const grouped = CATEGORY_ORDER.reduce<Record<string, Entry[]>>((acc, cat) => {
    const matching = entries.filter((e: Entry) => e.category === cat)
    if (matching.length) acc[cat] = matching
    return acc
  }, {})

  return (
    <div className="px-5 py-8 max-w-2xl">
      <ul className="flex flex-col gap-4 text-base mb-10">
        {cvFileUrl && (
          <li>
            <a
              href={cvFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer no-underline"
            >
              CV
            </a>
          </li>
        )}
        <li>
          <a
            href="https://www.instagram.com/_gery_georgieva/"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer no-underline"
          >
            Instagram
          </a>
        </li>
        <li>
          <a
            href="mailto:emailgery@gmail.com"
            className="cursor-pointer no-underline"
          >
            Email
          </a>
        </li>
      </ul>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-8">
          <h2 className="text-base tracking-widest mb-3">
            {category.charAt(0).toUpperCase() + category.slice(1)}s
          </h2>
          <ul className="space-y-2">
            {items.map((entry: Entry) => (
              <li
                key={entry._id}
                className="grid grid-cols-[3rem_1fr] gap-3 text-base cursor-default"
              >
                <span className="tabular-nums">{entry.year}</span>
                <span>
                  {entry.internalRef && entry.internalRef.hidePublicPage !== true ? (
                    <Link
                      href={`/shows/${entry.internalRef.slug}`}
                      className="cursor-pointer no-underline"
                    >
                      {entry.title}
                    </Link>
                  ) : (
                    entry.title
                  )}
                  {entry.institution && <span>, {entry.institution}</span>}
                  {entry.location && <span>, {entry.location}</span>}
                  {entry.role && <span className="ml-2">({entry.role})</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
