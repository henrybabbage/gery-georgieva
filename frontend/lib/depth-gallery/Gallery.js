import * as THREE from 'three'
import fragmentShader from '@/lib/depth-gallery/shaders/edgeDistortion.frag-source'
import vertexShader from '@/lib/depth-gallery/shaders/edgeDistortion.vert-source'

export class Gallery {
  constructor(debug = null, planeConfig = []) {
    this.isInitialized = false
    this.isDebugBound = false
    this.debug =
      /** @type {import('@/lib/depth-gallery/Debug').Debug | null} */ (
        debug
      )

    // Planes
    this.planes = []
    this.texturesBySource = new Map()
    this.useTextures = true
    this.planeGap = 5
    this.desktopPlaneScale = 0.75
    this.mobilePlaneScale = 0.5
    this.mobileXSpreadFactor = 0.25
    this.mobileBreakpoint = 768
    this.planeConfig =
      /** @type {readonly import('@/lib/depth-gallery/plane-config').DepthGalleryPlaneDefinition[]} */ (
        planeConfig
      )
    this.moodSampleOffset = 1
    this.planeFadeSampleOffset = 1
    this.planeFadeSmoothing = 0.14

    // Scroll-through passage (liquid plane)
    this.passageMaxStrength = 1
    this.passageExitBlendStart = 0.38
    this.passageExitCurvePower = 1.35
    this.passageEnterMax = 1
    this.passageEnterFadeSpan = 0.42
    this.passageEnterCurvePower = 1.35
    this.passageChromaMultiply = 1.25

    this.baseDistortionStrength = 0.35
    this.baseLightStrength = 0.18
    this.baseDistortionDepthRampStart = 0.74
    this.baseDistortionDepthRampEnd = 1

    // Parallax
    this.parallaxEnabled = true
    this.parallaxAmountX = 0.16
    this.parallaxAmountY = 0.08
    this.parallaxSmoothing = 0.08
    this.pointerTarget = new THREE.Vector2(0, 0)
    this.pointerCurrent = new THREE.Vector2(0, 0)

    // Breath
    this.breathEnabled = true
    this.breathTiltAmount = 0.045
    this.breathScaleAmount = 0.03
    this.breathSmoothing = 0.14
    this.breathGain = 1.1
    this.breathIntensity = 0
    this.targetBreathIntensity = 0

    // Gesture drift
    this.gestureParallaxEnabled = true
    this.gestureParallaxAmountY = 0.05
    this.gestureParallaxSmoothing = 0.05
    this.driftCurrent = 0
    this.driftTarget = 0

    // Pointer events
    this.onPointerMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = (event.clientY / window.innerHeight) * 2 - 1
      this.pointerTarget.set(x, -y)
    }
    this.onPointerLeave = () => {
      this.pointerTarget.set(0, 0)
    }

    const fallbackData = new Uint8Array([255, 255, 255, 255])
    this.fallbackTexture = new THREE.DataTexture(fallbackData, 1, 1, THREE.RGBAFormat)
    this.fallbackTexture.needsUpdate = true
    this.fallbackTexture.colorSpace = THREE.SRGBColorSpace
    this.fallbackTexture.magFilter = THREE.LinearFilter
    this.fallbackTexture.minFilter = THREE.LinearFilter

    this.drawingBufferSize = new THREE.Vector2(1, 1)
    this.scratchBaseColor = new THREE.Color()
  }

  async init(scene) {
    if (this.isInitialized) return

    this.setPlanes(scene)
    this.updatePlaneMaterialMode()
    this.updatePlaneScale()
    this.layoutPlanes()
    this.bindPointerEvents()
    this.bindDebug()

    this.isInitialized = true
  }

  setPlanes(scene) {
    const planeGeometry = new THREE.PlaneGeometry(3, 3)

    this.planeConfig.forEach((planeDef, index) => {
      const texture = this.texturesBySource.get(planeDef.textureSrc) || null
      const textureImage = texture?.image
      const aspectRatio =
        textureImage && textureImage.width > 0 && textureImage.height > 0
          ? textureImage.width / textureImage.height
          : 1
      const fallbackColor = planeDef.fallbackColor || '#ffffff'
      const accentColor = planeDef.accentColor || fallbackColor
      const backgroundColor = planeDef.backgroundColor || fallbackColor
      const blob1Color = planeDef.blob1Color || fallbackColor
      const blob2Color = planeDef.blob2Color || fallbackColor
      const labelData = this.getPlaneLabelData(planeDef, this.planes.length)
      const planeMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture: { value: texture || this.fallbackTexture },
          uBaseColor: {
            value: new THREE.Vector3(1, 1, 1),
          },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uEdgeDistortionStrength: { value: 1.5 },
          uEdgeWidth: { value: 0.09 },
          uBaseDistortionStrength: { value: this.baseDistortionStrength },
          uBaseLightStrength: { value: this.baseLightStrength },
          uPlaneAspect: { value: 1 },
          uImageAspect: { value: aspectRatio },
          uPassageStrength: { value: 0 },
          uPassageEnterPhase: { value: 0 },
          uPassageChromaMultiply: { value: this.passageChromaMultiply },
          opacity: { value: index === 0 ? 1 : 0 },
        },
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      })
      planeMaterial.opacity = index === 0 ? 1 : 0
      const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
      planeMesh.userData.basePosition = planeDef.position
      planeMesh.userData.baseColor = fallbackColor
      planeMesh.userData.accentColor = accentColor
      planeMesh.userData.backgroundColor = backgroundColor
      planeMesh.userData.blob1Color = blob1Color
      planeMesh.userData.blob2Color = blob2Color
      planeMesh.userData.label = labelData
      planeMesh.userData.texture = texture
      planeMesh.userData.aspectRatio = aspectRatio
      scene.add(planeMesh)
      this.planes.push(planeMesh)
    })
  }

  getPlaneLabelData(planeDefinition, index) {
    const fallback = {
      word: `tone ${String(index + 1).padStart(2, '0')}`,
      title: 'Artwork title',
      year: '2026',
      materials: 'Materials',
      pms: 'N/A',
      color: '',
    }
    const label = planeDefinition.label || fallback

    return {
      word: label.word || fallback.word,
      title: label.title || fallback.title,
      year: label.year || fallback.year,
      materials: label.materials || fallback.materials,
      pms: label.pms || fallback.pms,
      color: label.color || fallback.color,
    }
  }

  updatePlaneScale() {
    const isMobileViewport = window.innerWidth <= this.mobileBreakpoint
    const scale = isMobileViewport ? this.mobilePlaneScale : this.desktopPlaneScale

    this.planes.forEach((plane) => {
      const aspectRatio = plane.userData.aspectRatio || 1
      plane.scale.set(scale * aspectRatio, scale, 1)
    })
  }

  layoutPlanes() {
    const xSpreadFactor = this.getXSpreadFactor()

    this.planes.forEach((plane, index) => {
      const basePosition = plane.userData.basePosition || { x: 0, y: 0 }
      const xPosition = basePosition.x * xSpreadFactor
      plane.position.set(xPosition, basePosition.y, -index * this.planeGap)
    })
  }

  getXSpreadFactor() {
    const isMobileViewport = window.innerWidth <= this.mobileBreakpoint
    return isMobileViewport ? this.mobileXSpreadFactor : 1
  }

  getDepthRange() {
    if (!this.planes.length) {
      return { nearestZ: 0, deepestZ: 0 }
    }

    const zPositions = this.planes.map((plane) => plane.position.z)
    return {
      nearestZ: Math.max(...zPositions),
      deepestZ: Math.min(...zPositions),
    }
  }

  getDepthProgress(cameraZ) {
    const { nearestZ, deepestZ } = this.getDepthRange()
    const depthSpan = nearestZ - deepestZ
    if (depthSpan <= 0) return 0

    return THREE.MathUtils.clamp((nearestZ - cameraZ) / depthSpan, 0, 1)
  }

  /**
   * 0 = camera at farthest (scroll start), 1 = at deepest scroll stop.
   * Uses Scroll bounds when available so the range matches the real journey.
   */
  getScrollTravelProgress(cameraZ, scroll) {
    if (
      scroll &&
      Number.isFinite(scroll.minCameraZ) &&
      Number.isFinite(scroll.maxCameraZ)
    ) {
      const span = scroll.maxCameraZ - scroll.minCameraZ
      if (span > 1e-6) {
        return THREE.MathUtils.clamp(
          (scroll.maxCameraZ - cameraZ) / span,
          0,
          1,
        )
      }
    }
    return this.getDepthProgress(cameraZ)
  }

  getBaseDistortionDepthFactor(cameraZ, scroll) {
    const p = this.getScrollTravelProgress(cameraZ, scroll)
    return THREE.MathUtils.smoothstep(
      p,
      this.baseDistortionDepthRampStart,
      this.baseDistortionDepthRampEnd,
    )
  }

  getActivePlaneIndex(cameraZ) {
    if (!this.planes.length) return -1

    let closestPlaneIndex = 0
    let smallestDistance = Infinity

    this.planes.forEach((plane, index) => {
      const distanceToPlane = Math.abs(cameraZ - plane.position.z)
      if (distanceToPlane < smallestDistance) {
        smallestDistance = distanceToPlane
        closestPlaneIndex = index
      }
    })

    return closestPlaneIndex
  }

  getMoodColorsByIndex(index) {
    if (index < 0 || index >= this.planes.length) return null

    const { backgroundColor, blob1Color, blob2Color } = this.planes[index].userData
    if (!backgroundColor) return null

    return { background: backgroundColor, blob1: blob1Color, blob2: blob2Color }
  }

  getMoodBlendData(cameraZ) {
    if (!this.planes.length) return null

    const safeCameraZ = Number.isFinite(cameraZ) ? cameraZ : this.planes[0].position.z
    const moodSampleZ = safeCameraZ - this.planeGap * this.moodSampleOffset
    const lastPlaneIndex = this.planes.length - 1

    if (lastPlaneIndex === 0 || this.planeGap <= 0) {
      const singleMood = this.getMoodColorsByIndex(0)
      if (!singleMood) return null

      return {
        currentMood: singleMood,
        nextMood: singleMood,
        blend: 0,
      }
    }

    const firstPlaneZ = this.planes[0].position.z
    const normalizedDepth = THREE.MathUtils.clamp(
      (firstPlaneZ - moodSampleZ) / this.planeGap,
      0,
      lastPlaneIndex
    )
    const currentPlaneIndex = Math.floor(normalizedDepth)
    const nextPlaneIndex = Math.min(currentPlaneIndex + 1, lastPlaneIndex)
    const blend = normalizedDepth - currentPlaneIndex

    const currentMood = this.getMoodColorsByIndex(currentPlaneIndex)
    const nextMood = this.getMoodColorsByIndex(nextPlaneIndex) || currentMood
    if (!currentMood || !nextMood) return null

    return {
      currentMood,
      nextMood,
      blend,
    }
  }

  getPassageDataForPlane(planeIndex, blendData) {
    if (!blendData) return { strength: 0, enterPhase: 0 }

    const {
      currentPlaneIndex,
      nextPlaneIndex,
      blend,
    } = blendData

    if (currentPlaneIndex === nextPlaneIndex) return { strength: 0, enterPhase: 0 }

    let exitRaw = 0
    if (planeIndex === currentPlaneIndex) {
      const b = THREE.MathUtils.clamp(blend, 0, 1)
      if (b > this.passageExitBlendStart) {
        const span = Math.max(1 - this.passageExitBlendStart, 1e-6)
        const u = (b - this.passageExitBlendStart) / span
        exitRaw = Math.pow(THREE.MathUtils.clamp(u, 0, 1), this.passageExitCurvePower)
      }
    }

    let enterRaw = 0
    if (planeIndex === nextPlaneIndex && this.passageEnterMax > 0) {
      const span = Math.max(this.passageEnterFadeSpan, 1e-6)
      const b = THREE.MathUtils.clamp(blend, 0, 1)
      const incoming = THREE.MathUtils.clamp((span - b) / span, 0, 1)
      enterRaw = Math.pow(incoming, this.passageEnterCurvePower) * this.passageEnterMax
    }

    const raw = exitRaw + enterRaw
    const strength = THREE.MathUtils.clamp(raw * this.passageMaxStrength, 0, 1)
    const enterPhase = enterRaw > exitRaw ? 1 : 0

    return { strength, enterPhase }
  }

  getPlaneBlendData(cameraZ) {
    if (!this.planes.length) return null

    const planeGap = Math.max(this.planeGap, 0.0001)
    const firstPlaneZ = this.planes[0].position.z
    const lastPlaneIndex = this.planes.length - 1
    const sampledCameraZ = cameraZ - planeGap * this.planeFadeSampleOffset
    const normalizedDepth = THREE.MathUtils.clamp(
      (firstPlaneZ - sampledCameraZ) / planeGap,
      0,
      lastPlaneIndex
    )
    const currentPlaneIndex = Math.floor(normalizedDepth)
    const nextPlaneIndex = Math.min(currentPlaneIndex + 1, lastPlaneIndex)
    const blend = normalizedDepth - currentPlaneIndex

    return {
      currentPlaneIndex,
      nextPlaneIndex,
      blend,
    }
  }

  getActiveMoodColors(cameraZ) {
    const moodBlendData = this.getMoodBlendData(cameraZ)
    return moodBlendData?.currentMood || null
  }

  getTextureSources() {
    const textureSources = this.planeConfig
      .map((planeDefinition) => planeDefinition.textureSrc)
      .filter(Boolean)

    return [...new Set(textureSources)]
  }

  setPreloadedTextures(texturesBySource) {
    this.texturesBySource = texturesBySource instanceof Map ? texturesBySource : new Map()
  }

  updatePlaneMaterialMode() {
    this.planes.forEach((plane) => {
      const texture = plane.userData.texture || null
      const hasTexture = Boolean(texture)
      const planeMaterial = plane.material

      planeMaterial.uniforms.uTexture.value = this.useTextures && hasTexture
        ? texture
        : this.fallbackTexture

      if (this.useTextures && hasTexture) {
        planeMaterial.uniforms.uBaseColor.value.set(1, 1, 1)
      } else {
        this.scratchBaseColor.set(plane.userData.baseColor || '#ffffff')
        planeMaterial.uniforms.uBaseColor.value.set(
          this.scratchBaseColor.r,
          this.scratchBaseColor.g,
          this.scratchBaseColor.b,
        )
      }
    })
  }

  setResolution(renderer) {
    if (!renderer?.getDrawingBufferSize || !this.planes.length) return

    renderer.getDrawingBufferSize(this.drawingBufferSize)
    const w = this.drawingBufferSize.x
    const h = this.drawingBufferSize.y

    this.planes.forEach((plane) => {
      plane.material.uniforms.uResolution.value.set(w, h)
    })
  }

  bindDebug() {
    if (!this.debug || this.isDebugBound) return

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'planeGap',
      label: 'Gap',
      options: {
        min: 0.4,
        max: 10,
        step: 0.1,
      },
      onChange: () => {
        this.layoutPlanes()
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'useTextures',
      label: 'Use Textures',
      onChange: () => {
        this.updatePlaneMaterialMode()
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'moodSampleOffset',
      label: 'Mood Offset',
      options: {
        min: 0,
        max: 1.5,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'baseDistortionStrength',
      label: 'Base distort',
      options: {
        min: 0,
        max: 1,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'baseLightStrength',
      label: 'Base light',
      options: {
        min: 0,
        max: 1,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'baseDistortionDepthRampStart',
      label: 'Base ramp start',
      options: {
        min: 0,
        max: 1,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'baseDistortionDepthRampEnd',
      label: 'Base ramp end',
      options: {
        min: 0,
        max: 1,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'parallaxEnabled',
      label: 'Plane Parallax',
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'parallaxAmountX',
      label: 'Parallax X',
      options: {
        min: 0,
        max: 0.5,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'parallaxAmountY',
      label: 'Parallax Y',
      options: {
        min: 0,
        max: 0.3,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'gestureParallaxEnabled',
      label: 'Gesture Parallax',
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'gestureParallaxAmountY',
      label: 'Gesture Y',
      options: {
        min: 0,
        max: 0.5,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'breathEnabled',
      label: 'Plane Breath',
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'breathTiltAmount',
      label: 'Breath Tilt',
      options: {
        min: 0,
        max: 0.2,
        step: 0.005,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery',
      targetObject: this,
      property: 'breathScaleAmount',
      label: 'Breath Scale',
      options: {
        min: 0,
        max: 0.1,
        step: 0.001,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery passage',
      targetObject: this,
      property: 'passageMaxStrength',
      label: 'Max strength',
      options: {
        min: 0,
        max: 2,
        step: 0.05,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery passage',
      targetObject: this,
      property: 'passageExitBlendStart',
      label: 'Exit blend start',
      options: {
        min: 0,
        max: 0.95,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery passage',
      targetObject: this,
      property: 'passageExitCurvePower',
      label: 'Exit curve pow',
      options: {
        min: 0.5,
        max: 4,
        step: 0.05,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery passage',
      targetObject: this,
      property: 'passageEnterMax',
      label: 'Enter max',
      options: {
        min: 0,
        max: 1,
        step: 0.02,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery passage',
      targetObject: this,
      property: 'passageEnterFadeSpan',
      label: 'Enter fade span',
      options: {
        min: 0.05,
        max: 1,
        step: 0.01,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery passage',
      targetObject: this,
      property: 'passageEnterCurvePower',
      label: 'Enter curve pow',
      options: {
        min: 0.5,
        max: 4,
        step: 0.05,
      },
    })

    this.debug.addBinding({
      folderTitle: 'Gallery passage',
      targetObject: this,
      property: 'passageChromaMultiply',
      label: 'Chroma multiply',
      options: {
        min: 0,
        max: 3,
        step: 0.05,
      },
    })

    this.isDebugBound = true
  }

  updatePlaneVisibility(cameraZ) {
    const blendData = this.getPlaneBlendData(cameraZ)
    if (!blendData) return

    const { currentPlaneIndex, nextPlaneIndex, blend } = blendData

    this.planes.forEach((plane, index) => {
      let targetOpacity = 0

      if (index === currentPlaneIndex) {
        targetOpacity = 1 - blend
      }
      if (index === nextPlaneIndex) {
        targetOpacity = Math.max(targetOpacity, blend)
      }

      const currentOpacity = Number.isFinite(plane.material.opacity) ? plane.material.opacity : 0
      plane.material.opacity = THREE.MathUtils.lerp(
        currentOpacity,
        targetOpacity,
        this.planeFadeSmoothing
      )
      plane.material.uniforms.opacity.value = plane.material.opacity
    })
  }

  bindPointerEvents() {
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerleave', this.onPointerLeave, { passive: true })
  }

  updatePlaneMotion(scroll = null) {
    // Smooth pointer toward target
    this.pointerCurrent.lerp(this.pointerTarget, this.parallaxSmoothing)

    // Velocity → breath + drift
    const velocityMax = Math.max(scroll?.velocityMax || 1, 0.0001)
    const velocityNormalized = THREE.MathUtils.clamp(
      Math.abs(scroll?.velocity || 0) / velocityMax,
      0,
      1
    )
    const scrollDrift = THREE.MathUtils.clamp((scroll?.velocity || 0) / velocityMax, -1, 1)
    this.targetBreathIntensity = this.breathEnabled
      ? THREE.MathUtils.clamp(velocityNormalized * this.breathGain, 0, 1)
      : 0
    this.breathIntensity = THREE.MathUtils.lerp(
      this.breathIntensity,
      this.targetBreathIntensity,
      this.breathSmoothing
    )
    this.driftTarget = this.gestureParallaxEnabled ? scrollDrift : 0
    this.driftCurrent = THREE.MathUtils.lerp(
      this.driftCurrent,
      this.driftTarget,
      this.gestureParallaxSmoothing
    )

    // Per-plane: position, rotation, scale
    const xSpreadFactor = this.getXSpreadFactor()

    this.planes.forEach((plane, index) => {
      const basePosition = plane.userData.basePosition || { x: 0, y: 0 }
      const xPosition = basePosition.x * xSpreadFactor
      const yPosition = basePosition.y
      const zPosition = -index * this.planeGap
      const opacity = Number.isFinite(plane.material.opacity) ? plane.material.opacity : 0
      const depthInfluence = 1 + index * 0.05
      const parallaxInfluence = this.parallaxEnabled ? opacity * depthInfluence : 0

      const parallaxOffsetX = this.pointerCurrent.x * this.parallaxAmountX * parallaxInfluence
      const parallaxOffsetY = this.pointerCurrent.y * this.parallaxAmountY * parallaxInfluence
      const gestureOffsetY = this.driftCurrent * this.gestureParallaxAmountY

      plane.position.x = xPosition + parallaxOffsetX
      plane.position.y = yPosition + parallaxOffsetY + gestureOffsetY
      plane.position.z = zPosition

      const breathInfluence = this.breathEnabled ? this.breathIntensity * opacity : 0
      const tiltX = -this.pointerCurrent.y * this.breathTiltAmount * breathInfluence
      const tiltY = this.pointerCurrent.x * this.breathTiltAmount * breathInfluence
      plane.rotation.x = tiltX
      plane.rotation.y = tiltY
      plane.rotation.z = 0

      const aspectRatio = plane.userData.aspectRatio || 1
      const baseScale =
        window.innerWidth <= this.mobileBreakpoint ? this.mobilePlaneScale : this.desktopPlaneScale
      const scalePulse = 1 + this.breathScaleAmount * breathInfluence
      plane.scale.x = baseScale * aspectRatio * scalePulse
      plane.scale.y = baseScale * scalePulse
      plane.scale.z = 1
    })
  }

  update(camera = null, scroll = null, time = 0) {
    if (!camera) return
    const cameraZ = camera.position.z
    this.updatePlaneVisibility(cameraZ)
    this.updatePlaneMotion(scroll)

    const blendData = this.getPlaneBlendData(cameraZ)
    const baseByDepth = this.getBaseDistortionDepthFactor(cameraZ, scroll)
    const tSec = Number.isFinite(time) ? time * 0.001 : 0
    this.planes.forEach((plane, index) => {
      const planeMaterial = plane.material
      planeMaterial.uniforms.uTime.value = tSec
      planeMaterial.uniforms.uPlaneAspect.value = plane.scale.x / plane.scale.y
      planeMaterial.uniforms.opacity.value = planeMaterial.opacity
      const passage = this.getPassageDataForPlane(index, blendData)
      planeMaterial.uniforms.uPassageStrength.value = passage.strength
      planeMaterial.uniforms.uPassageEnterPhase.value = passage.enterPhase
      planeMaterial.uniforms.uPassageChromaMultiply.value = this.passageChromaMultiply
      planeMaterial.uniforms.uBaseDistortionStrength.value =
        this.baseDistortionStrength * baseByDepth
      planeMaterial.uniforms.uBaseLightStrength.value =
        this.baseLightStrength * baseByDepth
    })
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerleave', this.onPointerLeave)
    /** @type {Set<THREE.BufferGeometry>} */
    const geometries = new Set()
    for (const planeMesh of this.planes) {
      planeMesh.removeFromParent()
      if (planeMesh.geometry) geometries.add(planeMesh.geometry)
      const mat = planeMesh.material
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose())
      } else {
        mat?.dispose()
      }
    }
    geometries.forEach((g) => g.dispose())
    this.planes = []
    this.fallbackTexture?.dispose()
  }
}

