import type {SanityImageSource} from '@sanity/image-url'

export type {SanityImageSource}

export type MediaImageItem = {
  _type: 'mediaImage'
  _key?: string
  asset?: SanityImageSource & {metadata?: {dimensions?: {width?: number; height?: number}}}
  isAudiencePhoto?: boolean
  caption?: string
  credit?: string
}

export type MediaVideoFileItem = {
  _type: 'mediaVideoFile'
  _key?: string
  asset?: {
    _id?: string
    url?: string
    originalFilename?: string
    extension?: string
    mimeType?: string
    size?: number
  }
  poster?: SanityImageSource
  caption?: string
  credit?: string
}

export type VimeoVideoResolved = {
  vimeoId?: string
  name?: string
  duration?: number
  width?: number
  height?: number
  privacy?: string
  thumbnail?: string
  files?: unknown[]
  play?: unknown
}

export type MediaVideoLinkItem = {
  _type: 'mediaVideoLink'
  _key?: string
  provider?: 'vimeo' | 'youtube'
  vimeo?: {asset?: VimeoVideoResolved | null}
  youtube?: {
    id?: string
    title?: string
    description?: string
    publishedAt?: string
    thumbnails?: string[]
  }
  caption?: string
  credit?: string
}

export type GalleryItem = MediaImageItem | MediaVideoFileItem | MediaVideoLinkItem

export type WorkCard = {
  _id: string
  _type: 'work'
  title: string
  slug: string
  year?: number
  medium?: string
  isFeature?: boolean
  coverImage?: SanityImageSource
}

export type WorkDetail = WorkCard & {
  dimensions?: string
  description?: unknown[]
  gallery?: GalleryItem[]
  relatedEphemera?: EphemeraCard[]
  tags?: string[]
  exhibitions?: ExhibitionCard[]
}

export type EphemeraCard = {
  _id: string
  _type: 'ephemera'
  title: string
  slug: string
  year?: number
  category?: string
  isFeature?: boolean
  firstImage?: SanityImageSource
}

export type ExhibitionCard = {
  _id: string
  title: string
  slug: string
  year?: number
  venue?: string
  location?: string
}

export type ExhibitionDetail = ExhibitionCard & {
  _id: string
  startDate?: string
  endDate?: string
  exhibitionType?: string
  description?: unknown[]
  relatedWorks?: WorkCard[]
  relatedEphemera?: EphemeraCard[]
  installationImages?: GalleryItem[]
  externalDocumentationLink?: string
}

export type EphemeraDetail = {
  _id: string
  title: string
  slug: string
  year?: number
  category?: string
  description?: unknown[]
  images?: GalleryItem[]
  relatedWork?: {
    _id: string
    title: string
    slug: string
    year?: number
    medium?: string
  }[]
  relatedExhibitions?: {
    _id: string
    title: string
    slug: string
    year?: number
    venue?: string
    location?: string
  }[]
}

export type CvEntry = {
  _id: string
  title: string
  year: number
  category: string
  role?: string
  institution?: string
  location?: string
  description?: string
  internalRef?: {_id: string; title: string; slug: string}
}

export type StreamItem = (WorkCard | EphemeraCard) & {
  coverImage?: SanityImageSource
  firstImage?: SanityImageSource
}

// Represents a Link after GROQ dereferencing (page/post become slug strings)
export type DereferencedLink = {
  _type: 'link'
  linkType?: 'href' | 'page' | 'post'
  href?: string
  page?: string | null
  post?: string | null
  openInNewTab?: boolean
}
