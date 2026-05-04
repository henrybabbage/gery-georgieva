'use client'

import {useLenis} from 'lenis/react'
import {useEffect, useMemo} from 'react'

import PerspectiveTunnelGallery from '@/app/components/feature/PerspectiveTunnelGallery'
import type {HomepageCarouselSlide} from '@/sanity/lib/homepage-carousel'

export interface FeatureShowcaseProps {
  slides: readonly HomepageCarouselSlide[]
}

export default function FeatureShowcase({slides}: FeatureShowcaseProps) {
  const lenis = useLenis()

  const imageSrcs = useMemo(() => slides.map((s) => s.imageUrl) as readonly string[], [slides])

  const slideTitles = useMemo(() => slides.map((s) => s.title), [slides])

  const slideHrefs = useMemo(() => slides.map((s) => s.href), [slides])

  const slideKeys = useMemo(() => slides.map((s) => s.key) as readonly string[], [slides])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevOverscroll = html.style.overscrollBehavior

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'

    lenis?.stop()

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      html.style.overscrollBehavior = prevOverscroll
      lenis?.start()
    }
  }, [lenis])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-paper text-[var(--color-ink)]">
      <div className="relative h-full min-h-0">
        <div className="absolute inset-0">
          <PerspectiveTunnelGallery
            imageSrcs={imageSrcs}
            slideKeys={slideKeys}
            slideHrefs={slideHrefs}
            slideTitles={slideTitles}
          />
        </div>
      </div>
    </div>
  )
}
