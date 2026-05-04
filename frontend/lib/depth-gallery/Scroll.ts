import type {Debug} from '@/lib/depth-gallery/Debug'
import type {Gallery} from '@/lib/depth-gallery/Gallery'
import * as THREE from 'three'

const POINTER_EVENTS_SUPPORTED =
	typeof window !== 'undefined' && typeof window.PointerEvent !== 'undefined'

export class Scroll {
	isInitialized = false
	isDebugBound = false
	camera: THREE.PerspectiveCamera
	gallery: Gallery
	debug: Debug | null

	scrollTarget = 0
	scrollCurrent = 0
	scrollSmoothing = 0.08
	/** Stronger follow while dragging on touch so motion feels less laggy. */
	scrollSmoothingTouch = 0.26
	scrollToWorldFactor = 0.0045
	wheelScrollSpeed = 0.5
	/** Fine-pointer touch (e.g. some tablets); most phones use coarse multiplier. */
	touchScrollSpeed = 1.15
	/**
	 * Coarse pointers (phones): high gain so one full swipe can advance several
	 * planes instead of many short swipes.
	 */
	touchScrollSpeedCoarse = 5.25
	previousScrollCurrent = 0
	invertScroll = false

	rawVelocity = 0
	velocity = 0
	velocityDamping = 0.12
	velocityMax = 1.5
	velocityStopThreshold = 0.0001

	useScrollBounds = true
	firstPlaneViewOffset = 5
	lastPlaneViewOffset = 5
	minCameraZ = -Infinity
	maxCameraZ = Infinity
	cameraStartZ: number

	showVelocityVisualizer = true
	debugUiVisible = false
	touchY = 0
	isTouchDragging = false
	capturedPointerId: number | null = null
	pointerLastY = 0
	eventRoot: HTMLElement | Window | null = null

	velocityVisualizerElement: HTMLDivElement | null = null
	velocityVisualizerFillElement: HTMLDivElement | null = null
	velocityVisualizerValueElement: HTMLParagraphElement | null = null

	/** Typed as `Event` so `HTMLElement.addEventListener` accepts these handlers. */
	onWheel: (event: Event) => void
	onTouchStart: (event: Event) => void
	onTouchMove: (event: Event) => void
	onTouchEnd: (event: Event) => void
	onPointerDown: (event: Event) => void
	onPointerMove: (event: Event) => void
	onPointerUp: (event: Event) => void

	constructor(camera: THREE.PerspectiveCamera, gallery: Gallery, debug: Debug | null = null) {
		this.camera = camera
		this.gallery = gallery
		this.debug = debug
		this.cameraStartZ = this.camera.position.z

		this.onWheel = (event: Event) => {
			if (!(event instanceof WheelEvent)) return
			event.preventDefault()
			const normalizedWheelDelta = this.normalizeWheelDelta(event) * this.wheelScrollSpeed
			this.addScrollInput(normalizedWheelDelta)
		}
		this.onTouchStart = (event: Event) => {
			if (!(event instanceof TouchEvent)) return
			this.isTouchDragging = true
			this.touchY = event.touches[0]?.clientY ?? 0
		}
		this.onTouchMove = (event: Event) => {
			if (!(event instanceof TouchEvent)) return
			event.preventDefault()
			const currentTouchY = event.touches[0]?.clientY ?? this.touchY
			const deltaY = this.touchY - currentTouchY
			this.addScrollInput(deltaY * this.getTouchScrollMultiplier())
			this.touchY = currentTouchY
		}
		this.onTouchEnd = (_event: Event) => {
			this.isTouchDragging = false
		}
		this.onPointerDown = (event: Event) => {
			if (!(event instanceof PointerEvent)) return
			if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
			const target = event.currentTarget
			if (target instanceof HTMLElement) {
				try {
					target.setPointerCapture(event.pointerId)
				} catch {
					// ignore if capture unsupported for this element
				}
			}
			this.capturedPointerId = event.pointerId
			this.pointerLastY = event.clientY
			this.isTouchDragging = true
		}
		this.onPointerMove = (event: Event) => {
			if (!(event instanceof PointerEvent)) return
			if (this.capturedPointerId === null || event.pointerId !== this.capturedPointerId) {
				return
			}
			event.preventDefault()
			const deltaY = this.pointerLastY - event.clientY
			this.pointerLastY = event.clientY
			this.addScrollInput(deltaY * this.getTouchScrollMultiplier())
		}
		this.onPointerUp = (event: Event) => {
			if (!(event instanceof PointerEvent)) return
			if (this.capturedPointerId !== event.pointerId) return
			const target = event.currentTarget
			if (target instanceof HTMLElement) {
				try {
					target.releasePointerCapture(event.pointerId)
				} catch {
					// ignore
				}
			}
			this.capturedPointerId = null
			this.isTouchDragging = false
		}
	}

	setEventRoot(root: HTMLElement | null): void {
		this.eventRoot = root
	}

	getTouchScrollMultiplier(): number {
		if (typeof window === 'undefined' || !window.matchMedia) {
			return this.touchScrollSpeed
		}
		const coarse = window.matchMedia('(pointer: coarse)').matches
		const base = coarse ? this.touchScrollSpeedCoarse : this.touchScrollSpeed
		if (!coarse) return base

		const h = window.innerHeight || 640
		// Taller viewports get a modest extra boost (full-height swipe = more px).
		const viewportBoost = THREE.MathUtils.clamp(h / 560, 1.06, 1.5)
		return base * viewportBoost
	}

	init(): void {
		if (this.isInitialized) return

		this.updateCameraBounds()
		this.cameraStartZ = this.maxCameraZ
		this.camera.position.z = this.cameraStartZ
		this.scrollTarget = 0
		this.scrollCurrent = 0
		this.previousScrollCurrent = this.scrollCurrent
		this.rawVelocity = 0
		this.velocity = 0

		if (this.debug) {
			this.createVelocityVisualizer()
			this.updateVelocityVisualizer()
			this.bindDebug()
		}

		this.isInitialized = true
	}

	bindEvents(): void {
		const touchTarget = this.eventRoot ?? window

		window.addEventListener('wheel', this.onWheel, {passive: false})

		if (POINTER_EVENTS_SUPPORTED && touchTarget instanceof HTMLElement) {
			touchTarget.addEventListener('pointerdown', this.onPointerDown, {passive: true})
			touchTarget.addEventListener('pointermove', this.onPointerMove, {passive: false})
			touchTarget.addEventListener('pointerup', this.onPointerUp, {passive: true})
			touchTarget.addEventListener('pointercancel', this.onPointerUp, {passive: true})
		} else {
			touchTarget.addEventListener('touchstart', this.onTouchStart, {passive: true})
			touchTarget.addEventListener('touchmove', this.onTouchMove, {passive: false})
			touchTarget.addEventListener('touchend', this.onTouchEnd, {passive: true})
			touchTarget.addEventListener('touchcancel', this.onTouchEnd, {passive: true})
		}
	}

	updateCameraBounds(): void {
		const depthRange = this.gallery.getDepthRange()
		this.maxCameraZ = depthRange.nearestZ + this.firstPlaneViewOffset
		this.minCameraZ = depthRange.deepestZ + this.lastPlaneViewOffset

		if (this.minCameraZ > this.maxCameraZ) {
			this.minCameraZ = this.maxCameraZ
		}
	}

	cameraZFromScroll(scrollAmount: number): number {
		return this.cameraStartZ - scrollAmount * this.scrollToWorldFactor
	}

	scrollFromCameraZ(cameraZ: number): number {
		if (this.scrollToWorldFactor === 0) return 0
		return (this.cameraStartZ - cameraZ) / this.scrollToWorldFactor
	}

	normalizeWheelDelta(event: WheelEvent): number {
		if (event.deltaMode === 1) return event.deltaY * 16
		if (event.deltaMode === 2) return event.deltaY * window.innerHeight
		return event.deltaY
	}

	addScrollInput(deltaY: number): void {
		const scrollDirection = this.invertScroll ? -1 : 1
		this.scrollTarget += deltaY * scrollDirection
	}

	updateVelocity(): void {
		this.rawVelocity = this.scrollCurrent - this.previousScrollCurrent
		this.velocity = THREE.MathUtils.lerp(this.velocity, this.rawVelocity, this.velocityDamping)
		this.velocity = THREE.MathUtils.clamp(this.velocity, -this.velocityMax, this.velocityMax)

		if (Math.abs(this.velocity) < this.velocityStopThreshold) {
			this.velocity = 0
		}

		this.previousScrollCurrent = this.scrollCurrent
	}

	createVelocityVisualizer(): void {
		if (this.velocityVisualizerElement) return

		const container = document.createElement('div')
		container.className = 'velocity-visualizer'

		const label = document.createElement('p')
		label.className = 'velocity-visualizer__label'
		label.textContent = 'Velocity'

		const value = document.createElement('p')
		value.className = 'velocity-visualizer__value'
		value.textContent = '0.0000'

		const track = document.createElement('div')
		track.className = 'velocity-visualizer__track'

		const fill = document.createElement('div')
		fill.className = 'velocity-visualizer__fill'
		track.append(fill)

		container.append(label, value, track)
		document.body.append(container)

		this.velocityVisualizerElement = container
		this.velocityVisualizerFillElement = fill
		this.velocityVisualizerValueElement = value
		this.setVelocityVisualizerVisible(this.showVelocityVisualizer)
	}

	setVelocityVisualizerVisible(isVisible: boolean): void {
		if (!this.velocityVisualizerElement) return
		const shouldShow = Boolean(isVisible) && this.debugUiVisible
		this.velocityVisualizerElement.style.display = shouldShow ? 'block' : 'none'
	}

	setDebugUiVisible(isVisible: boolean): void {
		this.debugUiVisible = Boolean(isVisible)
		this.setVelocityVisualizerVisible(this.showVelocityVisualizer)
	}

	updateVelocityVisualizer(): void {
		if (
			!this.velocityVisualizerElement ||
			!this.velocityVisualizerFillElement ||
			!this.velocityVisualizerValueElement
		) {
			return
		}

		const velocitySign = this.velocity === 0 ? 0 : Math.sign(this.velocity)
		const normalizedVelocity = THREE.MathUtils.clamp(
			Math.abs(this.velocity) / this.velocityMax,
			0,
			1,
		)
		const fillPercent = normalizedVelocity * 50

		if (velocitySign >= 0) {
			this.velocityVisualizerFillElement.style.left = '50%'
			this.velocityVisualizerFillElement.style.width = `${fillPercent}%`
		} else {
			this.velocityVisualizerFillElement.style.left = `${50 - fillPercent}%`
			this.velocityVisualizerFillElement.style.width = `${fillPercent}%`
		}

		this.velocityVisualizerFillElement.style.backgroundColor =
			velocitySign >= 0 ? '#7fffd4' : '#ff8fab'
		this.velocityVisualizerValueElement.textContent = this.velocity.toFixed(4)
	}

	update(): void {
		this.updateCameraBounds()
		const smoothing =
			this.isTouchDragging && this.scrollSmoothingTouch > 0
				? this.scrollSmoothingTouch
				: this.scrollSmoothing
		this.scrollCurrent = THREE.MathUtils.lerp(this.scrollCurrent, this.scrollTarget, smoothing)

		if (this.useScrollBounds) {
			const minimumScroll = this.scrollFromCameraZ(this.maxCameraZ)
			const maximumScroll = this.scrollFromCameraZ(this.minCameraZ)

			this.scrollTarget = THREE.MathUtils.clamp(this.scrollTarget, minimumScroll, maximumScroll)
			this.scrollCurrent = THREE.MathUtils.clamp(this.scrollCurrent, minimumScroll, maximumScroll)
		}

		this.updateVelocity()
		this.updateVelocityVisualizer()

		const nextCameraZ = this.cameraZFromScroll(this.scrollCurrent)
		if (this.useScrollBounds) {
			this.camera.position.z = THREE.MathUtils.clamp(nextCameraZ, this.minCameraZ, this.maxCameraZ)
			return
		}

		this.camera.position.z = nextCameraZ
	}

	bindDebug(): void {
		if (!this.debug || this.isDebugBound) return

		this.debug.addBinding({
			folderTitle: 'Scroll',
			targetObject: this,
			property: 'useScrollBounds',
			label: 'Use Bounds',
		})

		this.debug.addBinding({
			folderTitle: 'Scroll',
			targetObject: this,
			property: 'invertScroll',
			label: 'Invert Scroll',
		})

		this.debug.addBinding({
			folderTitle: 'Scroll',
			targetObject: this,
			property: 'showVelocityVisualizer',
			label: 'Debug Velocity',
			onChange: (value: unknown) => {
				this.setVelocityVisualizerVisible(Boolean(value))
			},
		})

		this.debug.addBinding({
			folderTitle: 'Scroll',
			targetObject: this,
			property: 'velocityDamping',
			label: 'Velocity Damping',
			options: {
				min: 0.01,
				max: 1,
				step: 0.01,
			},
		})

		this.debug.addBinding({
			folderTitle: 'Scroll',
			targetObject: this,
			property: 'velocityMax',
			label: 'Velocity Max',
			options: {
				min: 0.1,
				max: 5,
				step: 0.1,
			},
		})

		this.isDebugBound = true
	}

	dispose(): void {
		const touchTarget = this.eventRoot ?? window

		window.removeEventListener('wheel', this.onWheel)

		if (POINTER_EVENTS_SUPPORTED && touchTarget instanceof HTMLElement) {
			touchTarget.removeEventListener('pointerdown', this.onPointerDown)
			touchTarget.removeEventListener('pointermove', this.onPointerMove)
			touchTarget.removeEventListener('pointerup', this.onPointerUp)
			touchTarget.removeEventListener('pointercancel', this.onPointerUp)
		} else {
			touchTarget.removeEventListener('touchstart', this.onTouchStart)
			touchTarget.removeEventListener('touchmove', this.onTouchMove)
			touchTarget.removeEventListener('touchend', this.onTouchEnd)
			touchTarget.removeEventListener('touchcancel', this.onTouchEnd)
		}

		this.velocityVisualizerElement?.remove()
		this.velocityVisualizerElement = null
		this.velocityVisualizerFillElement = null
		this.velocityVisualizerValueElement = null
	}
}
