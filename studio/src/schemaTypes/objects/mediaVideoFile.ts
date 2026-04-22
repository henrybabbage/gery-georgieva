import {defineField, defineType} from 'sanity'
import {playCirclePreviewMedia} from '../lib/galleryPreviewMedia'

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
      title: 'Poster',
      type: 'image',
      description:
        'Optional still used in Studio and on the site when a thumbnail is needed.',
      options: {hotspot: true},
    }),
    defineField({name: 'caption', title: 'Caption', type: 'text', rows: 2}),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
  ],
  preview: {
    select: {
      caption: 'caption',
      poster: 'poster',
    },
    prepare({caption, poster}) {
      return {
        title: caption?.trim() ? caption : 'Video file',
        media: poster?.asset ? poster : playCirclePreviewMedia(),
      }
    },
  },
})
