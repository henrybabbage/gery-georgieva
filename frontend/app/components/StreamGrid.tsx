import Image from 'next/image'
import Link from 'next/link'
import {urlForImage} from '@/sanity/lib/utils'

type GridItem = {
  _id: string
  _type: 'work' | 'ephemera'
  title: string
  slug: string
  year?: number
  coverImage?: SanityImageRef
  firstImage?: SanityImageRef
}

type SanityImageRef = {
  asset?: {_ref?: string; url?: string}
  [key: string]: unknown
}

function TileImage({image, title}: {image: SanityImageRef; title: string}) {
  const url = urlForImage(image)?.width(1200).auto('format').url()
  if (!url) return <div className="aspect-[4/3] bg-[#e8e7e3]" />
  return (
    <div className="relative overflow-hidden bg-[#e8e7e3]">
      <Image
        src={url}
        alt={title}
        width={1200}
        height={900}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        style={{aspectRatio: '4/3'}}
      />
    </div>
  )
}

export default function StreamGrid({items}: {items: GridItem[]}) {
  return (
    <div className="grid grid-cols-12 gap-[2px] pt-16">
      {items.map((item) => {
        const href = item._type === 'work' ? `/work/${item.slug}` : `/ephemera/${item.slug}`
        const img = item.coverImage ?? item.firstImage

        return (
          <Link
            key={item._id}
            href={href}
            className="group col-span-12 block sm:col-span-6"
          >
            {img ? (
              <TileImage image={img} title={item.title} />
            ) : (
              <div className="aspect-[4/3] bg-[#e8e7e3] flex items-end p-3">
                <span className="text-base text-[#8a8880]">{item.title}</span>
              </div>
            )}
            <div className="px-1 pt-2 pb-4">
              <p className="text-base text-[#1c1b18] leading-snug">{item.title}</p>
              {item.year && (
                <p className="text-base text-[#8a8880]">{item.year}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
