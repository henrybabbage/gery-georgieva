import {defineField, defineType} from 'sanity'

import {imageSizeOverrideOptions} from '../constants/imageSizeOverrideOptions'

export const sanityImageAsset = defineType({
  name: 'sanity.imageAsset',
  title: 'Image Asset',
  type: 'document',
  fields: [
    defineField({
      name: 'sizeOverride',
      title: 'Size override',
      type: 'string',
      options: {
        list: imageSizeOverrideOptions,
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
  ],
})
