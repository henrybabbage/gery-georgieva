import {defineField, defineType} from 'sanity'

import {imageSizeOverrideOptions} from '../constants/imageSizeOverrideOptions'

export const sanityImageAsset = defineType({
  name: 'sanity.imageAsset',
  title: 'Image Asset',
  type: 'document',
  fields: [
    defineField({
      name: 'sizeOverride',
      title: 'Size Override',
      type: 'string',
      description:
        'Optional default display size for this asset. Per-placement overrides in galleries take precedence.',
      options: {
        list: imageSizeOverrideOptions,
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
  ],
})
