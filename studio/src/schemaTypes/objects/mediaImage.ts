import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

import {imageSizeOverrideOptions} from '../constants/imageSizeOverrideOptions'
import {staggeredGalleryCaptionEmptyWarning} from '../../lib/staggeredGalleryCaptionCreditValidation'

export const mediaImage = defineType({
  name: 'mediaImage',
  title: 'Image',
  description: 'Still image with optional size override, caption, and credit.',
  type: 'image',
  options: {hotspot: true},
  preview: {
    select: {media: 'asset', sizeOverride: 'sizeOverride'},
    prepare({media, sizeOverride}): PreviewValue {
      const raw =
        typeof sizeOverride === 'string' ? sizeOverride.trim() : ''
      const title = raw
        ? `Image: ${raw.toUpperCase()} size set`
        : 'Image: Size not set'
      return {title, media}
    },
  },
  fields: [
    defineField({
      name: 'isAudiencePhoto',
      title: 'Audience Photo',
      type: 'boolean',
      description: 'Mark if this is an audience/vernissage photo, not official ' + 'documentation.',
      initialValue: false,
    }),
    defineField({
      name: 'sizeOverride',
      title: 'Size override',
      type: 'string',
      description:
        'Optional. Overrides the media asset default for this placement only (galleries, etc.). Leave empty to use the asset value.',
      options: {
        list: imageSizeOverrideOptions,
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 2,
      validation: (Rule) =>
        Rule.custom((caption, context) =>
          staggeredGalleryCaptionEmptyWarning(caption, context),
        ),
    }),
    defineField({name: 'credit', title: 'Photo Credit', type: 'string'}),
  ],
})
