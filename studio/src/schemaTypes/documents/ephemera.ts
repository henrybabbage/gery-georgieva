import {defineField, defineType} from 'sanity'

export const ephemera = defineType({
  name: 'ephemera',
  title: 'Ephemera',
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
    defineField({name: 'year', title: 'Year', type: 'number'}),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Research', value: 'research'},
          {title: 'Sketch', value: 'sketch'},
          {title: 'Reference', value: 'reference'},
          {title: 'Documentation', value: 'documentation'},
          {title: 'Correspondence', value: 'correspondence'},
          {title: 'Other', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'array',
      of: [{type: 'mediaItem'}],
    }),
    defineField({
      name: 'layoutSize',
      title: 'Layout Size',
      type: 'string',
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
      name: 'isFeature',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'relatedWork',
      title: 'Related Works',
      description: 'Works this material contributed to',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'work'}]}],
    }),
    defineField({
      name: 'relatedExhibitions',
      title: 'Related Exhibitions',
      description: 'Exhibitions this material contributed to',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'exhibition'}]}],
    }),
  ],
  preview: {
    select: {title: 'title', category: 'category'},
    prepare({title, category}) {
      return {title, subtitle: category}
    },
  },
})
