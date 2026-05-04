'use client'

import {useEffect, useRef} from 'react'

type GalleryRowDebugLogProps = {
  debugId: string
  hasCaption: boolean
  index: number
  justify: 'left' | 'center' | 'right'
  orientation: 'portrait' | 'landscape'
}

function rectData(element: Element | null) {
  if (!(element instanceof HTMLElement)) return null
  const rect = element.getBoundingClientRect()
  return {
    className: element.className,
    height: Math.round(rect.height),
    width: Math.round(rect.width),
    top: Math.round(rect.top),
    bottom: Math.round(rect.bottom),
  }
}

export function GalleryRowDebugLog({
  debugId,
  hasCaption,
  index,
  justify,
  orientation,
}: GalleryRowDebugLogProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const anchor = ref.current
    const row = anchor?.closest('[data-staggered-row="true"]') ?? null
    const rowContent = anchor?.closest('[data-row-content="true"]') ?? null
    const mediaGrid = rowContent?.querySelector('[data-media-grid="true"]') ?? null
    const captionGrid = rowContent?.querySelector('[data-caption-grid="true"]') ?? null
    const mediaCell = mediaGrid?.querySelector('[data-media-cell="true"]') ?? null
    const captionCell = captionGrid?.querySelector('[data-caption-cell="true"]') ?? null
    const mediaElement = mediaCell?.querySelector('img, video, iframe, button') ?? null
    const captionRow = row?.nextElementSibling?.matches('[data-caption-row="true"]')
      ? row.nextElementSibling
      : null
    const captionSiblingGrid = captionRow?.querySelector('[data-caption-grid="true"]') ?? null
    const captionSiblingCell = captionRow?.querySelector('[data-caption-cell="true"]') ?? null
    const nextMediaRow = captionRow?.nextElementSibling?.matches('[data-staggered-row="true"]')
      ? captionRow.nextElementSibling
      : row?.nextElementSibling?.matches('[data-staggered-row="true"]')
        ? row.nextElementSibling
        : null

    // #region agent log
    fetch('http://127.0.0.1:7459/ingest/049f0b63-69c8-4d95-b1ff-6330d01dadec', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Debug-Session-Id': '4fae75'},
      body: JSON.stringify({
        sessionId: '4fae75',
        runId: 'initial',
        hypothesisId: 'A,B,C,D',
        location: 'frontend/app/components/gallery-row-debug-log.tsx:36',
        message: 'staggered gallery row runtime geometry',
        data: {
          path: window.location.pathname,
          debugId,
          index,
          justify,
          orientation,
          hasCaption,
          row: rectData(row),
          rowContent: rectData(rowContent),
          mediaGrid: rectData(mediaGrid),
          captionGrid: rectData(captionGrid),
          mediaCell: rectData(mediaCell),
          captionCell: rectData(captionCell),
          mediaElement: rectData(mediaElement),
          captionRow: rectData(captionRow),
          captionSiblingGrid: rectData(captionSiblingGrid),
          captionSiblingCell: rectData(captionSiblingCell),
          nextMediaRow: rectData(nextMediaRow),
          gapMediaToCaption:
            captionRow instanceof HTMLElement && row instanceof HTMLElement
              ? Math.round(captionRow.getBoundingClientRect().top - row.getBoundingClientRect().bottom)
              : null,
          gapCaptionToNextMedia:
            captionRow instanceof HTMLElement && nextMediaRow instanceof HTMLElement
              ? Math.round(
                  nextMediaRow.getBoundingClientRect().top -
                    captionRow.getBoundingClientRect().bottom,
                )
              : null,
          captionInsideRowContent:
            rowContent instanceof HTMLElement &&
            captionGrid instanceof HTMLElement &&
            rowContent.contains(captionGrid),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  }, [debugId, hasCaption, index, justify, orientation])

  return <span ref={ref} data-gallery-debug-anchor={debugId} hidden />
}
