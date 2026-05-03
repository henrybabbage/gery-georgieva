'use client'

import {gsap} from '@/lib/gsap'
import Image from 'next/image'
import Link from 'next/link'
import {useEffect, useMemo, useRef, useState} from 'react'

import styles from './perspective-tunnel-gallery.module.css'

const SCROLL_SPEED = 2
const LAYER_GAP = 2500
const LERP = 0.07
const EXIT_POINT = 1500
const INITIAL_SCROLL = 750
const VISIBLE_DEPTH_MULT = 3

function hasCarouselImageSrc (src: string): boolean {
	return typeof src === 'string' && src.trim().length > 0
}

function calculateOverlay (
	z: number,
	visibleDepth: number,
	exitPoint: number,
): number {
	if (z > exitPoint) return 1
	if (z > 0) return z / exitPoint
	if (z > -visibleDepth) {
		const progress = Math.abs(z) / visibleDepth
		return progress * progress
	}
	return 1
}

interface TunnelItem {
	key: string
	slideIndex: number
	slotIndex: number
	angle: number
}

interface TunnelLayer {
	key: string
	layerIndex: number
	baseZ: number
	items: TunnelItem[]
}

function buildLayers (
	imageSrcs: readonly string[],
	stableKeys: readonly string[],
): TunnelLayer[] {
	const totalImages = imageSrcs.length
	if (totalImages === 0) return []
	const contentLayerCount = Math.ceil(totalImages / 4)
	const totalLayerCount = Math.max(contentLayerCount, 6)
	const layers: TunnelLayer[] = []
	for (let i = 0; i < totalLayerCount; i++) {
		const imageStartIndex = (i % contentLayerCount) * 4
		const items: TunnelItem[] = []
		for (let j = 0; j < 4; j++) {
			const slideIndex = imageStartIndex + j
			if (slideIndex >= totalImages) break
			const angle = (j / 4) * Math.PI * 2 - Math.PI / 2
			items.push({
				key: `L${i}-${stableKeys[slideIndex] ?? String(slideIndex)}`,
				slideIndex,
				slotIndex: j,
				angle,
			})
		}
		layers.push({
			key: `layer-${i}`,
			layerIndex: i,
			baseZ: -i * LAYER_GAP,
			items,
		})
	}
	return layers
}

const EMPTY_SLIDE_KEYS: readonly string[] = []

export interface PerspectiveTunnelGalleryProps {
	imageSrcs: readonly string[]
	slideKeys?: readonly string[]
	slideHrefs?: readonly (string | null)[]
	slideTitles?: readonly string[]
}

const WHEEL_MULT = SCROLL_SPEED
const TOUCH_SCROLL_MULT = 6

export default function PerspectiveTunnelGallery ({
	imageSrcs,
	slideKeys = EMPTY_SLIDE_KEYS,
	slideHrefs = [],
	slideTitles = [],
}: PerspectiveTunnelGalleryProps) {
	const viewportRef = useRef<HTMLDivElement>(null)
	const captionRef = useRef<HTMLParagraphElement>(null)
	const layerElementsRef = useRef<(HTMLDivElement | null)[]>([])
	const targetScrollRef = useRef(INITIAL_SCROLL)
	const currentScrollRef = useRef(INITIAL_SCROLL)

	const stableKeys = useMemo(() => {
		if (slideKeys.length === imageSrcs.length) return slideKeys
		return imageSrcs.map((_, i) => String(i))
	}, [imageSrcs, slideKeys])

	const layers = useMemo(
		() => buildLayers(imageSrcs, stableKeys),
		[imageSrcs, stableKeys],
	)

	const tunnelMeta = useMemo(() => {
		const n = imageSrcs.length
		if (n === 0) return null
		const contentLayerCount = Math.ceil(n / 4)
		const totalLayerCount = Math.max(contentLayerCount, 6)
		const tunnelDepth = totalLayerCount * LAYER_GAP
		const visibleDepth = VISIBLE_DEPTH_MULT * LAYER_GAP
		return {contentLayerCount, totalLayerCount, tunnelDepth, visibleDepth}
	}, [imageSrcs.length])

	const [geom, setGeom] = useState({
		itemW: 180,
		itemH: 220,
		rx: 400,
		ry: 280,
		perspective: 1000,
	})

	useEffect(() => {
		const el = viewportRef.current
		if (!el) return
		const measure = () => {
			const r = el.getBoundingClientRect()
			const vmin = Math.min(r.width, r.height)
			setGeom({
				itemW: Math.max(120, vmin * 0.22),
				itemH: Math.max(150, vmin * 0.27),
				rx: vmin * 0.42,
				ry: vmin * 0.29,
				perspective: Math.min(1400, Math.max(700, vmin * 1.4)),
			})
		}
		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [])

	const firstImageIndex = imageSrcs.findIndex(hasCarouselImageSrc)

	useEffect(() => {
		const viewport = viewportRef.current
		const meta = tunnelMeta
		if (!viewport || !meta || layers.length === 0) return

		const prefersReduced =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches

		const {contentLayerCount, tunnelDepth, visibleDepth} = meta
		const titles = imageSrcs.map((_, i) => {
			const t = slideTitles[i]
			return typeof t === 'string' ? t : ''
		})

		function updateCaption (slideIndex: number) {
			const cap = captionRef.current
			if (!cap) return
			const label = titles[slideIndex] ?? ''
			cap.textContent = label
			cap.toggleAttribute('aria-hidden', label.length === 0)
		}

		function applyLayers (scroll: number) {
			let bestZ = -Infinity
			let bestSlideIndex = 0
			layerElementsRef.current.forEach((layerEl, i) => {
				if (!layerEl) return
				const baseZ = -i * LAYER_GAP
				let z = baseZ + scroll
				z = ((z % tunnelDepth) + tunnelDepth) % tunnelDepth
				z = z - tunnelDepth + EXIT_POINT
				const overlay = calculateOverlay(z, visibleDepth, EXIT_POINT)
				gsap.set(layerEl, {
					z,
					'--overlay': Math.min(1, Math.max(0, overlay)),
					visibility: overlay >= 1 ? 'hidden' : 'visible',
				})
				if (overlay < 1 && z > bestZ) {
					bestZ = z
					bestSlideIndex = (i % contentLayerCount) * 4
				}
			})
			updateCaption(
				bestZ === -Infinity
					? Math.max(0, firstImageIndex)
					: bestSlideIndex,
			)
		}

		targetScrollRef.current = INITIAL_SCROLL
		currentScrollRef.current = INITIAL_SCROLL

		const ro = new ResizeObserver(() => {
			applyLayers(currentScrollRef.current)
		})
		ro.observe(viewport)

		if (prefersReduced) {
			applyLayers(INITIAL_SCROLL)
			return () => {
				ro.disconnect()
			}
		}

		const onWheel = (e: WheelEvent) => {
			e.preventDefault()
			e.stopPropagation()
			targetScrollRef.current += e.deltaY * WHEEL_MULT
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
			targetScrollRef.current += dy * TOUCH_SCROLL_MULT
		}

		const tick = () => {
			currentScrollRef.current +=
				(targetScrollRef.current - currentScrollRef.current) * LERP
			applyLayers(currentScrollRef.current)
		}

		gsap.ticker.add(tick)
		viewport.addEventListener('wheel', onWheel, {passive: false})
		viewport.addEventListener('touchstart', onTouchStart, {passive: true})
		viewport.addEventListener('touchmove', onTouchMove, {passive: false})

		applyLayers(currentScrollRef.current)

		return () => {
			gsap.ticker.remove(tick)
			ro.disconnect()
			viewport.removeEventListener('wheel', onWheel)
			viewport.removeEventListener('touchstart', onTouchStart)
			viewport.removeEventListener('touchmove', onTouchMove)
		}
	}, [
		tunnelMeta,
		layers.length,
		imageSrcs,
		slideTitles,
		firstImageIndex,
	])

	if (imageSrcs.length === 0) {
		return (
			<div
				ref={viewportRef}
				className={`${styles.spotlight} touch-none bg-transparent`}
				role="region"
				aria-label="Featured works"
			>
				<p className={styles.empty}>No images to display.</p>
			</div>
		)
	}

	return (
		<div
			ref={viewportRef}
			className={`${styles.spotlight} touch-none bg-transparent`}
			role="region"
			aria-roledescription="Perspective tunnel gallery; scroll with wheel or drag on touch"
			tabIndex={0}
			style={{perspective: `${geom.perspective}px`}}
		>
			<div className={styles.tunnel}>
				{layers.map((layer, li) => (
					<div
						key={layer.key}
						ref={(el) => {
							layerElementsRef.current[li] = el
						}}
						className={styles.layer}
					>
						{layer.items.map((item) => {
							const src = imageSrcs[item.slideIndex] ?? ''
							const href = slideHrefs[item.slideIndex] ?? null
							const showImage = hasCarouselImageSrc(src)
							const cx =
								Math.cos(item.angle) * geom.rx - geom.itemW / 2
							const cy =
								Math.sin(item.angle) * geom.ry - geom.itemH / 2
							const inner = (
								<>
									{showImage ? (
										<Image
											src={src}
											alt={
												(
													slideTitles[item.slideIndex] ?? ''
												).trim() ||
												`Gery Georgieva, gallery image ${item.slideIndex + 1}`
											}
											fill
											className="object-cover"
											sizes="(max-width: 1023px) 28vmin, 22vmin"
											priority={firstImageIndex === item.slideIndex}
										/>
									) : (
										<div
											className="size-full bg-neutral-200"
											role="img"
											aria-label={
												(
													slideTitles[item.slideIndex] ?? ''
												).trim() ||
												`Placeholder, no image for slide ${item.slideIndex + 1}`
											}
										/>
									)}
									<div
										className={styles.itemOverlay}
										aria-hidden
									/>
								</>
							)
							return (
								<div
									key={item.key}
									className={styles.item}
									style={{
										left: cx,
										top: cy,
										width: geom.itemW,
										height: geom.itemH,
									}}
								>
									{href ? (
										<Link
											className={styles.itemLink}
											href={href}
										>
											{inner}
										</Link>
									) : (
										<div className={styles.itemLink}>{inner}</div>
									)}
								</div>
							)
						})}
					</div>
				))}
			</div>
			<p
				ref={captionRef}
				className={styles.activeTitle}
				aria-live="polite"
			>
				{'\u00a0'}
			</p>
		</div>
	)
}
