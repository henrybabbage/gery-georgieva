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
    defineField({
      name: 'poster',
      title: 'Poster image',
      type: 'image',
      description:
        'Optional. Shown on the site before the video plays (HTML video poster). Use a still from ' +
        'the video or a custom frame.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 2,
    }),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
  ],
  preview: {
    select: {caption: 'caption', credit: 'credit', poster: 'poster'},
    prepare({caption, credit, poster}): PreviewValue {
      return {
        title: (caption as string | undefined)?.trim() || 'Video file',
        subtitle: credit,
        media: poster ?? PlayIcon,
      }
    },
  },
})
