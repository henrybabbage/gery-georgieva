'use client'

import {Water, type WaterProps} from '@paper-design/shaders-react'

/** Demo asset used on https://shaders.paper.design/water */
export const PAPER_WATER_SHADER_DEFAULT_IMAGE = 'https://paper.design/flowers.webp'

/**
 * Defaults from the Paper Design Water shader playground
 * (liquid distortion / caustics image filter).
 */
export const paperWaterShaderDefaults = {
  width: 1280,
  height: 720,
  image: PAPER_WATER_SHADER_DEFAULT_IMAGE,
  colorBack: '#8f8f8f',
  colorHighlight: '#ffffff',
  highlights: 0.07,
  layering: 0.45,
  edges: 0.42,
  waves: 0.32,
  caustic: 0.13,
  size: 0.6,
  speed: 1,
  scale: 0.84,
  fit: 'contain',
} as const satisfies Partial<WaterProps>

export type PaperWaterShaderProps = WaterProps

export function PaperWaterShader(props: PaperWaterShaderProps) {
  return <Water {...paperWaterShaderDefaults} {...props} />
}
