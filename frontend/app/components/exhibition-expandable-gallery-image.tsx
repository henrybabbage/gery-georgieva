'use client'

import {Cambio} from 'cambio'
import Image from 'next/image'
import {useCallback, useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

type Orientation = 'portrait' | 'landscape'

export interface ExhibitionExpandableGalleryImageProps {
  imageUrl: string
  popupUrl: string
  width: number
  height: number
  /** Pixel dimensions of `popupUrl` (after Sanity `width()` cap). Keeps lightbox requests from overshooting. */
  popupIntrinsicWidth: number
  popupIntrinsicHeight: number
  alt: string
  sizes: string
  frameClass: string
  orientation: Orientation
  caption?: string | null
  credit?: string | null
  /** Sanity asset `metadata.lqip` — tiny base64 preview for blur-up. */
  popupLqip?: string | null
  /** Sanity palette swatch (e.g. `metadata.palette.dominant.background`) — fills behind image until sharp. */
  popupPlaceholderColor?: string | null
  /** Installation size tier — caps portrait trigger height on the exhibition page. */
  portraitMaxClass?: string
}

function preloadImageUrl(url: string) {
  if (typeof window === 'undefined') return
  const img = new window.Image()
  img.src = url
}

/** White frame — `mix-blend-difference` inverts against pixels beneath; aspect matches image orientation. */
function ExpandInvertCursorGlyph({orientation}: {orientation: Orientation}) {
  if (orientation === 'portrait') {
    return (
      <svg width={24} height={36} viewBox="0 0 24 36" fill="none" aria-hidden className="block">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          d="M6 12V8h4M18 12V8h-4M6 24v4h4M18 24v4h-4"
        />
      </svg>
    )
  }
  return (
    <svg width={36} height={24} viewBox="0 0 36 24" fill="none" aria-hidden className="block">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        d="M8 10V6h4M28 10V6h-4M8 14v4h4M28 14v4h-4"
      />
    </svg>
  )
}

function expandCursorHotspotPx(orientation: Orientation): {x: number; y: number} {
  return orientation === 'portrait' ? {x: 12, y: 18} : {x: 18, y: 12}
}

export function ExhibitionExpandableGalleryImage({
  imageUrl,
  popupUrl,
  width,
  height,
  popupIntrinsicWidth,
  popupIntrinsicHeight,
  alt,
  sizes,
  frameClass,
  orientation,
  caption,
  credit,
  popupLqip,
  popupPlaceholderColor,
  portraitMaxClass = '',
}: ExhibitionExpandableGalleryImageProps) {
  const portraitMax =
    portraitMaxClass || (orientation === 'portrait' ? 'max-h-[min(85vh,900px)]' : '')
  const descriptionParts = [caption?.trim(), credit?.trim()].filter(Boolean)
  const descriptionBody = descriptionParts.length ? descriptionParts.join(' — ') : alt
  const description = `${descriptionBody}. Press Escape or click outside the image to close.`

  const [open, setOpen] = useState(false)
  const [popupImageReady, setPopupImageReady] = useState(false)

  const lqip =
    popupLqip && (popupLqip.startsWith('data:') || popupLqip.startsWith('http')) ? popupLqip : null
  const useBlurPlaceholder = Boolean(lqip)
  const underlayColor =
    popupPlaceholderColor?.trim() || 'var(--color-placeholder)'
  const dominantAccent =
    popupPlaceholderColor?.trim() || 'var(--color-ink)'

  const [pointerFine, setPointerFine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  )
  const [triggerPointerInside, setTriggerPointerInside] = useState(false)
  const [invertCursorPos, setInvertCursorPos] = useState<{x: number; y: number} | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const sync = () => setPointerFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setPopupImageReady(false)
    if (next) {
      setTriggerPointerInside(false)
      setInvertCursorPos(null)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = popupUrl
    link.setAttribute('fetchpriority', 'high')
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [open, popupUrl])

  const onPreloadIntent = useCallback(() => {
    preloadImageUrl(popupUrl)
  }, [popupUrl])

  const onTriggerPointerEnter = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      onPreloadIntent()
      setTriggerPointerInside(true)
      setInvertCursorPos({x: e.clientX, y: e.clientY})
    },
    [onPreloadIntent],
  )

  const onTriggerPointerLeave = useCallback(() => {
    setTriggerPointerInside(false)
    setInvertCursorPos(null)
  }, [])

  const onTriggerPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!pointerFine) return
      setInvertCursorPos({x: e.clientX, y: e.clientY})
    },
    [pointerFine],
  )

  const canUsePortal = typeof document !== 'undefined'
  const showInvertExpandCursor =
    canUsePortal &&
    pointerFine &&
    triggerPointerInside &&
    !open &&
    invertCursorPos != null

  const invertCursorHotspot = expandCursorHotspotPx(orientation)

  return (
    <Cambio.Root motion="smooth" open={open} onOpenChange={handleOpenChange}>
      {showInvertExpandCursor &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[10000] text-white mix-blend-difference"
            style={{
              left: invertCursorPos!.x,
              top: invertCursorPos!.y,
              transform: `translate(-${invertCursorHotspot.x}px, -${invertCursorHotspot.y}px)`,
            }}
            aria-hidden
          >
            <ExpandInvertCursorGlyph orientation={orientation} />
          </div>,
          document.body,
        )}
      <Cambio.Trigger
        type="button"
        className={
          showInvertExpandCursor
            ? 'group block w-full cursor-none overflow-visible border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#1c1b18]/25 focus-visible:ring-offset-2'
            : 'group cursor-exhibition-expand block w-full overflow-visible border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#1c1b18]/25 focus-visible:ring-offset-2'
        }
        aria-label={`View larger: ${alt}`}
        onPointerEnter={onTriggerPointerEnter}
        onPointerLeave={onTriggerPointerLeave}
        onPointerMove={onTriggerPointerMove}
        onPointerDown={onPreloadIntent}
        onFocus={onPreloadIntent}
      >
        <div
          className={`relative w-full overflow-visible bg-placeholder ${frameClass} ${orientation === 'portrait' ? portraitMax : ''}`}
        >
          <Image
            src={imageUrl}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            className="block h-auto w-full max-w-full object-contain"
          />
          <span
            className="pointer-events-none absolute inset-0 overflow-visible opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          >
            <span
              className="absolute left-0 top-0 h-2 w-2 -translate-x-[calc(100%+1px)] -translate-y-[calc(100%+1px)] border-l border-t border-solid"
              style={{borderColor: dominantAccent}}
            />
            <span
              className="absolute right-0 top-0 h-2 w-2 translate-x-[calc(100%+1px)] -translate-y-[calc(100%+1px)] border-r border-t border-solid"
              style={{borderColor: dominantAccent}}
            />
            <span
              className="absolute bottom-0 left-0 h-2 w-2 -translate-x-[calc(100%+1px)] translate-y-[calc(100%+1px)] border-b border-l border-solid"
              style={{borderColor: dominantAccent}}
            />
            <span
              className="absolute bottom-0 right-0 h-2 w-2 translate-x-[calc(100%+1px)] translate-y-[calc(100%+1px)] border-b border-r border-solid"
              style={{borderColor: dominantAccent}}
            />
          </span>
        </div>
      </Cambio.Trigger>
      <Cambio.Portal>
        <Cambio.Backdrop className="fixed inset-0 z-[1000] bg-black/75" />
        <Cambio.Popup className="z-[1001] max-h-[min(92vh,1200px)] max-w-[min(96vw,1400px)] overflow-visible border-0 bg-transparent p-0 shadow-none outline-none ring-0">
          <Cambio.Title className="sr-only">{alt}</Cambio.Title>
          <Cambio.Description className="sr-only">{description}</Cambio.Description>
          <div
            className="relative flex max-h-[min(90vh,1180px)] w-full items-center justify-center overflow-hidden rounded-sm"
            style={{backgroundColor: underlayColor}}
          >
            <Image
              src={popupUrl}
              alt={alt}
              width={popupIntrinsicWidth}
              height={popupIntrinsicHeight}
              sizes="(max-width: 1536px) 96vw, 1400px"
              unoptimized
              placeholder={useBlurPlaceholder ? 'blur' : 'empty'}
              blurDataURL={useBlurPlaceholder ? lqip! : undefined}
              className={`h-auto max-h-[min(90vh,1180px)] w-auto max-w-[min(96vw,1400px)] object-contain transition-opacity duration-500 ease-out ${
                !useBlurPlaceholder || popupImageReady ? 'opacity-100' : 'opacity-0'
              }`}
              priority={false}
              fetchPriority={open ? 'high' : 'low'}
              onLoadingComplete={() => setPopupImageReady(true)}
            />
          </div>
        </Cambio.Popup>
      </Cambio.Portal>
    </Cambio.Root>
  )
}
