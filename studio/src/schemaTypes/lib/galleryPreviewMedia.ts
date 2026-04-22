import type {Image, PreviewValue} from '@sanity/types'
import {PlayCircle} from '@phosphor-icons/react'
import {createElement, type ComponentType} from 'react'

const STUDIO_MEDIA_PREVIEW_PLAY_PX = 52

export function playCirclePreviewMedia(): PreviewValue['media'] {
  return function StudioVideoPlayPreviewMedia() {
    return createElement(PlayCircle, {
      color: 'var(--card-icon-color)',
      size: STUDIO_MEDIA_PREVIEW_PLAY_PX,
      // MediaPreview caps non-Sanity SVGs to 1em; inline size beats that rule.
      style: {
        flex: 'none',
        width: STUDIO_MEDIA_PREVIEW_PLAY_PX,
        height: STUDIO_MEDIA_PREVIEW_PLAY_PX,
        maxWidth: 'none',
        maxHeight: 'none',
      },
    })
  }
}

export function previewMediaFromFirstGalleryItem(
  raw: unknown,
  fallbackIcon: ComponentType,
): PreviewValue['media'] {
  if (!raw || typeof raw !== 'object' || !('_type' in raw)) {
    return fallbackIcon
  }
  const t = (raw as {_type: string})._type
  if (t === 'mediaImage') {
    const img = raw as Image
    return (img.asset ? img : fallbackIcon) as PreviewValue['media']
  }
  if (t === 'mediaVideoFile') {
    const v = raw as {poster?: Image}
    return (v.poster?.asset ? v.poster : playCirclePreviewMedia()) as PreviewValue['media']
  }
  return fallbackIcon as PreviewValue['media']
}
