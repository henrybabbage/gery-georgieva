'use client'

import {useLenis} from 'lenis/react'
import {useEffect, useMemo} from 'react'

import OrbitalImageGallery from '@/app/components/feature/OrbitalImageGallery'

export interface FeatureExhibitionRow {
	_id: string
	title: string | null
	slug: string | null
	year?: number | null
	venue?: string | null
	location?: string | null
}

export interface FeatureShowcaseProps {
	imageSrcs: readonly string[]
	exhibitions: FeatureExhibitionRow[] | null | undefined
}

export default function FeatureShowcase ({
	imageSrcs,
	exhibitions,
}: FeatureShowcaseProps) {
	const lenis = useLenis()

	const slideTitles = useMemo(
		() =>
			imageSrcs.map((_, i) => {
				const list = exhibitions ?? []
				const raw = list[i]?.title
				return typeof raw === 'string' ? raw.trim() : ''
			}),
		[imageSrcs, exhibitions],
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
		<div className="fixed inset-0 z-0 overflow-hidden bg-paper text-[#111]">
			<div className="relative h-full min-h-0">
				<div className="absolute inset-0">
					<OrbitalImageGallery
						imageSrcs={imageSrcs}
						slideTitles={slideTitles}
					/>
				</div>
			</div>
		</div>
	)
}
