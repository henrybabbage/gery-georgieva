import type {HomepageCarouselSlide} from '@/sanity/lib/homepage-carousel'

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
		color?: string
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

const LABEL_TEXT_COLORS_DARK_BG = '#f4f4f4'
const LABEL_TEXT_COLORS_LIGHT_BG = '#2e2e2e'

function presetLabelColors(): ReadonlyArray<{ wordHint: string; labelColor: string }> {
	return [
		{ wordHint: 'golden', labelColor: LABEL_TEXT_COLORS_LIGHT_BG },
		{ wordHint: 'violet', labelColor: LABEL_TEXT_COLORS_LIGHT_BG },
		{ wordHint: 'afterglow', labelColor: LABEL_TEXT_COLORS_DARK_BG },
		{ wordHint: 'cobalt', labelColor: LABEL_TEXT_COLORS_DARK_BG },
		{ wordHint: 'meadow', labelColor: LABEL_TEXT_COLORS_DARK_BG },
		{ wordHint: 'golden ii', labelColor: LABEL_TEXT_COLORS_LIGHT_BG },
		{ wordHint: 'violet ii', labelColor: LABEL_TEXT_COLORS_LIGHT_BG },
		{ wordHint: 'afterglow ii', labelColor: LABEL_TEXT_COLORS_DARK_BG },
		{ wordHint: 'cobalt ii', labelColor: LABEL_TEXT_COLORS_DARK_BG },
		{ wordHint: 'meadow ii', labelColor: LABEL_TEXT_COLORS_DARK_BG },
	]
}

export function buildDepthGalleryPlaneConfig(
	slides: readonly HomepageCarouselSlide[],
): DepthGalleryPlaneDefinition[] {
	const usable = slides.filter((s) => typeof s.imageUrl === 'string' && s.imageUrl.trim().length > 0)
	const hints = presetLabelColors()
	const n = DEPTH_GALLERY_PRESETS.length

	return usable.map((slide, i) => {
		const preset = DEPTH_GALLERY_PRESETS[i % n]
		const hint = hints[i % hints.length]
		const title =
			slide.title.trim().length > 0 ? slide.title.trim() : 'Untitled'

		return {
			...preset,
			textureSrc: slide.imageUrl.trim(),
			label: {
				word: hint.wordHint,
				title,
				materials: '',
				year: '',
				pms: '',
				color: hint.labelColor,
			},
		}
	})
}
