import type {Debug} from '@/lib/depth-gallery/Debug'
import * as THREE from 'three'

export class Background {
	debug: Debug | null = null
	isInitialized = false
	isDebugBound = false

	scene: THREE.Scene | null = null
	camera: THREE.OrthographicCamera | null = null
	material: THREE.MeshBasicMaterial | null = null
	mesh: THREE.Mesh | null = null

	constructor(debug: Debug | null = null) {
		this.debug = debug
	}

	init(): void {
		if (this.isInitialized) return

		this.scene = new THREE.Scene()
		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

		this.material = new THREE.MeshBasicMaterial({
			color: '#ffffff',
			depthWrite: false,
			depthTest: false,
		})

		const geometry = new THREE.PlaneGeometry(2, 2)
		this.mesh = new THREE.Mesh(geometry, this.material)
		this.scene.add(this.mesh)

		this.isInitialized = true
	}

	setMoodColors(): void {}

	setMoodBlend(): void {}

	setMotionResponse(_payload: unknown): void {
		void _payload
	}

	bindDebug(): void {
		if (!this.debug || this.isDebugBound) return
		this.isDebugBound = true
	}

	update(_time?: number): void {
		void _time
	}

	render(renderer: THREE.WebGLRenderer): void {
		if (!this.isInitialized || !this.scene || !this.camera) return
		renderer.render(this.scene, this.camera)
	}

	dispose(): void {
		if (!this.isInitialized) return

		this.mesh?.geometry.dispose()
		this.material?.dispose()
		this.scene?.clear()

		this.scene = null
		this.camera = null
		this.mesh = null
		this.material = null
		this.isInitialized = false
	}
}
