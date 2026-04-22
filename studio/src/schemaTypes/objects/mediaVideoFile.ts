import {PlayIcon} from '@sanity/icons'
import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

export const mediaVideoFile = defineType({
  name: 'mediaVideoFile',
  title: 'Video file',
  type: 'file',
  options: {
    accept: 'video/*',
  },
  fields: [
    defineField({name: 'caption', title: 'Caption', type: 'text', rows: 2}),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
  ],
  preview: {
    select: {caption: 'caption', credit: 'credit'},
    prepare({caption, credit}): PreviewValue {
      return {
        title: (caption as string | undefined)?.trim() || 'Video file',
        subtitle: credit,
        media: PlayIcon,
      }
    },
  },
})
