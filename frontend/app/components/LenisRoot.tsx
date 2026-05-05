'use client'

import type {ReactNode} from 'react'

import {ReactLenis} from 'lenis/react'

import {lenisOptions} from '@/lib/LenisConfig'

export default function LenisRoot({children}: {children: ReactNode}) {
  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  )
}
