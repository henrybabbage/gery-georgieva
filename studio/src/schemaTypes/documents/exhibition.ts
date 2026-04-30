import {Asterisk} from '@phosphor-icons/react'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import type {Image, PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

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
    defineField({
      name: 'hidePublicPage',
      title: 'Hide public page',
      type: 'boolean',
      description:
        'When on, there is no live /exhibition/… URL and the site will not link here from CV, works, ephemera, or the home carousel. The exhibition can still appear on the CV when linked via Internal Link.',
      initialValue: false,
    }),
    defineField({
      name: 'carouselImage',
      title: 'Homepage carousel image',
      type: 'mediaImage',
      description:
        'Image when this exhibition is added to the homepage carousel in Site Settings. ' +
        'Optional if installation images include at least one still image.',
    }),
    defineField({name: 'year', title: 'Year', type: 'number'}),
    defineField({
      name: 'installationImages',
      title: 'Installation Images',
      type: 'array',
      of: [{type: 'mediaImage'}, {type: 'mediaVideoFile'}, {type: 'mediaVideoLink'}],
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
      carouselImage: 'carouselImage',
      installationImages: 'installationImages',
    },
    prepare({title, venue, year, carouselImage, installationImages}): PreviewValue {
      const raw =
        carouselImage && typeof carouselImage === 'object' && '_type' in carouselImage
          ? carouselImage
          : installationImages?.[0]
      const media =
        raw && typeof raw === 'object' && '_type' in raw && raw._type === 'mediaImage'
          ? (raw as Image)
          : Asterisk
      return {
        title,
        subtitle: [venue, year].filter(Boolean).join(' — '),
        media: media as PreviewValue['media'],
      }
    },
  },
})
