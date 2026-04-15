import {defineField, defineType} from 'sanity'

export const work = defineType({
  name: 'work',
  title: 'Work',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(1900).max(2100),
    }),
    defineField({name: 'medium', title: 'Medium', type: 'string'}),
    defineField({name: 'dimensions', title: 'Dimensions', type: 'string'}),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'isFeature',
      title: 'Featured',
      type: 'boolean',
      description: 'Pin this work to the top of the grid.',
      initialValue: false,
    }),
    defineField({
      name: 'layoutSize',
      title: 'Layout Size',
      type: 'string',
      description: 'Controls tile width in the Tillmans grid.',
      options: {
        list: [
          {title: 'Full width', value: 'full'},
          {title: 'Half width', value: 'half'},
          {title: 'Float', value: 'float'},
        ],
      },
      initialValue: 'half',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [{type: 'mediaItem'}],
    }),
    defineField({
      name: 'relatedEphemera',
      title: 'Related Ephemera',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'ephemera'}]}],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
  ],
  preview: {
    select: {title: 'title', year: 'year', media: 'coverImage'},
    prepare({title, year, media}) {
      return {title, subtitle: String(year ?? ''), media}
    },
  },
})
