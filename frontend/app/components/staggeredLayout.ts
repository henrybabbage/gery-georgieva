import type {ImageSizeOverride} from '@/sanity/lib/imageSize'

/**
 * Pure, presentation-agnostic primitives for the staggered single-image-per-row layout shared by
 * the exhibition/work slug galleries (`ExhibitionStaggeredMedia`) and the Work index page
 * (`WorkIndexStaggered`). Keeping the rhythm, column spans, portrait caps, and row spacing in one
 * place means the index reads as the same visual system as the detail pages it links into.
 *
 * Everything here depends only on orientation / size tier / row index / a seed title — never on a
 * specific Sanity item shape.
 */

export type Orientation = 'portrait' | 'landscape'

export type RowJustify = 'left' | 'center' | 'right'

/** Paper nodes 3L-0 … 4T-0 in order (`flex-start` → left, `flex-end` → right, `space-around` → center). */
export const ROW_JUSTIFY_PATTERN: RowJustify[] = [
  'left',
  'left',
  'right',
  'center',
  'right',
  'right',
  'left',
  'center',
  'left',
  'center',
  'center',
]

export const PATTERN_LEN = ROW_JUSTIFY_PATTERN.length

/** Stable per-title phase so layout is identical on every visit until title or image order changes. */
export function layoutSeedFromTitle(title: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < title.length; i++) {
    h ^= title.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export const FORCED_FIRST_ALIGNMENTS: RowJustify[] = ['left', 'center', 'right']

/**
 * When the gallery has more than three images, the first three desktop rows are always
 * left, center, and right so every orientation appears; row 4+ use the seeded Paper rhythm.
 * `absoluteIndex` is the row index across the whole installation (lead + tail when split).
 */
export function justifyForIndex(
  absoluteIndex: number,
  title: string,
  galleryImageCount: number,
): RowJustify {
  if (galleryImageCount > 3 && absoluteIndex < 3) {
    return FORCED_FIRST_ALIGNMENTS[absoluteIndex]
  }
  const seed = layoutSeedFromTitle(title)
  return ROW_JUSTIFY_PATTERN[(seed + absoluteIndex) % PATTERN_LEN]
}

/** Subtle portrait height steps; `md` matches historical single cap. */
export const PORTRAIT_MAX: Record<ImageSizeOverride, string> = {
  sm: 'max-h-[min(78vh,820px)]',
  md: 'max-h-[min(85vh,900px)]',
  lg: 'max-h-[min(88vh,940px)]',
  xl: 'max-h-[min(91vh,980px)]',
}

export const COL_SPAN: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
}

/** `col-start-{13 - imgSpan}` so a right-aligned image block ends at column 12. */
export const RIGHT_IMAGE_START: Record<number, string> = {
  3: 'col-start-10',
  4: 'col-start-9',
  5: 'col-start-8',
  6: 'col-start-7',
  7: 'col-start-6',
  8: 'col-start-5',
}

export function leftRightImageColSpan(orientation: Orientation, tier: ImageSizeOverride): number {
  if (orientation === 'portrait') {
    const byTier: Record<ImageSizeOverride, number> = {sm: 3, md: 4, lg: 5, xl: 6}
    return byTier[tier]
  }
  /** `md` was identical to `lg` here (both 6) — landscape never grew for lg; step by column. */
  const byTier: Record<ImageSizeOverride, number> = {sm: 5, md: 6, lg: 7, xl: 8}
  return byTier[tier]
}

export function getCenterRowSpans(
  orientation: Orientation,
  tier: ImageSizeOverride,
): {lead: number; img: number; tail: number} {
  if (orientation === 'portrait') {
    switch (tier) {
      case 'sm':
        return {lead: 4, img: 3, tail: 5}
      case 'md':
        return {lead: 3, img: 4, tail: 5}
      case 'lg':
        return {lead: 3, img: 5, tail: 4}
      case 'xl':
        return {lead: 2, img: 6, tail: 4}
    }
  }
  switch (tier) {
    case 'sm':
      return {lead: 3, img: 5, tail: 4}
    case 'md':
      return {lead: 2, img: 6, tail: 4}
    case 'lg':
      return {lead: 1, img: 7, tail: 4}
    case 'xl':
      return {lead: 1, img: 8, tail: 3}
  }
}

/**
 * Space between staggered rows (tablet/desktop). Uses fluid `clamp()` so spacing scales with
 * the viewport but stays bounded — rem min/max respect zoom; vw in the preferred term tracks width.
 */
export const ROW_MARGIN_BOTTOM = 'mb-[clamp(2.5rem,1.875rem+5.25vw,6.875rem)]'

/** Fluid gap for the mobile single-column stack. */
export const MOBILE_STACK_GAP = 'gap-[clamp(2.5rem,2rem+4.5vw,4rem)]'

/* ------------------------------------------------------------------ *
 * Dense overview grid (Work index)
 *
 * The slug/detail pages reveal one image per row. The Work index is an
 * overview, so it reuses the same visual language — 12-column asymmetric
 * spans, natural aspect ratios, fluid spacing, caption typography — but
 * packs 2–3 shows per band so the page scans quickly instead of forcing a
 * long single-file scroll. The primitives below are additive; the
 * one-per-row exports above are untouched and still drive the slug pages.
 * ------------------------------------------------------------------ */

/** Seeded sequence of band sizes (items per desktop band), cycled. Mostly 3 with an occasional 2. */
export const DENSE_BAND_PATTERN: number[] = [3, 2, 3, 3, 2]

/**
 * Slice `count` items into bands of 2–3 using `DENSE_BAND_PATTERN`, phase-shifted by `seed` so the
 * rhythm is deterministic per index. A trailing lonely single is merged into the previous band so
 * no band ever holds just one item.
 */
export function denseBandSizes(count: number, seed: string): number[] {
  if (count <= 0) return []
  const phase = layoutSeedFromTitle(seed) % DENSE_BAND_PATTERN.length
  const sizes: number[] = []
  let remaining = count
  let i = 0
  while (remaining > 0) {
    const next = DENSE_BAND_PATTERN[(phase + i) % DENSE_BAND_PATTERN.length]
    const size = Math.min(next, remaining)
    sizes.push(size)
    remaining -= size
    i++
  }
  // Avoid a lonely trailing single while keeping the max band size at 3:
  // [..., 3, 1] → [..., 2, 2]; [..., 2, 1] → [..., 3].
  if (sizes.length > 1 && sizes[sizes.length - 1] === 1) {
    const prev = sizes[sizes.length - 2]
    if (prev >= 3) {
      sizes[sizes.length - 2] = prev - 1
      sizes[sizes.length - 1] = 2
    } else {
      sizes[sizes.length - 2] = prev + 1
      sizes.pop()
    }
  }
  return sizes
}

/** Column-span variants per band size; each variant sums to 12 so a band fills the grid width. */
export const DENSE_BAND_SPANS: Record<number, number[][]> = {
  2: [
    [6, 6],
    [7, 5],
    [5, 7],
  ],
  3: [
    [4, 4, 4],
    [3, 4, 5],
    [5, 4, 3],
    [4, 3, 5],
  ],
}

/** Pick a span distribution for a band deterministically from the seed + band index. */
export function denseSpansForBand(size: number, bandIndex: number, seed: string): number[] {
  const variants = DENSE_BAND_SPANS[size] ?? [Array(size).fill(Math.floor(12 / size))]
  const phase = layoutSeedFromTitle(seed)
  return variants[(phase + bandIndex) % variants.length]
}

/** Small per-item vertical offsets within a band to break the rigid baseline (slug-page depth feel). */
export const DENSE_OFFSET_PATTERN: string[] = ['', 'md:translate-y-6', 'md:translate-y-3']

/** Fluid vertical gap between dense bands — a touch tighter than `ROW_MARGIN_BOTTOM` since density is the point. */
export const DENSE_BAND_MARGIN = 'mb-[clamp(2rem,1.5rem+3vw,4rem)]'

/** Portrait height caps scaled down for the ~⅓-width dense tiles so a tall portrait can't blow out a band. */
export const DENSE_PORTRAIT_MAX = 'max-h-[min(60vh,640px)]'
