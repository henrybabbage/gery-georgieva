import {randomUUID} from 'node:crypto'

import {getCliClient} from 'sanity/cli'

/**
 * One-off migration: promote linked `work` documents into `exhibition` documents.
 *
 * Why: the `work` and `exhibition` types were consolidated onto a single public
 * route, `/work/[slug]`, which now resolves ONLY `exhibition` documents. Any
 * `work` still linked from the homepage carousel (or a CV entry) therefore 404s,
 * because the route no longer serves the `work` type.
 *
 * What it does, for every `work` referenced by:
 *   - `siteSettings.homepageCarousel` (a `homepageCarouselWork` member), and
 *   - `cvEntry.internalRef` (legacy data only — the schema now restricts this to
 *     `exhibition`, so usually none),
 * the script:
 *   1. Creates a new published `exhibition` document (idempotent, deterministic
 *      `_id`), preserving the work's slug so `/work/<slug>` resolves, mapping the
 *      content fields, and setting it Live (`hidePublicPage: false`).
 *   2. Repoints the carousel member to a `homepageCarouselExhibition` pointing at
 *      the new exhibition (same array `_key`, so carousel order is preserved),
 *      and repoints any `cvEntry.internalRef`.
 *
 * The original `work` documents are left UNTOUCHED (kept in "Legacy works").
 * Re-running is safe: existing migrated exhibitions are not overwritten, and
 * carousel members already pointing at an exhibition are skipped.
 *
 * Dry-run by default. Pass `--apply` (or set APPLY=1) to write.
 *
 *   Dry run: npx sanity exec scripts/migrate-linked-works-to-exhibitions.ts --with-user-token
 *   Apply:   npx sanity exec scripts/migrate-linked-works-to-exhibitions.ts --with-user-token -- --apply
 *
 * NOTE: works referenced from `exhibition.relatedWorks` or `ephemera.relatedWork`
 * also render `/work/<slug>` links and would 404; those are intentionally OUT OF
 * SCOPE here and only reported as warnings.
 */

const APPLY = process.argv.includes('--apply') || process.env.APPLY === '1'
const apiVersion = '2025-09-25'

const SITE_SETTINGS_IDS = ['siteSettings', 'drafts.siteSettings']

type SanityRef = {_ref?: string; _type?: string; _key?: string}

type WorkDoc = {
  _id: string
  title?: string
  slug?: {current?: string}
  year?: number
  coverImage?: Record<string, unknown> | null
  carouselImage?: Record<string, unknown> | null
  gallery?: Array<Record<string, unknown>> | null
  description?: unknown
  supportText?: unknown
  supportLogos?: unknown
  showHomepageYear?: boolean
  showRelatedResearchSection?: boolean
}

type CarouselMember = {_key?: string; _type?: string; _ref?: string}

type SiteSettingsDoc = {
  _id: string
  homepageCarousel?: CarouselMember[]
}

type CvEntryDoc = {_id: string; title?: string; internalRef?: SanityRef}

const publishedId = (id: string): string => id.replace(/^drafts\./, '')

/** Deterministic, idempotent id for the exhibition created from a given work. */
const exhibitionIdForWork = (workId: string): string => `migrated-from-work.${publishedId(workId)}`

/** Wrap a `work.coverImage` (plain `image`) into a `mediaImage` object. */
function coverImageToMediaImage(
  cover: Record<string, unknown> | null | undefined,
  withKey: boolean,
): Record<string, unknown> | null {
  if (!cover || typeof cover !== 'object' || !('asset' in cover)) return null
  const media: Record<string, unknown> = {_type: 'mediaImage', asset: cover.asset}
  if (withKey) media._key = randomUUID()
  if (cover.crop) media.crop = cover.crop
  if (cover.hotspot) media.hotspot = cover.hotspot
  if (typeof cover.sizeOverride === 'string' && cover.sizeOverride) {
    media.sizeOverride = cover.sizeOverride
  }
  return media
}

function firstGalleryStill(
  gallery: Array<Record<string, unknown>> | null | undefined,
): Record<string, unknown> | null {
  if (!Array.isArray(gallery)) return null
  return gallery.find((item) => item && item._type === 'mediaImage') ?? null
}

/** Build the carouselImage (single `mediaImage`) for the new exhibition. */
function buildCarouselImage(work: WorkDoc): Record<string, unknown> | null {
  if (work.carouselImage && typeof work.carouselImage === 'object') {
    const {_key, ...rest} = work.carouselImage as Record<string, unknown>
    return {...rest, _type: 'mediaImage'}
  }
  const fromCover = coverImageToMediaImage(work.coverImage, false)
  if (fromCover) return fromCover
  const still = firstGalleryStill(work.gallery)
  if (still) {
    const {_key, ...rest} = still
    return {...rest}
  }
  return null
}

/** Build installationImages: cover (wrapped) first, then gallery members. */
function buildInstallationImages(work: WorkDoc): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  const cover = coverImageToMediaImage(work.coverImage, true)
  if (cover) out.push(cover)
  if (Array.isArray(work.gallery)) {
    for (const item of work.gallery) {
      if (!item || typeof item !== 'object') continue
      out.push({...item, _key: typeof item._key === 'string' ? item._key : randomUUID()})
    }
  }
  return out
}

function buildExhibitionDoc(work: WorkDoc): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    _id: exhibitionIdForWork(work._id),
    _type: 'exhibition',
    title: work.title,
    hidePublicPage: false,
  }
  if (work.slug?.current) doc.slug = {_type: 'slug', current: work.slug.current}
  if (typeof work.year === 'number') doc.year = work.year
  const carouselImage = buildCarouselImage(work)
  if (carouselImage) doc.carouselImage = carouselImage
  const installationImages = buildInstallationImages(work)
  if (installationImages.length) doc.installationImages = installationImages
  if (work.description) doc.description = work.description
  if (work.supportText) doc.supportText = work.supportText
  if (work.supportLogos) doc.supportLogos = work.supportLogos
  if (typeof work.showHomepageYear === 'boolean') doc.showHomepageYear = work.showHomepageYear
  if (typeof work.showRelatedResearchSection === 'boolean') {
    doc.showEphemeraSection = work.showRelatedResearchSection
  }
  return doc
}

async function main() {
  const client = getCliClient({apiVersion})

  console.log(`Sanity migration — linked work → exhibition`)
  console.log(`Project: ${client.config().projectId}  Dataset: ${client.config().dataset}`)
  console.log(`Mode: ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}\n`)

  // --- Step 0: discover linked works -------------------------------------
  const siteSettingsDocs: SiteSettingsDoc[] = await client.fetch(
    `*[_id in $ids]{_id, homepageCarousel}`,
    {ids: SITE_SETTINGS_IDS},
  )

  const carouselWorkRefs = new Set<string>()
  for (const ss of siteSettingsDocs) {
    for (const m of ss.homepageCarousel ?? []) {
      if (m?._type === 'homepageCarouselWork' && m._ref) carouselWorkRefs.add(publishedId(m._ref))
    }
  }

  const cvWorkEntries: CvEntryDoc[] = await client.fetch(
    `*[_type == "cvEntry" && internalRef->_type == "work"]{_id, title, internalRef}`,
  )
  const cvWorkRefs = new Set(
    cvWorkEntries
      .map((e) => (e.internalRef?._ref ? publishedId(e.internalRef._ref) : ''))
      .filter(Boolean),
  )

  const allWorkIds = Array.from(new Set([...carouselWorkRefs, ...cvWorkRefs]))

  if (allWorkIds.length === 0) {
    console.log('No linked work documents found in the carousel or CV. Nothing to migrate.')
    return
  }

  const works: WorkDoc[] = await client.fetch(
    `*[_type == "work" && _id in $ids]{
      _id, title, slug, year, coverImage, carouselImage, gallery,
      description, supportText, supportLogos, showHomepageYear, showRelatedResearchSection
    }`,
    {ids: allWorkIds},
  )
  const worksById = new Map(works.map((w) => [w._id, w]))

  // Report out-of-scope 404 sources (relatedWorks / ephemera.relatedWork).
  const otherRefs: Array<{from: string; title?: string; works: string[]}> = await client.fetch(
    `*[(_type == "exhibition" && count(relatedWorks) > 0) || (_type == "ephemera" && count(relatedWork) > 0)]{
      "from": _type + " (" + _id + ")", title,
      "works": coalesce(relatedWorks[]._ref, relatedWork[]._ref)
    }`,
  )

  console.log(`Found ${allWorkIds.length} linked work(s):`)
  for (const id of allWorkIds) {
    const w = worksById.get(id)
    const sources = [carouselWorkRefs.has(id) ? 'carousel' : null, cvWorkRefs.has(id) ? 'cv' : null]
      .filter(Boolean)
      .join('+')
    console.log(
      `  • ${w?.title ?? '(missing work doc)'}  [${id}]  slug=${w?.slug?.current ?? '—'}  via=${sources} → exhibition ${exhibitionIdForWork(id)}`,
    )
  }
  console.log('')

  // --- Step 1: create exhibitions ----------------------------------------
  const tx = client.transaction()
  const workToExhibition = new Map<string, string>()
  let toCreate = 0
  let alreadyExist = 0

  const existing: string[] = await client.fetch(`*[_id in $ids]._id`, {
    ids: allWorkIds.map(exhibitionIdForWork),
  })
  const existingSet = new Set(existing)

  for (const id of allWorkIds) {
    const work = worksById.get(id)
    if (!work) {
      console.warn(`  ! Work ${id} referenced but document not found — skipping.`)
      continue
    }
    const exId = exhibitionIdForWork(id)
    workToExhibition.set(id, exId)
    if (existingSet.has(exId)) {
      alreadyExist++
      continue
    }
    const doc = buildExhibitionDoc(work)
    toCreate++
    console.log(`  + create exhibition ${exId} (from "${work.title}")`)
    if (APPLY) tx.createIfNotExists(doc as {_id: string; _type: string})
  }

  // --- Step 2: repoint carousel members ----------------------------------
  let carouselPatched = 0
  for (const ss of siteSettingsDocs) {
    const carousel = ss.homepageCarousel ?? []
    let changed = false
    const next = carousel.map((m) => {
      if (m?._type === 'homepageCarouselWork' && m._ref) {
        const exId = workToExhibition.get(publishedId(m._ref))
        if (exId) {
          changed = true
          return {_key: m._key, _type: 'homepageCarouselExhibition', _ref: exId}
        }
      }
      return m
    })
    if (changed) {
      carouselPatched++
      console.log(`  ~ repoint carousel members in ${ss._id}`)
      if (APPLY) tx.patch(ss._id, (p) => p.set({homepageCarousel: next}))
    }
  }

  // --- Step 3: repoint cvEntry.internalRef -------------------------------
  let cvPatched = 0
  for (const entry of cvWorkEntries) {
    const ref = entry.internalRef?._ref ? publishedId(entry.internalRef._ref) : ''
    const exId = ref ? workToExhibition.get(ref) : undefined
    if (exId) {
      cvPatched++
      console.log(`  ~ repoint cvEntry ${entry._id} internalRef → ${exId}`)
      if (APPLY) tx.patch(entry._id, (p) => p.set({'internalRef._ref': exId}))
    }
  }

  // --- Commit & summary ---------------------------------------------------
  if (APPLY) {
    await tx.commit()
    console.log('\nDone. Transaction committed.')
  } else {
    console.log('\nDry run complete. No changes written. Re-run with --apply to commit.')
  }

  console.log(
    `\nSummary: ${toCreate} exhibition(s) to create, ${alreadyExist} already migrated, ` +
      `${carouselPatched} siteSettings doc(s) repointed, ${cvPatched} cvEntry ref(s) repointed.`,
  )

  if (otherRefs.length) {
    const stillWork = new Set<string>()
    for (const r of otherRefs) {
      for (const ref of r.works ?? []) {
        const pid = publishedId(ref)
        if (!workToExhibition.has(pid)) stillWork.add(pid)
      }
    }
    if (stillWork.size) {
      console.log(
        `\nNOTE (out of scope): ${stillWork.size} work(s) are referenced from ` +
          `exhibition.relatedWorks / ephemera.relatedWork and will still 404 at /work/<slug> ` +
          `if their section is shown. Re-run with these added to scope if desired:\n  ` +
          Array.from(stillWork).join('\n  '),
      )
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
