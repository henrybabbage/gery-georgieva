'use client'

import {gsap} from '@/lib/gsap'
import Image from 'next/image'
import Link from 'next/link'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

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

interface TunnelPlane {
	key: string
	planeIndex: number
	slideIndex: number
	angle: number
	baseZ: number
}

function buildPlanes (
	imageSrcs: readonly string[],
	stableKeys: readonly string[],
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
			baseZ: -i * LAYER_GAP,
		})
	}
	return planes
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
	const planeElementsRef = useRef<(HTMLDivElement | null)[]>([])
	const targetScrollRef = useRef(INITIAL_SCROLL)
	const currentScrollRef = useRef(INITIAL_SCROLL)
	const aspectBySlideKeyRef = useRef<Record<string, number>>({})

	const stableKeys = useMemo(() => {
		if (slideKeys.length === imageSrcs.length) return slideKeys
		return imageSrcs.map((_, i) => String(i))
	}, [imageSrcs, slideKeys])

	const planes = useMemo(
		() => buildPlanes(imageSrcs, stableKeys),
		[imageSrcs, stableKeys],
	)

	const tunnelMeta = useMemo(() => {
		const n = imageSrcs.length
		if (n === 0) return null
		const cycles = Math.max(6, Math.ceil(24 / n))
		const planeCount = n * cycles
		const tunnelDepth = planeCount * LAYER_GAP
		const visibleDepth = VISIBLE_DEPTH_MULT * LAYER_GAP
		return {slideCount: n, planeCount, tunnelDepth, visibleDepth}
	}, [imageSrcs.length])

	const initialVisiblePlaneIndexes = useMemo(() => {
		if (!tunnelMeta) return new Set<number>()
		const visiblePlaneIndexes = new Set<number>()
		planes.forEach((_, i) => {
			const baseZ = -i * LAYER_GAP
			let z = baseZ + INITIAL_SCROLL
			z = ((z % tunnelMeta.tunnelDepth) + tunnelMeta.tunnelDepth) %
				tunnelMeta.tunnelDepth
			z = z - tunnelMeta.tunnelDepth + EXIT_POINT
			const overlay = calculateOverlay(
				z,
				tunnelMeta.visibleDepth,
				EXIT_POINT,
			)
			if (overlay < 1) visiblePlaneIndexes.add(i)
		})
		return visiblePlaneIndexes
	}, [planes, tunnelMeta])

	const [geom, setGeom] = useState({
		itemW: 180,
		itemH: 220,
		rx: 400,
		ry: 280,
		perspective: 1000,
		vmin: 400,
	})

	const [slideAspectRatiosByKey, setSlideAspectRatiosByKey] = useState<
		Record<string, number>
	>({})

	const handleSlideImageLoad = useCallback(
		(slideKey: string, img: HTMLImageElement) => {
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
		},
		[],
	)

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
				vmin,
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
		if (!viewport || !meta || planes.length === 0) return

		const prefersReduced =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches

		const {tunnelDepth, visibleDepth, slideCount} = meta
		const hiddenPlaneCache = new Array<boolean | null>(
			planes.length,
		).fill(null)
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

		function applyPlanes (scroll: number) {
			let bestZ = -Infinity
			let bestSlideIndex = 0
			planeElementsRef.current.forEach((planeEl, i) => {
				if (!planeEl || i >= planes.length) return
				const baseZ = -i * LAYER_GAP
				let z = baseZ + scroll
				z = ((z % tunnelDepth) + tunnelDepth) % tunnelDepth
				z = z - tunnelDepth + EXIT_POINT
				const overlay = calculateOverlay(z, visibleDepth, EXIT_POINT)
				if (overlay >= 1) {
					if (hiddenPlaneCache[i] !== true) {
						gsap.set(planeEl, {
							'--overlay': 1,
							visibility: 'hidden',
						})
						hiddenPlaneCache[i] = true
					}
					return
				}
				hiddenPlaneCache[i] = false
				gsap.set(planeEl, {
					z,
					'--overlay': Math.min(1, Math.max(0, overlay)),
					visibility: overlay >= 1 ? 'hidden' : 'visible',
				})
				if (overlay < 1 && z > bestZ) {
					bestZ = z
					bestSlideIndex = i % slideCount
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
	}, [
		tunnelMeta,
		planes,
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
				{planes.map((plane, pi) => {
					const src = imageSrcs[plane.slideIndex] ?? ''
					const href = slideHrefs[plane.slideIndex] ?? null
					const showImage = hasCarouselImageSrc(src)
					const isInitiallyVisiblePlane =
						initialVisiblePlaneIndexes.has(pi)
					const slideKey =
						stableKeys[plane.slideIndex] ?? String(plane.slideIndex)
					const fallbackAspect = geom.itemW / geom.itemH
					const aspect =
						slideAspectRatiosByKey[slideKey] ?? fallbackAspect
					const maxPlaneWidth = geom.vmin * 0.85
					const planeW = Math.min(geom.itemH * aspect, maxPlaneWidth)
					const cx =
						Math.cos(plane.angle) * geom.rx - planeW / 2
					const cy =
						Math.sin(plane.angle) * geom.ry - geom.itemH / 2
					const inner = (
						<>
							{showImage ? (
								<Image
									src={src}
									alt={
										(
											slideTitles[plane.slideIndex] ?? ''
										).trim() ||
										`Gery Georgieva, gallery image ${plane.slideIndex + 1}`
									}
									fill
									className="object-contain"
									sizes="(max-width: 1023px) min(90vw, 85vmin), min(85vw, 75vmin)"
									loading={
										isInitiallyVisiblePlane
											? 'eager'
											: 'lazy'
									}
									onLoad={(event) => {
										handleSlideImageLoad(
											slideKey,
											event.currentTarget,
										)
									}}
								/>
							) : (
								<div
									className="size-full bg-neutral-200"
									role="img"
									aria-label={
										(
											slideTitles[plane.slideIndex] ?? ''
										).trim() ||
										`Placeholder, no image for slide ${plane.slideIndex + 1}`
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
							key={plane.key}
							ref={(el) => {
								planeElementsRef.current[pi] = el
							}}
							className={styles.plane}
							style={{
								left: cx,
								top: cy,
								width: planeW,
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
