import {defineQuery} from 'next-sanity'

// ---------------------------------------------------------------------------
// Shared field fragments
// ---------------------------------------------------------------------------

const galleryUnionFields = /* groq */ `
  _key,
  _type,
  crop,
  hotspot,
  sizeOverride,
  "asset": asset-> {
    ...,
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
  "descriptionPlain": pt::text(description),
  coverImage {
    ...,
    sizeOverride,
    "asset": asset-> {
      ...,
      sizeOverride
    }
  }
`

// ---------------------------------------------------------------------------
// Site-wide defaults (About singleton)
// ---------------------------------------------------------------------------

export const aboutSiteMetadataQuery = defineQuery(`
  *[_type == "about" && _id == "about"][0] {
    metaTitle,
    metaDescription,
    ogImage {
      crop,
      hotspot,
      "asset": asset-> {
        _id,
        _type,
        url,
        metadata,
        altText
      }
    }
  }
`)

// ---------------------------------------------------------------------------
// Home / Stream grid — work + ephemera interleaved
// ---------------------------------------------------------------------------

export const streamQuery = defineQuery(`
  *[_type in ["work", "ephemera"] && defined(slug.current) && (_type != "work" || hidePublicPage != true)]
  | order(orderRank asc) {
    _id,
    _type,
    title,
    "slug": slug.current,
    year,
    coverImage {
      ...,
      sizeOverride,
      "asset": asset-> {
        ...,
        sizeOverride
      }
    },
    "firstImage": images[_type == "mediaImage"][0] {
      ...,
      sizeOverride,
      "asset": asset-> {
        ...,
        sizeOverride
      }
    }
  }
`)

// ---------------------------------------------------------------------------
// Archive — work only, pre-2015
// ---------------------------------------------------------------------------

export const archiveQuery = defineQuery(`
  *[_type == "work" && defined(slug.current) && year < 2015 && hidePublicPage != true]
  | order(orderRank asc) {
    ${workCardFields}
  }
`)

// ---------------------------------------------------------------------------
// Work detail — with back-links to exhibitions and related ephemera
// ---------------------------------------------------------------------------

export const workQuery = defineQuery(`
  *[_type == "work" && slug.current == $slug && (!(hidePublicPage == true) || $allowHidden == true)][0] {
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
      sizeOverride,
      "asset": asset-> {
        ...,
        sizeOverride
      }
    },
    gallery[] { ${galleryUnionFields} },
    showRelatedResearchSection,
    relatedEphemera[]-> {
      _id,
      title,
      "slug": slug.current,
      category,
      "firstImage": images[_type == "mediaImage"][0] {
        ...,
        sizeOverride,
        "asset": asset-> {
          ...,
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
  *[_type == "work" && defined(slug.current) && hidePublicPage != true] { "slug": slug.current }
`)

/** Public work grid on /work; omits works with Hide page on. Newest year first; orderRank ties. */
export const workPublicGridQuery = defineQuery(`
  *[_type == "work" && defined(slug.current) && hidePublicPage != true]
  | order(coalesce(year, -1) desc, orderRank asc, title asc) {
    ${workCardFields},
    orderRank,
    "firstGalleryStill": gallery[_type == "mediaImage"][0] { ${galleryUnionFields} }
  }
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
    showWorksSection,
    showEphemeraSection,
    externalDocumentationLink,
    carouselImage { ${galleryUnionFields} },
    relatedWorks[]-> {
      ${workCardFields},
      "galleryLead": gallery[0] { ${galleryUnionFields} }
    },
    installationImages[] { ${galleryUnionFields} },
    "relatedEphemera": *[_type == "ephemera" && references(^._id)] {
      _id,
      title,
      "slug": slug.current,
      category,
      year,
      "descriptionPlain": pt::text(description),
      "imagesLead": images[0] { ${galleryUnionFields} }
    }
  }
`)

export const exhibitionSlugQuery = defineQuery(`
  *[_type == "exhibition" && defined(slug.current) && hidePublicPage != true] { "slug": slug.current }
`)

/** Public exhibition grid on /work; omits exhibitions with Hide page on. Newest year first; orderRank ties. */
export const featureExhibitionListQuery = defineQuery(`
  *[_type == "exhibition" && defined(slug.current) && hidePublicPage != true]
  | order(coalesce(year, -1) desc, orderRank asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    year,
    venue,
    location,
    orderRank,
    carouselImage { ${galleryUnionFields} },
    "firstInstallImage": installationImages[_type == "mediaImage"][0] { ${galleryUnionFields} }
  }
`)

export const homepageCarouselQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0] {
    homepageCarousel[] {
      _key,
      _type,
      "workSlide": select(_type == "homepageCarouselWork" => @-> {
        _id,
        title,
        "slug": slug.current,
        hidePublicPage,
        carouselImage { ${galleryUnionFields} },
        "firstGalleryImage": gallery[_type == "mediaImage"][0] { ${galleryUnionFields} },
        coverImage { ..., asset-> }
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

const cvEntryFields = /* groq */ `
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
`

export const cvPageQuery = defineQuery(`{
  "entries": *[_type == "cvEntry"] | order(year desc, title asc) {
    ${cvEntryFields}
  },
  "cvFileUrl": *[_type == "about" && _id == "about"][0].cvFile.asset->url,
  "cvSectionOrder": *[_type == "about" && _id == "about"][0].cvSectionOrder
}`)

// ---------------------------------------------------------------------------
// Press
// ---------------------------------------------------------------------------

export const pressQuery = defineQuery(`
  *[_type == "press"] | order(coalesce(orderRank, _createdAt) asc) {
    _id,
    kind,
    linkText,
    "slug": slug.current,
    url,
    "pdfUrl": pdf.asset->url,
    publishedAt,
    publication,
    author,
    body
  }
`)

/** Written articles with a public URL (for static paths and sitemap). */
export const pressArticleSlugQuery = defineQuery(`
  *[_type == "press" && defined(slug.current) && (
    kind == "text"
    || (!defined(kind) && !defined(url) && !defined(pdf.asset))
  )] {
    "slug": slug.current
  }
`)

export const pressArticleBySlugQuery = defineQuery(`
  *[_type == "press" && slug.current == $slug][0] {
    _id,
    kind,
    linkText,
    "slug": slug.current,
    url,
    "pdfUrl": pdf.asset->url,
    publishedAt,
    publication,
    author,
    articleImages[] { ${galleryUnionFields} },
    body
  }
`)
