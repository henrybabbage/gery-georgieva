import {mediaImage} from './objects/mediaImage'
import {mediaVideoFile} from './objects/mediaVideoFile'
import {mediaVideoLink} from './objects/mediaVideoLink'
import {work} from './documents/work'
import {ephemera} from './documents/ephemera'
import {exhibition} from './documents/exhibition'
import {cvEntry} from './documents/cvEntry'
import {sanityImageAsset} from './documents/sanityImageAsset'

import {siteSettings} from './documents/siteSettings'
import {about} from './documents/about'
import {press} from './documents/press'

export const schemaTypes = [
  siteSettings,
  about,
  mediaImage,
  mediaVideoFile,
  mediaVideoLink,
  work,
  ephemera,
  exhibition,
  cvEntry,
  press,
  sanityImageAsset,
]
