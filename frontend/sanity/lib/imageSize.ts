export type ImageSizeOverride = 'sm' | 'md' | 'lg' | 'xl'

export type ImageSizePreset = {
  width: number
  height: number
  sizes: string
}

const imageSizePresets: Record<ImageSizeOverride, ImageSizePreset> = {
  sm: {
    width: 640,
    height: 480,
    sizes: '(max-width: 640px) 100vw, 50vw',
  },
  md: {
    width: 960,
    height: 720,
    sizes: '(max-width: 1024px) 100vw, 50vw',
  },
  lg: {
    width: 1200,
    height: 900,
    sizes: '(max-width: 1280px) 100vw, 50vw',
  },
  xl: {
    width: 1600,
    height: 1200,
    sizes: '(max-width: 1536px) 100vw, 50vw',
  },
}

const defaultImageSizePreset: ImageSizePreset = imageSizePresets.lg

export function getImageSizePreset(sizeOverride?: ImageSizeOverride | null): ImageSizePreset {
  if (!sizeOverride) return defaultImageSizePreset
  return imageSizePresets[sizeOverride] ?? defaultImageSizePreset
}
