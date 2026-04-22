import {defineField, defineType} from 'sanity'

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'object',
  fields: [
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {list: ['image', 'video']},
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}: {parent: {mediaType?: string}}) => parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (Vimeo/YouTube)',
      type: 'url',
      hidden: ({parent}: {parent: {mediaType?: string}}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video File',
      type: 'file',
      hidden: ({parent}: {parent: {mediaType?: string}}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'isAudiencePhoto',
      title: 'Audience Photo',
      type: 'boolean',
      description: 'Mark if this is an audience/vernissage photo, not official documentation.',
      initialValue: false,
    }),
    defineField({name: 'caption', title: 'Caption', type: 'text', rows: 2}),
    defineField({name: 'credit', title: 'Photo Credit', type: 'string'}),
  ],
})
