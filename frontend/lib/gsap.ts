'use client'

import {useGSAP} from '@gsap/react'
import {gsap} from 'gsap'
import {Draggable} from 'gsap/Draggable'
import {Flip} from 'gsap/Flip'
import {ScrollSmoother} from 'gsap/ScrollSmoother'
import {ScrollToPlugin} from 'gsap/ScrollToPlugin'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {SplitText} from 'gsap/SplitText'

gsap.registerPlugin(
  useGSAP,
  Draggable,
  Flip,
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  SplitText,
)

export {Draggable, Flip, gsap, ScrollSmoother, ScrollToPlugin, ScrollTrigger, SplitText, useGSAP}
