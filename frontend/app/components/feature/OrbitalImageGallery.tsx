'use client'

import {gsap} from '@/lib/gsap'
import Image from 'next/image'
import Link from 'next/link'
import {useEffect, useRef} from 'react'

import styles from './orbital-image-gallery.module.css'

const TAU = Math.PI * 2

function hasCarouselImageSrc (src: string): boolean {
	return typeof src === 'string' && src.trim().length > 0
}

/** radians per px of vertical wheel delta (lower = slower orbit) */
const WHEEL_RAD_PER_PX = 0.001
/** Same feel for drag on touch screens */
const TOUCH_RAD_PER_PX = 0.00235
/** Exponential smoothing rate (rad/s scale; higher = snappier) */
const PHASE_SMOOTHING = 6.5
/** Stop rAF when |target − display| is below this (radians) */
const PHASE_EPS = 5e-5
/** Cap dt when tab was backgrounded — avoids single-frame leaps */
const PHASE_MAX_DT = 48 / 1000
/** Orbit radius as fraction of min(viewport w, h); higher = more space between slides */
const ORBIT_RADIUS_RATIO = 0.92
/** Max lateral offset from centre (±fraction of min(viewport w, h)); per-slide amount from hash */
const HORIZONTAL_STAGGER_RATIO = 0.1

/** Stable −1 … 1 from a string — same slide keeps the same lateral offset across resizes */
function stableHorizontalNorm (seed: string): number {
	let h = 5381
	for (let i = 0; i < seed.length; i++) {
		h = ((h << 5) + h) ^ seed.charCodeAt(i)
	}
	const u = ((h >>> 0) % 65_001) / 65_000
	return u * 2 - 1
}

const EMPTY_SLIDE_KEYS: readonly string[] = []

export interface OrbitalImageGalleryProps {
	imageSrcs: readonly string[]
	/** Stable React keys per slide; defaults to `imageSrcs` entries. */
	slideKeys?: readonly string[]
	/** Per-slide exhibition URLs; same order and length as `imageSrcs`. */
	slideHrefs?: readonly (string | null)[]
	/** Exhibition (or slide) titles; same order and length as `imageSrcs`. */
	slideTitles?: readonly string[]
}

export default function OrbitalImageGallery ({
	imageSrcs,
	slideKeys = EMPTY_SLIDE_KEYS,
	slideHrefs = [],
	slideTitles = [],
}: OrbitalImageGalleryProps) {
	const viewportRef = useRef<HTMLDivElement>(null)
	const captionRef = useRef<HTMLParagraphElement>(null)

	useEffect(() => {
		const viewport = viewportRef.current
		const n = imageSrcs.length
		if (!viewport || n === 0) return

		const viewportEl = viewport
		const titles = imageSrcs.map((_, i) => {
			const t = slideTitles[i]
			return typeof t === 'string' ? t : ''
		})

		const prefersReduced =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)')
				.matches

		let lastTouchY = 0

		function radiusPx () {
			const r = viewportEl.getBoundingClientRect()
			return Math.min(r.width, r.height) * ORBIT_RADIUS_RATIO
		}

		function horizontalSpanPx () {
			const r = viewportEl.getBoundingClientRect()
			return Math.min(r.width, r.height) * HORIZONTAL_STAGGER_RATIO
		}

		const lateralNormByIndex = imageSrcs.map((src, i) =>
			stableHorizontalNorm(slideKeys[i] ?? src ?? String(i)),
		)

		function updateCenterTitle (frontIndex: number) {
			const cap = captionRef.current
			if (!cap) return
			const label = titles[frontIndex] ?? ''
			cap.textContent = label
			cap.toggleAttribute('aria-hidden', label.length === 0)
		}

		function applyPhase (phase: number) {
			const items = viewportEl.querySelectorAll<HTMLElement>(
				'[data-orbit-item="true"]',
			)
			const R = radiusPx()
			let frontIndex = 0
			let bestCz = -Infinity
			const span = horizontalSpanPx()
			items.forEach((el, i) => {
				const theta = phase + (TAU * i) / n
				const cz = Math.cos(theta)
				if (cz > bestCz) {
					bestCz = cz
					frontIndex = i
				}
				const y = Math.sin(theta) * R
				const z = Math.cos(theta) * R
				const x = lateralNormByIndex[i] * span
				gsap.set(el, {
					xPercent: -50,
					yPercent: -50,
					x,
					y,
					z,
					force3D: true,
					zIndex: Math.round(100 + cz * 50),
					opacity: 0.22 + 0.78 * Math.max(0, cz),
				})
			})
			updateCenterTitle(frontIndex)
		}

		function layStaticSpread () {
			const items = viewportEl.querySelectorAll<HTMLElement>(
				'[data-orbit-item="true"]',
			)
			const R = radiusPx()
			let frontIndex = 0
			let bestCz = -Infinity
			const span = horizontalSpanPx()
			items.forEach((el, i) => {
				const theta = (TAU * i) / n
				const cz = Math.cos(theta)
				if (cz > bestCz) {
					bestCz = cz
					frontIndex = i
				}
				const y = Math.sin(theta) * R
				const z = Math.cos(theta) * R
				const x = lateralNormByIndex[i] * span
				gsap.set(el, {
					xPercent: -50,
					yPercent: -50,
					x,
					y,
					z,
					force3D: true,
					zIndex: Math.round(100 + cz * 40),
					opacity: 0.35 + 0.65 * Math.max(0, cz),
				})
			})
			updateCenterTitle(frontIndex)
		}

		if (prefersReduced) {
			layStaticSpread()
			const ro = new ResizeObserver(() => {
				layStaticSpread()
			})
			ro.observe(viewportEl)
			return () => ro.disconnect()
		}

		let phaseTarget = 0
		let phaseDisplay = 0
		let rafId = 0
		let lastTs = performance.now()

		function kickPhaseLoop () {
			if (rafId !== 0) return
			lastTs = performance.now()
			rafId = requestAnimationFrame(tickPhase)
		}

		function tickPhase (ts: number) {
			const dt = Math.min((ts - lastTs) / 1000, PHASE_MAX_DT)
			lastTs = ts

			let diff = phaseTarget - phaseDisplay
			if (Math.abs(diff) <= PHASE_EPS) {
				phaseDisplay = phaseTarget
				applyPhase(phaseDisplay)
				rafId = 0
				return
			}

			const alpha = 1 - Math.exp(-PHASE_SMOOTHING * dt)
			phaseDisplay += diff * alpha
			diff = phaseTarget - phaseDisplay
			if (Math.abs(diff) <= PHASE_EPS) {
				phaseDisplay = phaseTarget
			}
			applyPhase(phaseDisplay)
			rafId = requestAnimationFrame(tickPhase)
		}

		const onWheel = (e: WheelEvent) => {
			e.preventDefault()
			e.stopPropagation()
			phaseTarget += e.deltaY * WHEEL_RAD_PER_PX
			kickPhaseLoop()
		}

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
			phaseTarget += dy * TOUCH_RAD_PER_PX
			kickPhaseLoop()
		}

		const onVisibility = () => {
			if (document.visibilityState !== 'hidden') return
			if (rafId !== 0) {
				cancelAnimationFrame(rafId)
				rafId = 0
			}
			phaseDisplay = phaseTarget
			applyPhase(phaseDisplay)
			lastTs = performance.now()
		}

		viewportEl.addEventListener('wheel', onWheel, {passive: false})
		viewportEl.addEventListener('touchstart', onTouchStart, {passive: true})
		viewportEl.addEventListener('touchmove', onTouchMove, {passive: false})
		document.addEventListener('visibilitychange', onVisibility)

		applyPhase(phaseDisplay)

		const observer = new ResizeObserver(() => {
			applyPhase(phaseDisplay)
		})
		observer.observe(viewportEl)

		return () => {
			if (rafId !== 0) cancelAnimationFrame(rafId)
			document.removeEventListener('visibilitychange', onVisibility)
			viewportEl.removeEventListener('wheel', onWheel)
			viewportEl.removeEventListener('touchstart', onTouchStart)
			viewportEl.removeEventListener('touchmove', onTouchMove)
			observer.disconnect()
		}
	}, [imageSrcs, slideKeys, slideTitles])

	const firstImageIndex = imageSrcs.findIndex(hasCarouselImageSrc)

	return (
		<div
			ref={viewportRef}
			className={`${styles.viewport} touch-none bg-transparent`}
			role="region"
			aria-roledescription="Orbital carousel; scroll with wheel or drag on touch"
			tabIndex={0}
		>
			<div className={styles.stage}>
				{imageSrcs.map((src, index) => {
					const href = slideHrefs[index] ?? null
					const slideKey = slideKeys[index] ?? src
					const showImage = hasCarouselImageSrc(src)
					const inner = (
						<div className={styles.orbitInner}>
							{showImage ? (
								<Image
									src={src}
									alt={
										(slideTitles[index] ?? '').trim() ||
										`Gery Georgieva, gallery image ${index + 1}`
									}
									fill
									className="object-contain"
									sizes="(max-width: 1023px) min(72vw, 48vh), min(42vw, 52vh)"
									priority={firstImageIndex === index}
								/>
							) : (
								<div
									className={styles.orbitPlaceholder}
									role="img"
									aria-label={
										(slideTitles[index] ?? '').trim() ||
										`Placeholder, no image for slide ${index + 1}`
									}
								/>
							)}
						</div>
					)
					return (
						<div
							key={slideKey}
							className={styles.orbitItem}
							data-orbit-item="true"
						>
							{href ? (
								<Link
									className={styles.orbitLink}
									href={href}
								>
									{inner}
								</Link>
							) : (
								inner
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
