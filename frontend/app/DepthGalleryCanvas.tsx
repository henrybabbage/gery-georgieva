'use client'

import {Debug} from '@/lib/depth-gallery/Debug'
import {Engine} from '@/lib/depth-gallery/Engine'
import {Experience} from '@/lib/depth-gallery/Experience'
import {formatDepthGalleryLinkTitle} from '@/lib/depth-gallery/Label'
import {buildDepthGalleryPlaneConfig} from '@/lib/depth-gallery/PlaneConfig'
import {SANITY_IMAGE_PALETTE_MOOD_FOR_HOMEPAGE_DEPTH_GALLERY} from '@/lib/depth-gallery/HomepageBackgroundMood'
import type {CSSProperties} from 'react'
import Link from 'next/link'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import type {HomepageCarouselSlide} from '@/sanity/lib/HomepageCarousel'

const HOME_DEPTH_GALLERY_SCROLL_KEY = 'gery:home-depth-gallery-scroll'

function writeHomeDepthGalleryScroll(position: number): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(HOME_DEPTH_GALLERY_SCROLL_KEY, String(position))
  } catch {
    // ignore quota / private mode
  }
}

function gallerySlides(slides: readonly HomepageCarouselSlide[]): HomepageCarouselSlide[] {
  return slides.filter((s) => typeof s.imageUrl === 'string' && s.imageUrl.trim().length > 0)
}

export interface DepthGalleryCanvasProps {
  slides: readonly HomepageCarouselSlide[]
}

export function DepthGalleryCanvas({slides}: DepthGalleryCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const [activePlaneIndex, setActivePlaneIndex] = useState(0)

  const slideList = useMemo(() => gallerySlides(slides), [slides])

  const planeConfig = useMemo(() => buildDepthGalleryPlaneConfig(slideList), [slideList])

  useEffect(() => {
    const host = canvasHostRef.current
    const root = rootRef.current
    if (!planeConfig.length || !host) return

    let initialScroll: number | undefined
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(HOME_DEPTH_GALLERY_SCROLL_KEY)
        if (raw !== null) {
          const parsed = Number(raw)
          if (Number.isFinite(parsed)) initialScroll = parsed
        }
      } catch {
        // ignore
      }
    }

    const canvas = document.createElement('canvas')
    canvas.className = 'depth-gallery-webgl'
    host.innerHTML = ''
    host.appendChild(canvas)

    const isDev = process.env.NODE_ENV === 'development'
    const debug = isDev ? new Debug() : null

    const experience = new Experience(planeConfig, {
      debug,
      labelMount: root,
    })

    const engine = new Engine(canvas, experience, {
      enableDebugInfrastructure: isDev,
      onActivePlaneIndexChange: setActivePlaneIndex,
      scrollEventRoot: rootRef.current,
      ...(initialScroll !== undefined ? {initialScrollPosition: initialScroll} : {}),
    })
    engineRef.current = engine

    void engine.init().catch((error) => {
      console.error('DepthGallery engine init failed', error)
    })

    return () => {
      if (engine.isInitialized) {
        writeHomeDepthGalleryScroll(engine.scroll.getScrollPosition())
      }
      engine.dispose()
      engineRef.current = null
      if (host.contains(canvas)) {
        host.removeChild(canvas)
      }
    }
  }, [planeConfig])

  const handleGalleryLinkClick = useCallback(() => {
    const eng = engineRef.current
    if (!eng?.isInitialized) return
    writeHomeDepthGalleryScroll(eng.scroll.getScrollPosition())
  }, [])

  const activeSlide =
    activePlaneIndex >= 0 && activePlaneIndex < slideList.length
      ? slideList[activePlaneIndex]
      : slideList[0]

  const navHref =
    activeSlide && typeof activeSlide.href === 'string' && activeSlide.href.length > 0
      ? activeSlide.href
      : null

  const rootBackdropClass = SANITY_IMAGE_PALETTE_MOOD_FOR_HOMEPAGE_DEPTH_GALLERY
    ? 'bg-paper'
    : 'bg-white'

  return (
    <div
      ref={rootRef}
      className={`depth-gallery-root ${rootBackdropClass}`}
      style={{'--depth-gallery-padding': '1.25rem'} as CSSProperties}
    >
      <div ref={canvasHostRef} className="pointer-events-none absolute inset-0" />
      {navHref !== null ? (
        <Link
          className="depth-gallery-hit-area"
          href={navHref}
          prefetch={false}
          onClick={handleGalleryLinkClick}
          aria-label={`Open ${formatDepthGalleryLinkTitle(activeSlide?.title ?? '')}`}
        />
      ) : null}
    </div>
  )
}
