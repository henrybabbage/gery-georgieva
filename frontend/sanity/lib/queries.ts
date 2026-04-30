import {defineQuery} from 'next-sanity'

// ---------------------------------------------------------------------------
// Shared field fragments
// ---------------------------------------------------------------------------

const galleryUnionFields = /* groq */ `
  _key,
  _type,
  crop,
  hotspot,
  "asset": asset->,
  isAudiencePhoto,
  caption,
  credit,
  provider,
  vimeo {
    asset-> {
      vimeoId,
      name,
      duration,
      width,
      height,
      privacy,
      "thumbnail": pictures.sizes[0].link,
      files,
      play
    }
  },
  youtube {
    id,
    title,
    description,
    publishedAt,
    thumbnails
  }
`

const workCardFields = /* groq */ `
  _id,
  _type,
  title,
  "slug": slug.current,
  year,
  medium,
  coverImage { ..., asset-> }
`

// ---------------------------------------------------------------------------
// Home / Stream grid — work + ephemera interleaved
// ---------------------------------------------------------------------------

export const streamQuery = defineQuery(`
  *[_type in ["work", "ephemera"] && defined(slug.current)]
  | order(orderRank asc) {
    _id,
    _type,
    title,
    "slug": slug.current,
    year,
    coverImage { ..., asset-> },
    "firstImage": images[_type == "mediaImage"][0] { ..., asset-> }
  }
`)

// ---------------------------------------------------------------------------
// Archive — work only, pre-2015
// ---------------------------------------------------------------------------

export const archiveQuery = defineQuery(`
  *[_type == "work" && defined(slug.current) && year < 2015]
  | order(orderRank asc) {
    ${workCardFields}
  }
`)

// ---------------------------------------------------------------------------
// Work detail — with back-links to exhibitions and related ephemera
// ---------------------------------------------------------------------------

export const workQuery = defineQuery(`
  *[_type == "work" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    year,
    medium,
    dimensions,
    description,
    coverImage { ..., asset-> },
    gallery[] { ${galleryUnionFields} },
    relatedEphemera[]-> {
      _id,
      title,
      "slug": slug.current,
      category,
      "firstImage": images[_type == "mediaImage"][0] { ..., asset-> }
    },
    tags,
    "exhibitions": *[_type == "exhibition" && references(^._id)] {
      _id,
      title,
      "slug": slug.current,
      year,
      venue,
      location,
      hidePublicPage
    }
  }
`)

export const workSlugQuery = defineQuery(`
  *[_type == "work" && defined(slug.current)] { "slug": slug.current }
`)

// ---------------------------------------------------------------------------
// Exhibition detail — with works resolved
// ---------------------------------------------------------------------------

export const exhibitionQuery = defineQuery(`
  *[_type == "exhibition" && slug.current == $slug && (!(hidePublicPage == true) || $allowHidden == true)][0] {
    _id,
    title,
    "slug": slug.current,
    year,
    venue,
    location,
    startDate,
    endDate,
    exhibitionType,
    description,
    externalDocumentationLink,
    relatedWorks[]-> {
      ${workCardFields}
    },
    installationImages[] { ${galleryUnionFields} },
    "relatedEphemera": *[_type == "ephemera" && references(^._id)] {
      _id,
      title,
      "slug": slug.current,
      category,
      year
    }
  }
`)

export const exhibitionSlugQuery = defineQuery(`
  *[_type == "exhibition" && defined(slug.current) && hidePublicPage != true] { "slug": slug.current }
`)

export const featureExhibitionListQuery = defineQuery(`
  *[_type == "exhibition" && defined(slug.current)]
  | order(orderRank asc) {
    _id,
    title,
    "slug": slug.current,
    year,
    venue,
    location,
    hidePublicPage
  }
`)

// ---------------------------------------------------------------------------
// Ephemera detail
// ---------------------------------------------------------------------------

export const ephemeraQuery = defineQuery(`
  *[_type == "ephemera" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    year,
    category,
    description,
    images[] { ${galleryUnionFields} },
    relatedWork[]-> {
      _id,
      title,
      "slug": slug.current,
      year,
      medium
    },
    relatedExhibitions[]-> {
      _id,
      title,
      "slug": slug.current,
      year,
      venue,
      location,
      hidePublicPage
    }
  }
`)

export const ephemeraSlugQuery = defineQuery(`
  *[_type == "ephemera" && defined(slug.current)] { "slug": slug.current }
`)

// ---------------------------------------------------------------------------
// CV
// ---------------------------------------------------------------------------

export const cvQuery = defineQuery(`
  *[_type == "cvEntry"] | order(orderRank asc) {
    _id,
    title,
    year,
    category,
    role,
    institution,
    location,
    description,
    internalRef-> {
      _id,
      title,
      "slug": slug.current,
      hidePublicPage
    }
  }
`)
