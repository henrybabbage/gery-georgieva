import type {Metadata} from 'next'
import {sanityFetch} from '@/sanity/lib/live'
import {pressQuery} from '@/sanity/lib/queries'

export const metadata: Metadata = {title: 'Press'}

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
