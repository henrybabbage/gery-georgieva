import type {SanityImagePalette, SanityImagePaletteSwatch} from '@/sanity.types'

export interface SanityPaletteMoodColors {
	background: string
	blob1: string
	blob2: string
	/** Dominant swatch when present, else matches blob1 — for plane tint / accent. */
	accent: string
}

function swatchBg(s: SanityImagePaletteSwatch | undefined): string | null {
	const b = s?.background?.trim()
	return b && b.length > 0 ? b : null
}

function normalizeHexKey(hex: string): string {
	const s = hex.trim()
	const h = s.startsWith('#') ? s.slice(1).toLowerCase() : s.toLowerCase()
	if (h.length === 3) {
		return h.split('').map((c) => c + c).join('')
	}
	return h.length === 6 ? h : hex.toLowerCase()
}

function firstDistinctFrom(
	candidates: Array<string | null>,
	avoid: string,
): string | null {
	const avoidKey = normalizeHexKey(avoid)
	for (const c of candidates) {
		if (c !== null && normalizeHexKey(c) !== avoidKey) {
			return c
		}
	}
	return null
}

function mixTowardWhite(hex: string, amount: number): string {
	const s = hex.trim()
	const raw = s.startsWith('#') ? s.slice(1) : s
	let h = raw
	if (h.length === 3) {
		h = h.split('').map((c) => c + c).join('')
	}
	if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) {
		return '#f5f5f0'
	}
	const r = parseInt(h.slice(0, 2), 16)
	const g = parseInt(h.slice(2, 4), 16)
	const b = parseInt(h.slice(4, 6), 16)
	const mix = (c: number) =>
		Math.min(255, Math.round(c + (255 - c) * amount))
	const rr = mix(r).toString(16).padStart(2, '0')
	const gg = mix(g).toString(16).padStart(2, '0')
	const bb = mix(b).toString(16).padStart(2, '0')
	return `#${rr}${gg}${bb}`
}

/**
 * Maps Sanity asset image palette (from `metadata.palette`) to background blob
 * colors for the depth gallery. Returns null if there is no usable swatch.
 */
export function moodColorsFromSanityPalette(
	palette: SanityImagePalette | null | undefined,
): SanityPaletteMoodColors | null {
	const blob1 =
		swatchBg(palette?.vibrant) ??
		swatchBg(palette?.dominant) ??
		swatchBg(palette?.muted)
	if (!blob1) return null

	const blob2 =
		firstDistinctFrom(
			[
				swatchBg(palette?.muted),
				swatchBg(palette?.darkMuted),
				swatchBg(palette?.lightVibrant),
				swatchBg(palette?.darkVibrant),
				swatchBg(palette?.lightMuted),
				swatchBg(palette?.dominant),
				swatchBg(palette?.vibrant),
			],
			blob1,
		) ?? mixTowardWhite(blob1, 0.32)

	const background =
		swatchBg(palette?.lightMuted) ?? mixTowardWhite(blob1, 0.52)

	const accent = swatchBg(palette?.dominant) ?? blob1

	return {background, blob1, blob2, accent}
}
