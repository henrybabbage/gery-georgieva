import {Experience} from '@/lib/depth-gallery/Experience'
import {Scroll} from '@/lib/depth-gallery/Scroll'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import * as THREE from 'three'

const IS_DEV = process.env.NODE_ENV === 'development'

export interface EngineCreateOptions {
	/** Fired only when visible plane index changes. */
	onActivePlaneIndexChange?: (planeIndex: number) => void
	/**
	 * Stats, Tweakepane, scroll velocity HUD, and D-key toggle.
	 * Honored only when `NODE_ENV === 'development'`.
	 */
	enableDebugInfrastructure?: boolean
}

export class Engine {
	canvas: HTMLCanvasElement
	experience: Experience
	debug = null as Experience['debug']
	isInitialized = false
	isRunning = false
	isDebugBound = false
	animationFrameRequestId = null as number | null
	preloadedTextures = new Map<string, THREE.Texture>()
	stats = null as Stats | null
	showFps = true
	isDebugUiVisible = false
	scene: THREE.Scene
	camera: THREE.PerspectiveCamera
	scroll: Scroll
	renderer: THREE.WebGLRenderer
	onResize: () => void
	onKeyDown: (event: KeyboardEvent) => void
	animate: () => void
	lastActivePlaneIndex = -1
	onActivePlaneIndexChange?: (planeIndex: number) => void
	enableDebugInfrastructure: boolean

	constructor(canvas: HTMLCanvasElement, experience: Experience, options: EngineCreateOptions = {}) {
		if (!(canvas instanceof HTMLCanvasElement)) {
			throw new Error('Engine requires a valid canvas element')
		}

		this.canvas = canvas
		this.experience = experience
		this.debug = experience.debug
		this.onActivePlaneIndexChange = options.onActivePlaneIndexChange
		this.enableDebugInfrastructure = options.enableDebugInfrastructure ?? false

		this.scene = new THREE.Scene()

		this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
		this.camera.position.set(0, 0, 6)

		this.scroll = new Scroll(this.camera, experience.gallery, this.debug)

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
		})
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
		this.renderer.outputColorSpace = THREE.SRGBColorSpace
		this.renderer.autoClear = false

		this.onResize = () => {
			this.resize()
		}
		this.onKeyDown = (event: KeyboardEvent) => {
			if (!IS_DEV || !this.enableDebugInfrastructure) return
			if (event.repeat) return
			if (event.key.toLowerCase() !== 'd') return
			this.setDebugUiVisible(!this.isDebugUiVisible)
		}

		this.animate = this.update.bind(this)
	}

	async init(): Promise<void> {
		if (this.isInitialized) return

		try {
			this.preloadedTextures = await this.preloadTextures()
			this.experience.gallery.setPreloadedTextures(this.preloadedTextures)

			await this.experience.init(this.scene, this.camera)
			this.scroll.init()
			if (IS_DEV && this.enableDebugInfrastructure) {
				this.initStats()
				this.bindDebug()
				this.setDebugUiVisible(false)
				window.addEventListener('keydown', this.onKeyDown)
			}

			this.resize()
			window.addEventListener('resize', this.onResize)
			this.scroll.bindEvents()

			this.isInitialized = true
			this.start()
		} catch (e) {
			throw e
		}
	}

	start(): void {
		if (!this.isInitialized || this.isRunning) return

		this.isRunning = true
		this.update()
	}

	resize(): void {
		const width = this.canvas.clientWidth || window.innerWidth || 1
		const height = this.canvas.clientHeight || window.innerHeight || 1
		if (width <= 0 || height <= 0) return

		this.camera.aspect = width / height
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(width, height, false)
		this.experience.gallery.setResolution(this.renderer)
		this.experience.gallery.updatePlaneScale()
		this.experience.gallery.layoutPlanes()
		this.experience.label.resize(width, height)
	}

	async preloadTextures(): Promise<Map<string, THREE.Texture>> {
		const textureSources = this.experience.gallery.getTextureSources() as string[]
		if (!textureSources.length) return new Map()

		const textureLoader = new THREE.TextureLoader()
		textureLoader.setCrossOrigin('anonymous')
		const loadedTextures = new Map<string, THREE.Texture>()

		await Promise.all(
			textureSources.map(async (textureSource: string) => {
				try {
					const texture = await textureLoader.loadAsync(textureSource)
					texture.colorSpace = THREE.NoColorSpace
					loadedTextures.set(textureSource, texture)
				} catch (error) {
					console.warn(`Texture failed to load: ${textureSource}`, error)
				}
			}),
		)

		return loadedTextures
	}

	update(): void {
		if (!this.isRunning) return

		this.animationFrameRequestId = requestAnimationFrame(this.animate)
		this.stats?.begin()

		const time = performance.now()

		this.scroll.update()
		this.experience.update(time, this.camera, this.scroll)

		const blendData = this.experience.gallery.getPlaneBlendData(this.camera.position.z)
		let nextIndex = -1
		if (blendData) {
			nextIndex = blendData.blend >= 0.5 ? blendData.nextPlaneIndex : blendData.currentPlaneIndex
		}
		if (nextIndex !== this.lastActivePlaneIndex) {
			this.lastActivePlaneIndex = nextIndex
			this.onActivePlaneIndexChange?.(nextIndex)
		}

		this.renderer.clear(true, true, true)
		this.experience.background.render(this.renderer)
		this.renderer.clearDepth()
		this.renderer.render(this.scene, this.camera)
		this.experience.label.render()
		this.stats?.end()
	}

	initStats(): void {
		if (this.stats) return

		this.stats = new Stats()
		this.stats.showPanel(0)
		this.stats.dom.classList.add('fps-stats')
		document.body.append(this.stats.dom)
		this.setFpsVisible(this.showFps)
	}

	setFpsVisible(isVisible: boolean): void {
		if (!this.stats) return
		const shouldShow = Boolean(isVisible) && this.isDebugUiVisible
		this.stats.dom.style.display = shouldShow ? 'block' : 'none'
	}

	setDebugUiVisible(isVisible: boolean): void {
		this.isDebugUiVisible = Boolean(isVisible)
		this.debug?.setVisible(this.isDebugUiVisible)
		this.scroll?.setDebugUiVisible(this.isDebugUiVisible)
		this.setFpsVisible(this.showFps)
	}

	bindDebug(): void {
		if (!this.debug || this.isDebugBound) return

		this.debug.addBinding({
			folderTitle: 'Engine',
			targetObject: this,
			property: 'showFps',
			label: 'Show FPS',
			onChange: (value: unknown) => {
				this.setFpsVisible(Boolean(value))
			},
		})

		this.isDebugBound = true
	}

	dispose(): void {
		this.isRunning = false

		if (this.animationFrameRequestId !== null) {
			cancelAnimationFrame(this.animationFrameRequestId)
			this.animationFrameRequestId = null
		}

		window.removeEventListener('resize', this.onResize)
		window.removeEventListener('keydown', this.onKeyDown)
		this.scroll.dispose()

		this.preloadedTextures.forEach((texture) => {
			texture.dispose()
		})
		this.preloadedTextures.clear()
		this.stats?.dom.remove()
		this.stats = null

		this.scene.clear()
		this.renderer.dispose()
		this.experience.dispose()
	}
}
