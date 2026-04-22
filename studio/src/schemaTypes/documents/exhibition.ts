import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {Asterisk} from '@phosphor-icons/react'
import {previewMediaFromFirstGalleryItem} from '../lib/galleryPreviewMedia'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  icon: Asterisk,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'exhibition', hidden: true}),
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
      name: 'installationImages',
      title: 'Installation Images',
      type: 'array',
      of: [
        {type: 'mediaImage'},
        {type: 'mediaVideoFile'},
        {type: 'mediaVideoLink'},
      ],
      options: {layout: 'grid'},
    }),
    defineField({name: 'venue', title: 'Venue', type: 'string'}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'startDate', title: 'Start Date', type: 'date'}),
    defineField({name: 'endDate', title: 'End Date', type: 'date'}),
    defineField({
      name: 'exhibitionType',
      title: 'Exhibition Type',
      type: 'string',
      options: {
        list: [
          {title: 'Solo', value: 'solo'},
          {title: 'Group', value: 'group'},
          {title: 'Duo', value: 'duo'},
          {title: 'Institutional', value: 'institutional'},
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
      name: 'relatedWorks',
      title: 'Related Works',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'work'}]}],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'externalDocumentationLink',
      title: 'External Documentation Link',
      type: 'url',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      venue: 'venue',
      year: 'year',
      installationImages: 'installationImages',
    },
    prepare({title, venue, year, installationImages}): PreviewValue {
      const media = previewMediaFromFirstGalleryItem(
        installationImages?.[0],
        Asterisk,
      )
      return {
        title,
        subtitle: [venue, year].filter(Boolean).join(' — '),
        media: media as PreviewValue['media'],
      }
    },
  },
})
