import {stegaClean} from '@sanity/client/stega'

export type ImageSizeOverride = 'sm' | 'md' | 'lg' | 'xl'

export type ImageSizePreset = {
  width: number
  height: number
  sizes: string
}

/** Preset widths: `md` matches former default (`lg`) so “medium” keeps prior CDN sharpness when unset. */
const imageSizePresets: Record<ImageSizeOverride, ImageSizePreset> = {
  sm: {
    width: 640,
    height: 480,
    sizes: '(max-width: 640px) 100vw, 42vw',
  },
  md: {
    width: 1200,
    height: 900,
    sizes: '(max-width: 1280px) 100vw, 50vw',
  },
  lg: {
    width: 1400,
    height: 1050,
    sizes: '(max-width: 1400px) 100vw, 55vw',
  },
  xl: {
    width: 1600,
    height: 1200,
    sizes: '(max-width: 1536px) 100vw, 60vw',
  },
}

const defaultImageSizePreset: ImageSizePreset = imageSizePresets.md

function normalizeSizeOverride(value: unknown): ImageSizeOverride | undefined {
  if (value == null || value === '') return undefined
  const cleaned = String(stegaClean(value)).trim()
  if (cleaned === 'sm' || cleaned === 'md' || cleaned === 'lg' || cleaned === 'xl') return cleaned
  return undefined
}

/** Per-placement `sizeOverride` wins over the dereferenced asset default. */
export function getEffectiveImageSizeOverride(input: {
  sizeOverride?: ImageSizeOverride | null
  asset?: {sizeOverride?: ImageSizeOverride | null} | null
}): ImageSizeOverride | undefined {
  return (
    normalizeSizeOverride(input.sizeOverride) ??
    normalizeSizeOverride(input.asset?.sizeOverride) ??
    undefined
  )
}

export function getImageSizePreset(sizeOverride?: ImageSizeOverride | null): ImageSizePreset {
  if (!sizeOverride) return defaultImageSizePreset
  return imageSizePresets[sizeOverride] ?? defaultImageSizePreset
}
