import {SANITY_IMAGE_PALETTE_MOOD_FOR_HOMEPAGE_DEPTH_GALLERY} from '@/lib/depth-gallery/homepage-background-mood'

import type {HomepageCarouselSlide} from '@/sanity/lib/homepage-carousel'

const HOMEPAGE_DEPTH_GALLERY_NEUTRAL_BACKDROP_MOOD = {
	backgroundColor: '#ffffff',
	blob1Color: '#f3f3f3',
	blob2Color: '#e9e9e9',
} as const

export interface DepthGalleryPlaneDefinition {
	fallbackColor?: string
	accentColor?: string
	textureSrc: string
	position: { x: number; y: number }
	backgroundColor?: string
	blob1Color?: string
	blob2Color?: string
	label?: {
		word?: string
		title?: string
		year?: string
		materials?: string
		pms?: string
	}
}

/** Layout + mood palette from codrops-depth-gallery reference (`galleryPlaneData`). */
const DEPTH_GALLERY_PRESETS: ReadonlyArray<
	Omit<DepthGalleryPlaneDefinition, 'textureSrc' | 'label'>
> = [
	{
		fallbackColor: '#feca4f',
		accentColor: '#feca4f',
		position: { x: -0.2, y: 0 },
		backgroundColor: '#fffaf0',
		blob1Color: '#ffdf94',
		blob2Color: '#fce7c4',
	},
	{
		fallbackColor: '#80455a',
		accentColor: '#80455a',
		position: { x: 0.8, y: 0 },
		backgroundColor: '#fffaf0',
		blob1Color: '#d29a41',
		blob2Color: '#bb96af',
	},
	{
		fallbackColor: '#fa7b71',
		accentColor: '#fa7b71',
		position: { x: -0.7, y: 0 },
		backgroundColor: '#5f81ab',
		blob1Color: '#f88b8d',
		blob2Color: '#cfbbdd',
	},
	{
		fallbackColor: '#3c72c6',
		accentColor: '#3c72c6',
		position: { x: 1, y: 0 },
		backgroundColor: '#5b9bc2',
		blob1Color: '#ffaa00',
		blob2Color: '#00e1ff',
	},
	{
		fallbackColor: '#fdd895',
		accentColor: '#fdd895',
		position: { x: -0.7, y: 0 },
		backgroundColor: '#7d936e',
		blob1Color: '#fdd895',
		blob2Color: '#a5b599',
	},
	{
		fallbackColor: '#feca4f',
		accentColor: '#feca4f',
		position: { x: 0.65, y: 0 },
		backgroundColor: '#fffaf0',
		blob1Color: '#ffdf94',
		blob2Color: '#fce7c4',
	},
	{
		fallbackColor: '#80455a',
		accentColor: '#80455a',
		position: { x: -0.8, y: 0 },
		backgroundColor: '#fffaf0',
		blob1Color: '#d29a41',
		blob2Color: '#bb96af',
	},
	{
		fallbackColor: '#fa7b71',
		accentColor: '#fa7b71',
		position: { x: 0.9, y: 0 },
		backgroundColor: '#5f81ab',
		blob1Color: '#f88b8d',
		blob2Color: '#cfbbdd',
	},
	{
		fallbackColor: '#3c72c6',
		accentColor: '#3c72c6',
		position: { x: -0.95, y: 0 },
		backgroundColor: '#5b9bc2',
		blob1Color: '#ffaa00',
		blob2Color: '#00e1ff',
	},
	{
		fallbackColor: '#fdd895',
		accentColor: '#fdd895',
		position: { x: 1.05, y: 0 },
		backgroundColor: '#7d936e',
		blob1Color: '#fdd895',
		blob2Color: '#a5b599',
	},
]

const LABEL_WORD_HINTS = [
	'golden',
	'violet',
	'afterglow',
	'cobalt',
	'meadow',
	'golden ii',
	'violet ii',
	'afterglow ii',
	'cobalt ii',
	'meadow ii',
] as const

export function buildDepthGalleryPlaneConfig(
	slides: readonly HomepageCarouselSlide[],
): DepthGalleryPlaneDefinition[] {
	const usable = slides.filter((s) => typeof s.imageUrl === 'string' && s.imageUrl.trim().length > 0)
	const n = DEPTH_GALLERY_PRESETS.length
	const hintN = LABEL_WORD_HINTS.length

	return usable.map((slide, i) => {
		const preset = DEPTH_GALLERY_PRESETS[i % n]
		const wordHint = LABEL_WORD_HINTS[i % hintN]
		const title =
			slide.title.trim().length > 0 ? slide.title.trim() : 'Untitled'
		const mood = slide.moodColors

		const moodTint =
			SANITY_IMAGE_PALETTE_MOOD_FOR_HOMEPAGE_DEPTH_GALLERY && mood
				? {
						backgroundColor: mood.background,
						blob1Color: mood.blob1,
						blob2Color: mood.blob2,
						fallbackColor: mood.accent,
						accentColor: mood.accent,
					}
				: SANITY_IMAGE_PALETTE_MOOD_FOR_HOMEPAGE_DEPTH_GALLERY
					? {}
					: HOMEPAGE_DEPTH_GALLERY_NEUTRAL_BACKDROP_MOOD

		return {
			...preset,
			...moodTint,
			textureSrc: slide.imageUrl.trim(),
			label: {
				word: wordHint,
				title,
				materials: '',
				year: '',
				pms: '',
			},
		}
	})
}
