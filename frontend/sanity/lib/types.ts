import type {SanityImageSource} from '@sanity/image-url'

export type {SanityImageSource}

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

export type MediaItem = {
  mediaType?: 'image' | 'video'
  videoSource?: 'url' | 'file' | 'vimeo'
  image?: SanityImageSource & {asset?: {_ref?: string}}
  videoUrl?: string
  videoFile?: {asset?: {_ref?: string}}
  vimeo?: {asset?: VimeoVideoResolved | null}
  isAudiencePhoto?: boolean
  caption?: string
  credit?: string
}

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
  gallery?: MediaItem[]
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
  startDate?: string
  endDate?: string
  exhibitionType?: string
  description?: unknown[]
  externalDocumentationLink?: string
  relatedWorks?: WorkCard[]
  installationImages?: MediaItem[]
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
