import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {cvPageQuery} from '@/sanity/lib/queries'
import type {CvPageQueryResult} from '@/sanity.types'
import type {Metadata} from 'next'

export const metadata: Metadata = {title: 'CV'}

/** Fallback when About → CV section order is empty; keep aligned with `cvEntry.category`. */
const DEFAULT_CATEGORY_ORDER = [
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
] as const

type CvCategory = CvPageQueryResult['entries'][number]['category']

/** Section headings; aligned with `studio/.../cvCategoryOptions.ts`. */
const CV_SECTION_TITLES: Record<CvCategory, string> = {
  award: 'Awards',
  commission: 'Commissions',
  education: 'Education',
  exhibition: 'Exhibitions',
  lecture: 'Lectures',
  other: 'Other',
  performance: 'Performances',
  publication: 'Publications',
  residency: 'Residencies',
  screening: 'Screenings',
}

function resolveSectionOrder(
  cvSectionOrder: CvPageQueryResult['cvSectionOrder'],
  categoriesWithEntries: Set<CvCategory>,
): CvCategory[] {
  const defaultOrder: CvCategory[] = [...DEFAULT_CATEGORY_ORDER]
  const allowed = new Set<CvCategory>(defaultOrder)
  const fromCms = (cvSectionOrder ?? []).filter(
    (c): c is CvCategory => c != null && allowed.has(c),
  )
  const primary: CvCategory[] = fromCms.length > 0 ? fromCms : defaultOrder
  const primarySet = new Set(primary)
  const extra = [...categoriesWithEntries].filter((c) => !primarySet.has(c))
  extra.sort((a, b) => {
    const ia = defaultOrder.indexOf(a)
    const ib = defaultOrder.indexOf(b)
    const rankA = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
    const rankB = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
    return rankA - rankB
  })
  const merged = [...primary, ...extra]
  return merged.filter((cat) => categoriesWithEntries.has(cat))
}

export default async function CVPage() {
  const {data} = await sanityFetch({query: cvPageQuery})
  const entries = data?.entries
  const cvFileUrl =
    typeof data?.cvFileUrl === 'string' && data.cvFileUrl.trim() ? data.cvFileUrl.trim() : null

  if (!entries) return null

  type Entry = (typeof entries)[number]
  const grouped = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    const cat = entry.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(entry)
    return acc
  }, {})

  const sectionOrder = resolveSectionOrder(
    data?.cvSectionOrder,
    new Set(Object.keys(grouped) as CvCategory[]),
  )

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

      {sectionOrder.map((category) => {
        const items = grouped[category]
        if (!items?.length) return null
        return (
          <section key={category} className="mb-8">
          <h2 className="text-base tracking-widest mb-3">
            {CV_SECTION_TITLES[category]}
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
                      href={`/exhibition/${entry.internalRef.slug}`}
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
        )
      })}
    </div>
  )
}
