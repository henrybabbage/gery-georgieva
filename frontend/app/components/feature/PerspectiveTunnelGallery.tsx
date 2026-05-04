'use client'

import {useDialKit} from 'dialkit'
import {gsap} from '@/lib/gsap'
import Image from 'next/image'
import Link from 'next/link'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

const INITIAL_SCROLL = 750

function hasCarouselImageSrc(src: string): boolean {
  return typeof src === 'string' && src.trim().length > 0
}

function calculateOverlay(z: number, visibleDepth: number, exitPoint: number): number {
  if (z > exitPoint) return 1
  if (z > 0) return z / exitPoint
  if (z > -visibleDepth) {
    const progress = Math.abs(z) / visibleDepth
    return progress * progress
  }
  return 1
}

function transitionImageBlurPx(
  z: number,
  overlay: number,
  exitPoint: number,
  visibleDepth: number,
  enterBlurPx: number,
  exitBlurPx: number,
  withBlur: boolean,
): number {
  if (!withBlur || (enterBlurPx <= 0 && exitBlurPx <= 0) || visibleDepth <= 0 || exitPoint <= 0) {
    return 0
  }
  const o = Math.min(1, Math.max(0, overlay))
  if (o <= 0 || o >= 1) return 0
  const edgePulse = Math.max(0, 4 * o * (1 - o))
  if (edgePulse <= 0) return 0
  let w = 0
  if (enterBlurPx > 0 && z < 0 && z > -visibleDepth) {
    const t = -z / visibleDepth
    w += enterBlurPx * Math.sin(Math.PI * t)
  }
  if (exitBlurPx > 0 && z >= 0 && z < exitPoint) {
    const t = z / exitPoint
    w += exitBlurPx * Math.sin(Math.PI * t)
  }
  return Math.min(96, Math.max(0, w * edgePulse))
}

interface TunnelPlane {
  key: string
  planeIndex: number
  slideIndex: number
  angle: number
  baseZ: number
}

function buildPlanes(
  imageSrcs: readonly string[],
  stableKeys: readonly string[],
  layerGapPx: number,
): TunnelPlane[] {
  const n = imageSrcs.length
  if (n === 0) return []
  const cycles = Math.max(6, Math.ceil(24 / n))
  const planeCount = n * cycles
  const planes: TunnelPlane[] = []
  for (let i = 0; i < planeCount; i++) {
    const slideIndex = i % n
    const angle = ((slideIndex % 4) / 4) * Math.PI * 2 - Math.PI / 2
    planes.push({
      key: `P${i}-${stableKeys[slideIndex] ?? String(slideIndex)}`,
      planeIndex: i,
      slideIndex,
      angle,
      baseZ: -i * layerGapPx,
    })
  }
  return planes
}

const EMPTY_SLIDE_KEYS: readonly string[] = []

const TUNNEL_DIALKIT_NAME = 'Perspective Scroll'

export interface PerspectiveTunnelGalleryProps {
  imageSrcs: readonly string[]
  slideKeys?: readonly string[]
  slideHrefs?: readonly (string | null)[]
  slideTitles?: readonly string[]
}

export default function PerspectiveTunnelGallery({
  imageSrcs,
  slideKeys = EMPTY_SLIDE_KEYS,
  slideHrefs = [],
  slideTitles = [],
}: PerspectiveTunnelGalleryProps) {
  const tunnelDialKit = useDialKit(TUNNEL_DIALKIT_NAME, {
    layout: {
      imageWidthFrac: [0.22, 0.08, 0.45],
      imageHeightFrac: [0.27, 0.1, 0.55],
      orbitRadiusXFrac: [0.42, 0.15, 0.85],
      orbitRadiusYFrac: [0.29, 0.1, 0.62],
      perspectiveFrac: [1.4, 0.75, 2.75],
      perspectiveMaxPx: [1400, 800, 2200],
    },
    spacing: {
      zGapPx: [2500, 600, 8000],
      exitDistancePx: [1500, 200, 5000],
      visibleRepeatsDepth: [3, 1, 10],
    },
    tunnelScroll: {
      wheelMultiplier: [2, 0.25, 10],
      touchMultiplier: [6, 1, 30],
      scrollEaseLerp: [0.07, 0.015, 0.35],
    },
    transitionEffects: {
      blurAlongFadeEnabled: false,
      blurOnEnterPx: [10, 0, 40],
      blurOnExitPx: [14, 0, 44],
    },
  })

  const tunnelDialKitRef = useRef(tunnelDialKit)

  useEffect(() => {
    tunnelDialKitRef.current = tunnelDialKit
  }, [tunnelDialKit])

  const viewportRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)
  const planeElementsRef = useRef<(HTMLDivElement | null)[]>([])
  const targetScrollRef = useRef(INITIAL_SCROLL)
  const currentScrollRef = useRef(INITIAL_SCROLL)
  const aspectBySlideKeyRef = useRef<Record<string, number>>({})

  const stableKeys = useMemo(() => {
    if (slideKeys.length === imageSrcs.length) return slideKeys
    return imageSrcs.map((_, i) => String(i))
  }, [imageSrcs, slideKeys])

  const planes = useMemo(
    () => buildPlanes(imageSrcs, stableKeys, tunnelDialKit.spacing.zGapPx),
    [imageSrcs, stableKeys, tunnelDialKit.spacing.zGapPx],
  )

  const tunnelMeta = useMemo(() => {
    const n = imageSrcs.length
    if (n === 0) return null
    const cycles = Math.max(6, Math.ceil(24 / n))
    const planeCount = n * cycles
    const layerGap = tunnelDialKit.spacing.zGapPx
    const tunnelDepth = planeCount * layerGap
    const visibleDepth = tunnelDialKit.spacing.visibleRepeatsDepth * layerGap
    return {planeCount, tunnelDepth, visibleDepth}
  }, [imageSrcs.length, tunnelDialKit.spacing.zGapPx, tunnelDialKit.spacing.visibleRepeatsDepth])

  const initialVisiblePlaneIndexes = useMemo(() => {
    if (!tunnelMeta) return new Set<number>()
    const exitPt = tunnelDialKit.spacing.exitDistancePx
    const visiblePlaneIndexes = new Set<number>()
    planes.forEach((plane, i) => {
      const baseZ = plane.baseZ
      let z = baseZ + INITIAL_SCROLL
      z = ((z % tunnelMeta.tunnelDepth) + tunnelMeta.tunnelDepth) % tunnelMeta.tunnelDepth
      z = z - tunnelMeta.tunnelDepth + exitPt
      const overlay = calculateOverlay(z, tunnelMeta.visibleDepth, exitPt)
      if (overlay < 1) visiblePlaneIndexes.add(i)
    })
    return visiblePlaneIndexes
  }, [planes, tunnelMeta, tunnelDialKit.spacing.exitDistancePx])

  const [geom, setGeom] = useState({
    itemW: 180,
    itemH: 220,
    rx: 400,
    ry: 280,
    perspective: 1000,
    vmin: 400,
  })

  const [slideAspectRatiosByKey, setSlideAspectRatiosByKey] = useState<Record<string, number>>({})

  const handleSlideImageLoad = useCallback((slideKey: string, img: HTMLImageElement) => {
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (nw <= 0 || nh <= 0) return
    const aspect = nw / nh
    if (aspectBySlideKeyRef.current[slideKey] === aspect) return
    aspectBySlideKeyRef.current[slideKey] = aspect
    setSlideAspectRatiosByKey((prev) => {
      if (prev[slideKey] === aspect) return prev
      return {...prev, [slideKey]: aspect}
    })
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const lay = tunnelDialKit.layout
    const measure = () => {
      const r = el.getBoundingClientRect()
      const vmin = Math.min(r.width, r.height)
      const next = {
        itemW: Math.max(120, vmin * lay.imageWidthFrac),
        itemH: Math.max(150, vmin * lay.imageHeightFrac),
        rx: vmin * lay.orbitRadiusXFrac,
        ry: vmin * lay.orbitRadiusYFrac,
        perspective: Math.min(lay.perspectiveMaxPx, Math.max(700, vmin * lay.perspectiveFrac)),
        vmin,
      }
      setGeom((prev) => {
        const near = (a: number, b: number) => Math.abs(a - b) < 0.5
        if (
          near(prev.itemW, next.itemW) &&
          near(prev.itemH, next.itemH) &&
          near(prev.rx, next.rx) &&
          near(prev.ry, next.ry) &&
          near(prev.perspective, next.perspective) &&
          near(prev.vmin, next.vmin)
        ) {
          return prev
        }
        return next
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [
    tunnelDialKit.layout.imageWidthFrac,
    tunnelDialKit.layout.imageHeightFrac,
    tunnelDialKit.layout.orbitRadiusXFrac,
    tunnelDialKit.layout.orbitRadiusYFrac,
    tunnelDialKit.layout.perspectiveFrac,
    tunnelDialKit.layout.perspectiveMaxPx,
  ])

  const firstImageIndex = imageSrcs.findIndex(hasCarouselImageSrc)

  useEffect(() => {
    const viewport = viewportRef.current
    const meta = tunnelMeta
    if (!viewport || !meta || planes.length === 0) return

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const {tunnelDepth, visibleDepth} = meta
    const hiddenPlaneCache = new Array<boolean | null>(planes.length).fill(null)
    const titles = imageSrcs.map((_, i) => {
      const t = slideTitles[i]
      return typeof t === 'string' ? t : ''
    })

    function updateCaption(slideIndex: number) {
      const cap = captionRef.current
      if (!cap) return
      const label = titles[slideIndex] ?? ''
      cap.textContent = label
      cap.toggleAttribute('aria-hidden', label.length === 0)
    }

    function applyPlanes(scroll: number) {
      const exitPt = tunnelDialKitRef.current.spacing.exitDistancePx
      const transition = tunnelDialKitRef.current.transitionEffects
      let bestZ = -Infinity
      let bestSlideIndex = 0
      planeElementsRef.current.forEach((planeEl, i) => {
        if (!planeEl || i >= planes.length) return
        const baseZ = planes[i].baseZ
        let z = baseZ + scroll
        z = ((z % tunnelDepth) + tunnelDepth) % tunnelDepth
        z = z - tunnelDepth + exitPt
        const overlay = calculateOverlay(z, visibleDepth, exitPt)
        const clipped = Math.min(1, Math.max(0, overlay))
        const blurPx = transitionImageBlurPx(
          z,
          clipped,
          exitPt,
          visibleDepth,
          transition.blurOnEnterPx,
          transition.blurOnExitPx,
          transition.blurAlongFadeEnabled,
        )

        if (overlay >= 1) {
          if (hiddenPlaneCache[i] !== true) {
            gsap.set(planeEl, {
              '--overlay': 1,
              '--plane-blur': '0px',
              'visibility': 'hidden',
            })
            hiddenPlaneCache[i] = true
          }
          return
        }
        hiddenPlaneCache[i] = false
        gsap.set(planeEl, {
          z,
          '--overlay': clipped,
          '--plane-blur': `${blurPx}px`,
          'visibility': overlay >= 1 ? 'hidden' : 'visible',
        })
        if (overlay < 1 && z > bestZ) {
          bestZ = z
          bestSlideIndex = planes[i].slideIndex
        }
      })
      updateCaption(bestZ === -Infinity ? Math.max(0, firstImageIndex) : bestSlideIndex)
    }

    targetScrollRef.current = INITIAL_SCROLL
    currentScrollRef.current = INITIAL_SCROLL

    const ro = new ResizeObserver(() => {
      applyPlanes(currentScrollRef.current)
    })
    ro.observe(viewport)

    if (prefersReduced) {
      applyPlanes(INITIAL_SCROLL)
      return () => {
        ro.disconnect()
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      targetScrollRef.current += e.deltaY * tunnelDialKitRef.current.tunnelScroll.wheelMultiplier
    }

    let lastTouchY = 0
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? lastTouchY
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (y === undefined) return
      const dy = lastTouchY - y
      lastTouchY = y
      e.preventDefault()
      e.stopPropagation()
      targetScrollRef.current += dy * tunnelDialKitRef.current.tunnelScroll.touchMultiplier
    }

    const tick = () => {
      const scrollLerp = tunnelDialKitRef.current.tunnelScroll.scrollEaseLerp
      currentScrollRef.current += (targetScrollRef.current - currentScrollRef.current) * scrollLerp
      applyPlanes(currentScrollRef.current)
    }

    gsap.ticker.add(tick)
    viewport.addEventListener('wheel', onWheel, {passive: false})
    viewport.addEventListener('touchstart', onTouchStart, {passive: true})
    viewport.addEventListener('touchmove', onTouchMove, {passive: false})

    applyPlanes(currentScrollRef.current)

    return () => {
      gsap.ticker.remove(tick)
      ro.disconnect()
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('touchstart', onTouchStart)
      viewport.removeEventListener('touchmove', onTouchMove)
    }
  }, [tunnelMeta, planes, imageSrcs, slideTitles, firstImageIndex])

  if (imageSrcs.length === 0) {
    return (
      <div
        ref={viewportRef}
        className="relative size-full overflow-hidden [transform-style:preserve-3d] touch-none bg-transparent"
        role="region"
        aria-label="Featured works"
      >
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-base text-[#111]">
          No images to display.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={viewportRef}
      className="relative size-full overflow-hidden [transform-style:preserve-3d] touch-none bg-transparent"
      role="region"
      aria-roledescription="Perspective tunnel gallery; scroll with wheel or drag on touch"
      tabIndex={0}
      style={{perspective: `${geom.perspective}px`}}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]">
        {planes.map((plane, pi) => {
          const src = imageSrcs[plane.slideIndex] ?? ''
          const href = slideHrefs[plane.slideIndex] ?? null
          const showImage = hasCarouselImageSrc(src)
          const isInitiallyVisiblePlane = initialVisiblePlaneIndexes.has(pi)
          const slideKey = stableKeys[plane.slideIndex] ?? String(plane.slideIndex)
          const fallbackAspect = geom.itemW / geom.itemH
          const aspect = slideAspectRatiosByKey[slideKey] ?? fallbackAspect
          const maxPlaneWidth = geom.vmin * 0.85
          const planeW = Math.min(geom.itemH * aspect, maxPlaneWidth)
          const cx = Math.cos(plane.angle) * geom.rx - planeW / 2
          const cy = Math.sin(plane.angle) * geom.ry - geom.itemH / 2
          const inner = (
            <>
              <div className="relative size-full [filter:blur(var(--plane-blur,0px))]">
                {showImage ? (
                  <Image
                    src={src}
                    alt={
                      (slideTitles[plane.slideIndex] ?? '').trim() ||
                      `Gery Georgieva, gallery image ${plane.slideIndex + 1}`
                    }
                    fill
                    className="object-contain"
                    sizes="(max-width: 1023px) min(90vw, 85vmin), min(85vw, 75vmin)"
                    loading={isInitiallyVisiblePlane ? 'eager' : 'lazy'}
                    onLoad={(event) => {
                      handleSlideImageLoad(slideKey, event.currentTarget)
                    }}
                  />
                ) : (
                  <div
                    className="size-full bg-neutral-200"
                    role="img"
                    aria-label={
                      (slideTitles[plane.slideIndex] ?? '').trim() ||
                      `Placeholder, no image for slide ${plane.slideIndex + 1}`
                    }
                  />
                )}
              </div>
              <div
                className="pointer-events-none absolute inset-0 bg-[var(--color-paper)] opacity-[var(--overlay,1)]"
                aria-hidden
              />
            </>
          )
          return (
            <div
              key={plane.key}
              ref={(el) => {
                planeElementsRef.current[pi] = el
              }}
              className="absolute [transform-style:preserve-3d]"
              style={{
                left: cx,
                top: cy,
                width: planeW,
                height: geom.itemH,
              }}
            >
              {href ? (
                <Link className="relative block size-full" href={href}>
                  {inner}
                </Link>
              ) : (
                <div className="relative block size-full">{inner}</div>
              )}
            </div>
          )
        })}
      </div>
      <p
        ref={captionRef}
        className="pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] right-[max(1.5rem,env(safe-area-inset-right,0px))] z-[2] max-w-[min(90vw,42rem)] text-right text-[clamp(0.875rem,2.5vmin,1.125rem)] leading-[1.35] text-[#111]"
        aria-live="polite"
      >
        {'\u00a0'}
      </p>
    </div>
  )
}
