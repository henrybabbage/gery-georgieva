'use client'

import { useGSAP, gsap, ScrollTrigger } from '@/lib/gsap'
import { useLenis } from 'lenis/react'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

import styles from './scrolling-gallery-048.module.css'

const GALLERY_IMAGE_SIZE_PX = 1200

export interface ScrollingGallery048Props {
	imageSrcs: readonly string[]
}

export default function ScrollingGallery048 ({
	imageSrcs,
}: ScrollingGallery048Props) {
	const rootRef = useRef<HTMLElement>(null)
	const scrollHintRef = useRef<HTMLParagraphElement>(null)

	useLenis(() => {
		ScrollTrigger.update()
	}, [])

	useEffect(() => {
		const root = rootRef.current
		if (!root) return

		const observer = new ResizeObserver(() => {
			ScrollTrigger.refresh()
		})
		observer.observe(root)
		return () => observer.disconnect()
	}, [])

	useGSAP(
		() => {
			const root = rootRef.current
			const scrollHint = scrollHintRef.current
			if (!root || !scrollHint) return

			gsap.to(scrollHint, {
				autoAlpha: 0,
				duration: 0.2,
				scrollTrigger: {
					trigger: root,
					start: 'top top',
					end: 'top top-=1',
					toggleActions: 'play none reverse none',
				},
			})

			const medias = root.querySelectorAll<HTMLElement>(
				'[data-gallery-media="true"]',
			)
			medias.forEach((media) => {
				gsap.to(media, {
					rotationY: 360,
					ease: 'none',
					scrollTrigger: {
						trigger: media,
						start: 'top bottom',
						end: 'bottom top',
						scrub: true,
					},
				})
			})

			ScrollTrigger.refresh()
		},
		{ scope: rootRef, dependencies: [imageSrcs] },
	)

	return (
		<section
			ref={rootRef}
			className={`${styles.root} min-h-screen w-full bg-[#121212] font-sans text-[22px] font-medium leading-[1.3] text-[#F1F1F1]`}
			aria-label="Scrolling gallery"
		>
			<p ref={scrollHintRef} className={styles.scroll}>
				Scroll
			</p>
			<div className={styles.container}>
				{imageSrcs.map((src, index) => (
					<div
						key={src}
						className={styles.media}
						data-gallery-media="true"
					>
						<Image
							src={src}
							alt={`Gery Georgieva, gallery image ${index + 1}`}
							width={GALLERY_IMAGE_SIZE_PX}
							height={GALLERY_IMAGE_SIZE_PX}
							sizes="(max-width: 768px) 36vw, 20vw"
							priority={index === 0}
						/>
					</div>
				))}
			</div>
		</section>
	)
}
