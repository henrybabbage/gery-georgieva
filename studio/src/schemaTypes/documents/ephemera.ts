import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {FlowerTulip} from '@phosphor-icons/react'

export const ephemera = defineType({
  name: 'ephemera',
  title: 'Ephemera',
  type: 'document',
  icon: FlowerTulip,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'ephemera', hidden: true}),
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
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'mediaItem'}],
    }),
    defineField({
      name: 'media',
      title: 'Media (deprecated)',
      type: 'array',
      of: [{type: 'mediaItem'}],
      hidden: true,
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
    select: {
      title: 'title',
      category: 'category',
      images: 'images',
    },
    prepare({title, category, images}) {
      const media = images?.[0]
      return {
        title,
        subtitle: category,
        media: media || FlowerTulip,
      }
    },
  },
})
