import {defineField, defineType} from 'sanity'

import {imageSizeOverrideOptions} from '../constants/imageSizeOverrideOptions'

export const mediaImage = defineType({
  name: 'mediaImage',
  title: 'Image',
  description: 'Still image with optional size override, caption, and credit.',
  type: 'image',
  options: {hotspot: true},
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
    defineField({
      name: 'isAudiencePhoto',
      title: 'Audience Photo',
      type: 'boolean',
      description:
        'Mark if this is an audience/vernissage photo, not official ' +
        'documentation.',
      initialValue: false,
    }),
    defineField({name: 'caption', title: 'Caption', type: 'text', rows: 2}),
    defineField({name: 'credit', title: 'Photo Credit', type: 'string'}),
  ],
})
