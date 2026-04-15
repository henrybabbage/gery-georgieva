import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {streamQuery} from '@/sanity/lib/queries'

export default async function Page() {
  const {data: items} = await sanityFetch({query: streamQuery})

  return (
    <div className="px-5 py-8">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items?.map((item: {_id: string; _type: string; slug: string; title: string; year?: number}) => (
          <li key={item._id}>
            <Link
              href={item._type === 'work' ? `/work/${item.slug}` : `/ephemera/${item.slug}`}
              className="block text-sm"
            >
              <div className="aspect-[4/3] bg-[#e8e7e3] mb-1" />
              <span>{item.title}</span>
              {item.year && <span className="ml-2 opacity-50">{item.year}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
