import {Background} from '@/lib/depth-gallery/Background'
import type {Debug} from '@/lib/depth-gallery/Debug'
import {Gallery} from '@/lib/depth-gallery/Gallery'
import type {DepthGalleryPlaneDefinition} from '@/lib/depth-gallery/plane-config'
import {Label} from '@/lib/depth-gallery/Label'
import * as THREE from 'three'

export interface ExperienceInitOptions {
	debug: Debug | null
	labelMount?: HTMLElement | null
	frameTextRoot?: HTMLElement | null
}

export class Experience {
	isInitialized = false
	isDisposed = false
	frameDarkPlaneCount = 2
	isFrameTextDark: boolean | null = null
	debug: Debug | null
	gallery: Gallery
	label: Label
	background: Background
	labelMount?: HTMLElement | null
	frameTextRoot?: HTMLElement | null

	constructor(
		planeConfig: readonly DepthGalleryPlaneDefinition[],
		options: ExperienceInitOptions,
	) {
		this.debug = options.debug
		this.labelMount = options.labelMount ?? undefined
		this.frameTextRoot = options.frameTextRoot ?? undefined
		this.gallery = new Gallery(this.debug as never, planeConfig as never)
		this.label = new Label(this.gallery)
		this.background = new Background(this.debug)
	}

	async init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): Promise<void> {
		if (this.isInitialized) return

		await this.gallery.init(scene)
		this.label.init(this.labelMount)
		this.background.init()

		const initialPlaneBlendData = this.gallery.getPlaneBlendData(camera.position.z)
		this.updateFrameTextTone(initialPlaneBlendData)

		this.isInitialized = true
	}

	updateFrameTextTone(
		planeBlendData:
			| {blend: number; currentPlaneIndex: number; nextPlaneIndex: number}
			| null
			| undefined,
	): void {
		const root = this.frameTextRoot
		if (!root || !planeBlendData) return

		const nearestPlaneIndex =
			planeBlendData.blend >= 0.5 ? planeBlendData.nextPlaneIndex : planeBlendData.currentPlaneIndex
		const shouldUseDarkText = nearestPlaneIndex < this.frameDarkPlaneCount

		if (this.isFrameTextDark === shouldUseDarkText) return

		this.isFrameTextDark = shouldUseDarkText
		root.classList.toggle('depth-gallery-frame-text-dark', shouldUseDarkText)
	}

	update(time: number, camera: THREE.PerspectiveCamera | null = null, scroll: unknown | null = null): void {
		this.gallery.update(camera as never, scroll as never, time)
		this.label.update(camera)

		if (camera) {
			const planeBlendData = this.gallery.getPlaneBlendData(camera.position.z)
			this.updateFrameTextTone(planeBlendData)

			const moodBlendData = this.gallery.getMoodBlendData(camera.position.z)
			if (moodBlendData) {
				this.background.setMoodBlend(moodBlendData)
			}

			const depthProgress = this.gallery.getDepthProgress(camera.position.z)
			const sc = scroll as {velocityMax?: number; velocity?: number} | null
			const velocityMax = sc?.velocityMax || 1
			const velocityIntensity = THREE.MathUtils.clamp(
				Math.abs(sc?.velocity || 0) / Math.max(velocityMax, 0.0001),
				0,
				1,
			)
			const blend = planeBlendData?.blend ?? 0
			const distanceFromBlendCenter = Math.abs(blend - 0.5) * 2
			const transitionStability = THREE.MathUtils.smoothstep(distanceFromBlendCenter, 0.35, 1)
			const stabilizedVelocityIntensity = velocityIntensity * transitionStability

			this.background.setMotionResponse({
				depthProgress,
				velocityIntensity: stabilizedVelocityIntensity,
			})
		}

		this.background.update(time)
	}

	dispose(): void {
		if (this.isDisposed) return

		this.frameTextRoot?.classList.remove('depth-gallery-frame-text-dark')
		this.gallery.dispose()
		this.label.dispose()
		this.background.dispose()
		this.debug?.dispose()
		this.isDisposed = true
	}
}
