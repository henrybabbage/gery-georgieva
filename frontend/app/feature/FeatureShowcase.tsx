'use client'

import Link from 'next/link'
import {useLenis} from 'lenis/react'
import {useEffect} from 'react'

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
	const rows = exhibitions ?? []

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
		<div className="h-[calc(100dvh-3rem)] overflow-hidden bg-[#fafaf8] text-[#111]">
			<div className="grid h-full min-h-0 grid-rows-[minmax(0,40vh)_minmax(0,1fr)] overflow-hidden lg:grid-cols-2 lg:grid-rows-1 lg:items-start lg:gap-6">
				<aside className="relative min-h-0 max-lg:border-b lg:h-[calc(100dvh-3rem)] lg:w-full">
					<div className="absolute inset-4 md:inset-6">
						<OrbitalImageGallery imageSrcs={imageSrcs} />
					</div>
				</aside>

				<div
					className="min-h-0 overflow-hidden px-5 py-6 lg:sticky lg:top-0 lg:flex lg:h-[calc(100dvh-3rem)] lg:min-h-0 lg:w-full lg:flex-col lg:self-start lg:overflow-hidden lg:px-5 lg:py-14"
					aria-label="Exhibitions list"
				>
					<div
						className="font-maxisud grid w-full min-w-0 gap-x-3 gap-y-1.5 text-[10px] leading-snug tracking-[0.02em] text-black/85 sm:text-[11px] lg:flex-1 lg:overflow-hidden"
						style={{
							gridTemplateColumns:
								'minmax(0,1.2fr) minmax(0,1fr) minmax(2.5rem,1fr)',
							alignContent: 'start',
						}}
					>
						{rows.map((row) => {
							const year =
								row.year !== undefined &&
								row.year !== null &&
								Number.isFinite(row.year)
									? String(row.year)
									: '—'
							const venueCell =
								[row.venue, row.location]
									.filter(Boolean)
									.join(', ') ||
								'—'
							return (
								<div key={row._id} className="contents">
									<div className="min-w-0 break-words">
										{row.slug ? (
											<Link
												href={`/exhibition/${row.slug}`}
												className="underline-offset-2 hover:underline"
											>
												{row.title ?? 'Untitled'}
											</Link>
										) : (
											row.title ?? 'Untitled'
										)}
									</div>
									<div className="min-w-0 break-words text-black/55">
										{venueCell}
									</div>
									<div className="w-full min-w-0 text-right whitespace-nowrap tabular-nums text-black/40">
										{year}
									</div>
								</div>
							)
						})}
					</div>
					{rows.length === 0 && (
						<p className="font-maxisud text-xs text-black/45">
							No exhibitions in Sanity yet.
						</p>
					)}
				</div>
			</div>
		</div>
	)
}
