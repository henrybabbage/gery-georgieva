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
 * Paired-row overview grid (Work index)
 *
 * The slug/detail pages reveal one image per row. The Work index is an
 * overview, so it keeps the same visual DNA — the 12-column grid, orientation
 * sizing, natural proportions, `aria-hidden` spacer-column negative space, and
 * quiet image-aligned captions — but places TWO shows per row with their tops
 * aligned (no offsets), halving the scroll while reading as "the slug grid,
 * two at a time." The primitives below are additive; the one-per-row exports
 * above are untouched and still drive the slug pages.
 * ------------------------------------------------------------------ */

/** Empty (`lead`/`gap`/`tail`) and filled (`left`/`right`) column counts for a paired row; sums to 12. */
export type PairTemplate = {lead: number; left: number; gap: number; right: number; tail: number}

/** Orientation combos → seeded template variants (each summing to 12); portraits stay narrow, landscapes wide. */
export const PAIR_TEMPLATES: Record<string, PairTemplate[]> = {
  'portrait-landscape': [
    {lead: 0, left: 4, gap: 1, right: 7, tail: 0},
    {lead: 1, left: 4, gap: 1, right: 6, tail: 0},
  ],
  'landscape-portrait': [
    {lead: 0, left: 7, gap: 1, right: 4, tail: 0},
    {lead: 0, left: 6, gap: 1, right: 4, tail: 1},
  ],
  'portrait-portrait': [
    {lead: 1, left: 4, gap: 2, right: 4, tail: 1},
    {lead: 0, left: 4, gap: 3, right: 4, tail: 1},
  ],
  'landscape-landscape': [
    {lead: 0, left: 6, gap: 1, right: 5, tail: 0},
    {lead: 0, left: 5, gap: 1, right: 6, tail: 0},
  ],
}

/** Pick a paired-row template deterministically from the pair's orientations + index. */
export function pairTemplate(
  orientationLeft: Orientation,
  orientationRight: Orientation,
  pairIndex: number,
  seed: string,
): PairTemplate {
  const variants =
    PAIR_TEMPLATES[`${orientationLeft}-${orientationRight}`] ??
    PAIR_TEMPLATES['landscape-landscape']
  const phase = layoutSeedFromTitle(seed)
  return variants[(phase + pairIndex) % variants.length]
}

/** A lone trailing item (odd count) renders centered, reusing the slug center-row spans. */
export function featureTemplate(orientation: Orientation): {lead: number; img: number; tail: number} {
  return getCenterRowSpans(orientation, 'md')
}

/** Fluid vertical gap between paired rows — a touch tighter than `ROW_MARGIN_BOTTOM` since this is an overview. */
export const DENSE_ROW_MARGIN = 'mb-[clamp(2rem,1.5rem+3vw,4rem)]'

/** Portrait height cap for the ~half-width paired tiles so a tall portrait can't dominate a row. */
export const DENSE_PORTRAIT_MAX = 'max-h-[min(70vh,760px)]'
