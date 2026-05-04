'use client'

import {DepthGalleryCanvas} from '@/app/components/feature/DepthGalleryCanvas'
import {useLenis} from 'lenis/react'
import {useEffect, useMemo} from 'react'

import type {HomepageCarouselSlide} from '@/sanity/lib/homepage-carousel'

export interface FeatureShowcaseProps {
	slides: readonly HomepageCarouselSlide[]
}

export default function FeatureShowcase({slides}: FeatureShowcaseProps) {
	const lenis = useLenis()

	const hasGalleryImages = useMemo(
		() =>
			slides.some((s) => typeof s.imageUrl === 'string' && s.imageUrl.trim().length > 0),
		[slides],
	)

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
					{hasGalleryImages ? (
						<DepthGalleryCanvas slides={slides} />
					) : (
						<div className="flex h-full items-center justify-center px-8 text-center text-lg text-[var(--color-ink)]/60">
							No carousel items to display.
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
