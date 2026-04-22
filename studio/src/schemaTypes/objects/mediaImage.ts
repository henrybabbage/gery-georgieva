import {defineField, defineType} from 'sanity'

export const mediaImage = defineType({
  name: 'mediaImage',
  title: 'Image',
  type: 'image',
  options: {hotspot: true},
  fields: [
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
