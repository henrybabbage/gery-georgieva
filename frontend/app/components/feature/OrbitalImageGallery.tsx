'use client'

import {gsap} from '@/lib/gsap'
import Image from 'next/image'
import {useEffect, useRef} from 'react'

import styles from './orbital-image-gallery.module.css'

const TAU = Math.PI * 2

/** radians per px of vertical wheel delta */
const WHEEL_RAD_PER_PX = 0.0035
/** Same feel for drag on touch screens */
const TOUCH_RAD_PER_PX = 0.008

export interface OrbitalImageGalleryProps {
	imageSrcs: readonly string[]
}

export default function OrbitalImageGallery ({
	imageSrcs,
}: OrbitalImageGalleryProps) {
	const viewportRef = useRef<HTMLDivElement>(null)
	const phaseRef = useRef(0)

	useEffect(() => {
		const viewport = viewportRef.current
		const n = imageSrcs.length
		if (!viewport || n === 0) return

		const viewportEl = viewport

		const prefersReduced =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)')
				.matches

		let lastTouchY = 0

		function radiusPx () {
			const r = viewportEl.getBoundingClientRect()
			return Math.min(r.width, r.height) * 0.38
		}

		function applyPhase (phase: number) {
			const items = viewportEl.querySelectorAll<HTMLElement>(
				'[data-orbit-item="true"]',
			)
			const R = radiusPx()
			items.forEach((el, i) => {
				const theta = phase + (TAU * i) / n
				const y = Math.sin(theta) * R
				const z = Math.cos(theta) * R
				const cz = Math.cos(theta)
				gsap.set(el, {
					xPercent: -50,
					yPercent: -50,
					x: 0,
					y,
					z,
					force3D: true,
					zIndex: Math.round(100 + cz * 50),
					opacity: 0.22 + 0.78 * Math.max(0, cz),
				})
			})
		}

		function layStaticSpread () {
			const items = viewportEl.querySelectorAll<HTMLElement>(
				'[data-orbit-item="true"]',
			)
			const R = radiusPx()
			items.forEach((el, i) => {
				const theta = (TAU * i) / n
				const y = Math.sin(theta) * R * 0.82
				const z = Math.cos(theta) * R * 0.82
				const cz = Math.cos(theta)
				gsap.set(el, {
					xPercent: -50,
					yPercent: -50,
					x: 0,
					y,
					z,
					force3D: true,
					zIndex: Math.round(100 + cz * 40),
					opacity: 0.35 + 0.65 * Math.max(0, cz),
				})
			})
		}

		if (prefersReduced) {
			layStaticSpread()
			const ro = new ResizeObserver(() => {
				layStaticSpread()
			})
			ro.observe(viewportEl)
			return () => ro.disconnect()
		}

		const onWheel = (e: WheelEvent) => {
			e.preventDefault()
			e.stopPropagation()
			phaseRef.current += e.deltaY * WHEEL_RAD_PER_PX
			applyPhase(phaseRef.current)
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
			phaseRef.current += dy * TOUCH_RAD_PER_PX
			applyPhase(phaseRef.current)
		}

		viewportEl.addEventListener('wheel', onWheel, {passive: false})
		viewportEl.addEventListener('touchstart', onTouchStart, {passive: true})
		viewportEl.addEventListener('touchmove', onTouchMove, {passive: false})

		applyPhase(phaseRef.current)

		const observer = new ResizeObserver(() => {
			applyPhase(phaseRef.current)
		})
		observer.observe(viewportEl)

		return () => {
			viewportEl.removeEventListener('wheel', onWheel)
			viewportEl.removeEventListener('touchstart', onTouchStart)
			viewportEl.removeEventListener('touchmove', onTouchMove)
			observer.disconnect()
		}
	}, [imageSrcs])

	return (
		<div
			ref={viewportRef}
			className={`${styles.viewport} touch-none bg-transparent`}
			role="region"
			aria-roledescription="Orbital carousel; scroll with wheel or drag on touch"
			tabIndex={0}
		>
			<div className={styles.stage}>
				{imageSrcs.map((src, index) => (
					<div
						key={src}
						className={styles.orbitItem}
						data-orbit-item="true"
					>
						<div className={styles.orbitInner}>
							<Image
								src={src}
								alt={`Gery Georgieva, gallery image ${index + 1}`}
								fill
								className="object-contain"
								sizes="(max-width: 1023px) min(72vw, 48vh), min(42vw, 52vh)"
								priority={index === 0}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
