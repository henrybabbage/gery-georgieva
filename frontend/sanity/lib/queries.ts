import {defineQuery} from 'next-sanity'

// ---------------------------------------------------------------------------
// Shared field fragments
// ---------------------------------------------------------------------------

const galleryUnionFields = /* groq */ `
  _key,
  _type,
  crop,
  hotspot,
  "asset": asset-> {
    ...,
    imageType,
    sizeOverride
  },
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
  coverImage {
    ...,
    "asset": asset-> {
      ...,
      imageType,
      sizeOverride
    }
  }
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
    coverImage {
      ...,
      "asset": asset-> {
        ...,
        imageType,
        sizeOverride
      }
    },
    "firstImage": images[_type == "mediaImage"][0] {
      ...,
      "asset": asset-> {
        ...,
        imageType,
        sizeOverride
      }
    }
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
    carouselImage { ${galleryUnionFields} },
    coverImage {
      ...,
      "asset": asset-> {
        ...,
        imageType,
        sizeOverride
      }
    },
    gallery[] { ${galleryUnionFields} },
    relatedEphemera[]-> {
      _id,
      title,
      "slug": slug.current,
      category,
      "firstImage": images[_type == "mediaImage"][0] {
        ...,
        "asset": asset-> {
          ...,
          imageType,
          sizeOverride
        }
      }
    },
    tags,
    "exhibitions": select(
      defined(exhibition) => [exhibition-> {
        _id,
        title,
        "slug": slug.current,
        year,
        venue,
        location,
        hidePublicPage
      }],
      *[_type == "exhibition" && references(^._id)] {
        _id,
        title,
        "slug": slug.current,
        year,
        venue,
        location,
        hidePublicPage
      }
    )
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
    carouselImage { ${galleryUnionFields} },
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

export const homepageCarouselQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0] {
    homepageCarousel[] {
      _key,
      _type,
      "workSlide": select(_type == "homepageCarouselWork" => @-> {
        _id,
        title,
        carouselImage { ${galleryUnionFields} },
        "firstGalleryImage": gallery[_type == "mediaImage"][0] { ${galleryUnionFields} },
        coverImage { ..., asset-> },
        "exhibition": exhibition-> {
          _id,
          title,
          "slug": slug.current,
          hidePublicPage
        }
      }),
      "exhibitionSlide": select(_type == "homepageCarouselExhibition" => @-> {
        _id,
        title,
        "slug": slug.current,
        hidePublicPage,
        carouselImage { ${galleryUnionFields} },
        "firstInstallImage": installationImages[_type == "mediaImage"][0] { ${galleryUnionFields} }
      })
    }
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
  *[_type == "cvEntry"] | order(year desc, title asc) {
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

// ---------------------------------------------------------------------------
// Press
// ---------------------------------------------------------------------------

export const pressQuery = defineQuery(`
  *[_type == "press"] | order(coalesce(orderRank, _createdAt) asc) {
    _id,
    linkText,
    url,
    "pdfUrl": pdf.asset->url
  }
`)
