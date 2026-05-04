import type {Gallery} from '@/lib/depth-gallery/Gallery'
import type {Mesh, PerspectiveCamera} from 'three'

/** ASCII words; lowercases the rest of each word (handles ALL-CAPS source strings). */
export function toLabelTitleCase(s: string): string {
	return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

export function formatDepthGalleryLinkTitle(raw: string): string {
	const base = (raw || '').trim()
	if (!base.length) return 'selection'
	const head = base.endsWith(',') ? base.slice(0, -1).trim() : base
	return toLabelTitleCase(head)
}

export class Label {
	gallery: Gallery
	overlayElement: HTMLElement | null = null
	artworkTitleElement: HTMLElement | null = null
	activePlaneIndex = -1

	constructor(gallery: Gallery) {
		this.gallery = gallery
	}

	createElement(): {
		element: HTMLElement
		artworkTitleElement: HTMLElement | null
	} {
		const element = document.createElement('section')
		element.className = 'plane-label-overlay depth-gallery-plane-label'
		element.innerHTML = `
      <div class="plane-label-overlay__left">
        <p class="plane-label-overlay__artwork-title"></p>
      </div>
    `

		return {
			element,
			artworkTitleElement: element.querySelector('.plane-label-overlay__artwork-title'),
		}
	}

	init(mountParent?: HTMLElement | null): void {
		if (this.overlayElement) return

		const {
			element,
			artworkTitleElement,
		} = this.createElement()

		this.overlayElement = element
		this.artworkTitleElement = artworkTitleElement
		this.overlayElement.style.opacity = '0'

		const parent = mountParent ?? document.body
		parent.append(this.overlayElement)
	}

	getTargetPlaneIndex(cameraZ: number): number {
		const blendData = this.gallery.getPlaneBlendData(cameraZ)
		if (!blendData) return -1
		return blendData.blend >= 0.5 ? blendData.nextPlaneIndex : blendData.currentPlaneIndex
	}

	applyPlaneContent(planeIndex: number): void {
		const planes = (this.gallery as unknown as {planes: Mesh[]}).planes
		const plane = planes[planeIndex]
		if (!plane || this.activePlaneIndex === planeIndex) return

		const labelData = (plane.userData.label || {}) as {
			title?: string
			color?: string
		}

		if (this.artworkTitleElement) {
			const raw = labelData.title || 'Artwork title'
			const head = raw.endsWith(',') ? raw.slice(0, -1).trim() : raw
			this.artworkTitleElement.textContent = toLabelTitleCase(head)
		}
		if (this.overlayElement) {
			this.overlayElement.style.color = labelData.color || ''
		}

		this.activePlaneIndex = planeIndex
	}

	resize(width: number, height: number): void {
		void width
		void height
	}

	update(camera: PerspectiveCamera | null = null): void {
		if (!camera || !this.overlayElement) return

		const targetPlaneIndex = this.getTargetPlaneIndex(camera.position.z)
		if (targetPlaneIndex < 0) {
			this.overlayElement.style.opacity = '0'
			return
		}

		this.applyPlaneContent(targetPlaneIndex)
		this.overlayElement.style.opacity = '1'
	}

	render(): void {}

	dispose(): void {
		this.overlayElement?.remove()
		this.overlayElement = null
		this.artworkTitleElement = null
		this.activePlaneIndex = -1
	}
}
