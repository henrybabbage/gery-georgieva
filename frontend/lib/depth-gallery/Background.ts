import type {Debug} from '@/lib/depth-gallery/Debug'
import fragmentShader from '@/lib/depth-gallery/shaders/BackgroundFragSource'
import vertexShader from '@/lib/depth-gallery/shaders/BackgroundVertSource'
import * as THREE from 'three'

export interface BackgroundMoodColors {
	background: string
	blob1: string
	blob2: string
}

export interface BackgroundMoodBlendPayload {
	currentMood: BackgroundMoodColors
	nextMood: BackgroundMoodColors
	blend: number
}

export class Background {
	debug: Debug | null = null
	isInitialized = false
	isDebugBound = false

	scene: THREE.Scene | null = null
	camera: THREE.OrthographicCamera | null = null
	material: THREE.ShaderMaterial | null = null
	mesh: THREE.Mesh | null = null

	backgroundColor = new THREE.Color('#FBE8CD')
	blob1Color = new THREE.Color('#FFD56D')
	blob2Color = new THREE.Color('#5D816A')
	nextBackgroundColor = new THREE.Color()
	nextBlob1Color = new THREE.Color()
	nextBlob2Color = new THREE.Color()

	baseBlobRadius = 0.65
	secondaryBlobRadiusRatio = 0.78
	baseBlobStrength = 0.9

	depthToRadiusAmount = 0.08
	velocityToStrengthAmount = 0.1
	motionSmoothing = 0.1
	motionDepthProgress = 0
	motionVelocityIntensity = 0
	smoothedDepthProgress = 0
	smoothedVelocityIntensity = 0

	blobRadius = 0.65
	blobStrength = 0.9
	noiseStrength = 0.04

	constructor(debug: Debug | null = null) {
		this.debug = debug
	}

	init(): void {
		if (this.isInitialized) return

		this.scene = new THREE.Scene()
		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

		this.material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			depthWrite: false,
			depthTest: false,
			uniforms: {
				uBackgroundColor: {value: this.backgroundColor},
				uBlob1Color: {value: this.blob1Color},
				uBlob2Color: {value: this.blob2Color},
				uNoiseStrength: {value: this.noiseStrength},
				uBlobRadius: {value: this.blobRadius},
				uBlobRadiusSecondary: {
					value: this.blobRadius * this.secondaryBlobRadiusRatio,
				},
				uBlobStrength: {value: this.blobStrength},
				uTime: {value: 0},
				uVelocityIntensity: {value: 0},
			},
		})

		const geometry = new THREE.PlaneGeometry(2, 2)
		this.mesh = new THREE.Mesh(geometry, this.material)
		this.scene.add(this.mesh)
		this.applyMotionToBlob()
		this.bindDebug()

		this.isInitialized = true
	}

	setMoodColors(payload: Partial<BackgroundMoodColors> = {}): void {
		if (payload.background) this.backgroundColor.set(payload.background)
		if (payload.blob1) this.blob1Color.set(payload.blob1)
		if (payload.blob2) this.blob2Color.set(payload.blob2)

		this.updateUniformColors()
	}

	setMoodBlend(payload: Partial<BackgroundMoodBlendPayload> = {}): void {
		const {currentMood, nextMood, blend} = payload
		if (!currentMood) return

		const safeBlend = THREE.MathUtils.clamp(blend ?? 0, 0, 1)
		if (!nextMood || safeBlend <= 0) {
			this.setMoodColors(currentMood)
			return
		}

		this.backgroundColor
			.set(currentMood.background)
			.lerp(this.nextBackgroundColor.set(nextMood.background), safeBlend)
		this.blob1Color
			.set(currentMood.blob1)
			.lerp(this.nextBlob1Color.set(nextMood.blob1), safeBlend)
		this.blob2Color
			.set(currentMood.blob2)
			.lerp(this.nextBlob2Color.set(nextMood.blob2), safeBlend)

		this.updateUniformColors()
	}

	updateUniformColors(): void {
		if (!this.material) return

		this.material.uniforms.uBackgroundColor.value.copy(this.backgroundColor)
		this.material.uniforms.uBlob1Color.value.copy(this.blob1Color)
		this.material.uniforms.uBlob2Color.value.copy(this.blob2Color)
		this.material.uniforms.uNoiseStrength.value = this.noiseStrength
	}

	updateBlobUniforms(): void {
		if (!this.material) return

		this.material.uniforms.uBlobRadius.value = this.blobRadius
		this.material.uniforms.uBlobRadiusSecondary.value =
			this.blobRadius * this.secondaryBlobRadiusRatio
		this.material.uniforms.uBlobStrength.value = this.blobStrength
	}

	setMotionResponse(payload: {
		depthProgress?: number
		velocityIntensity?: number
	} = {}): void {
		if (Number.isFinite(payload.depthProgress)) {
			this.motionDepthProgress = THREE.MathUtils.clamp(
				payload.depthProgress as number,
				0,
				1,
			)
		}
		if (Number.isFinite(payload.velocityIntensity)) {
			this.motionVelocityIntensity = THREE.MathUtils.clamp(
				payload.velocityIntensity as number,
				0,
				1,
			)
		}
	}

	applyMotionToBlob(): void {
		const nextBlobRadius =
			this.baseBlobRadius + this.smoothedDepthProgress * this.depthToRadiusAmount
		const nextBlobStrength =
			this.baseBlobStrength +
			this.smoothedVelocityIntensity * this.velocityToStrengthAmount

		this.blobRadius = THREE.MathUtils.clamp(nextBlobRadius, 0.05, 1)
		this.blobStrength = THREE.MathUtils.clamp(nextBlobStrength, 0, 1)

		this.updateBlobUniforms()
	}

	bindDebug(): void {
		if (!this.debug || this.isDebugBound) return

		this.debug.addBinding({
			folderTitle: 'Background',
			targetObject: this,
			property: 'baseBlobRadius',
			label: 'Blob Radius',
			options: {min: 0.1, max: 1, step: 0.01},
			onChange: () => {
				this.applyMotionToBlob()
			},
		})

		this.debug.addBinding({
			folderTitle: 'Background',
			targetObject: this,
			property: 'secondaryBlobRadiusRatio',
			label: 'Blob 2 Size',
			options: {min: 0.3, max: 1.2, step: 0.01},
			onChange: () => {
				this.applyMotionToBlob()
			},
		})

		this.debug.addBinding({
			folderTitle: 'Background',
			targetObject: this,
			property: 'baseBlobStrength',
			label: 'Blob Strength',
			options: {min: 0, max: 1, step: 0.01},
			onChange: () => {
				this.applyMotionToBlob()
			},
		})

		this.debug.addBinding({
			folderTitle: 'Background',
			targetObject: this,
			property: 'noiseStrength',
			label: 'Noise',
			options: {min: 0, max: 0.2, step: 0.005},
			onChange: () => {
				this.updateUniformColors()
			},
		})

		this.isDebugBound = true
	}

	update(time = 0): void {
		this.smoothedDepthProgress = THREE.MathUtils.lerp(
			this.smoothedDepthProgress,
			this.motionDepthProgress,
			this.motionSmoothing,
		)
		this.smoothedVelocityIntensity = THREE.MathUtils.lerp(
			this.smoothedVelocityIntensity,
			this.motionVelocityIntensity,
			this.motionSmoothing,
		)

		if (this.material) {
			this.material.uniforms.uTime.value = time
			this.material.uniforms.uVelocityIntensity.value =
				this.smoothedVelocityIntensity
		}

		this.applyMotionToBlob()
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
