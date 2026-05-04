'use client'

import {Debug} from '@/lib/depth-gallery/Debug'
import {Engine} from '@/lib/depth-gallery/Engine'
import {Experience} from '@/lib/depth-gallery/Experience'
import {formatDepthGalleryLinkTitle} from '@/lib/depth-gallery/Label'
import {buildDepthGalleryPlaneConfig} from '@/lib/depth-gallery/plane-config'
import type {CSSProperties} from 'react'
import Link from 'next/link'
import {useEffect, useMemo, useRef, useState} from 'react'

import type {HomepageCarouselSlide} from '@/sanity/lib/homepage-carousel'

import '@/app/components/feature/depth-gallery.css'

function gallerySlides(slides: readonly HomepageCarouselSlide[]): HomepageCarouselSlide[] {
	return slides.filter((s) => typeof s.imageUrl === 'string' && s.imageUrl.trim().length > 0)
}

export interface DepthGalleryCanvasProps {
	slides: readonly HomepageCarouselSlide[]
}

export function DepthGalleryCanvas({slides}: DepthGalleryCanvasProps) {
	const rootRef = useRef<HTMLDivElement>(null)
	const canvasHostRef = useRef<HTMLDivElement>(null)
	const [activePlaneIndex, setActivePlaneIndex] = useState(0)

	const slideList = useMemo(() => gallerySlides(slides), [slides])

	const planeConfig = useMemo(() => buildDepthGalleryPlaneConfig(slideList), [slideList])

	useEffect(() => {
		const host = canvasHostRef.current
		const root = rootRef.current
		if (!planeConfig.length || !host) return

		const canvas = document.createElement('canvas')
		canvas.className = 'depth-gallery-webgl'
		host.innerHTML = ''
		host.appendChild(canvas)

		const isDev = process.env.NODE_ENV === 'development'
		const debug = isDev ? new Debug() : null

		const experience = new Experience(planeConfig, {
			debug,
			labelMount: root,
			frameTextRoot: root ?? undefined,
		})

		const engine = new Engine(canvas, experience, {
			enableDebugInfrastructure: isDev,
			onActivePlaneIndexChange: setActivePlaneIndex,
		})

		void engine.init().catch((error) => {
			console.error('DepthGallery engine init failed', error)
		})

		return () => {
			engine.dispose()
			if (host.contains(canvas)) {
				host.removeChild(canvas)
			}
		}
	}, [planeConfig])

	const activeSlide =
		activePlaneIndex >= 0 && activePlaneIndex < slideList.length
			? slideList[activePlaneIndex]
			: slideList[0]

	const navHref =
		activeSlide && typeof activeSlide.href === 'string' && activeSlide.href.length > 0
			? activeSlide.href
			: null

	return (
		<div
			ref={rootRef}
			className="depth-gallery-root bg-paper"
			style={{'--depth-gallery-padding': '1.25rem'} as CSSProperties}
		>
			<div ref={canvasHostRef} className="pointer-events-none absolute inset-0" />
			{navHref !== null ? (
				<Link
					className="depth-gallery-hit-area"
					href={navHref}
					prefetch={false}
					aria-label={`Open ${formatDepthGalleryLinkTitle(activeSlide?.title ?? '')}`}
				/>
			) : null}
		</div>
	)
}
