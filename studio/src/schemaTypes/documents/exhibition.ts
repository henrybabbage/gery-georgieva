import {Asterisk} from '@phosphor-icons/react'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import type {Image, PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

import {yearDescOrdering} from '../shared/yearDescOrdering'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  icon: Asterisk,
  orderings: [yearDescOrdering, orderRankOrdering],
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
      title: 'Hide page',
      type: 'boolean',
      description:
        'When on, there is no live /exhibition/… URL and the site will not link here from CV, work ' +
        'pages (Exhibited in), ephemera, or when this exhibition is a home carousel exhibition ' +
        'slide. Work carousel slides link to the work page, not here. The exhibition can still ' +
        'appear on the CV when linked via Internal Link.',
      initialValue: false,
    }),
    defineField({
      name: 'carouselImage',
      title: 'Homepage carousel image',
      type: 'mediaImage',
      description:
        'Image when this exhibition is added to the homepage carousel in Home. ' +
        'If unset, the first still image in Installation Images is used. Open the field for Size override below the image.',
    }),
    defineField({name: 'year', title: 'Year', type: 'number'}),
    defineField({
      name: 'installationImages',
      title: 'Installation Images',
      description:
        'List layout: click each image/video row to edit. Size override, caption, and credit appear under the image.',
      type: 'array',
      of: [{type: 'mediaImage'}, {type: 'mediaVideoFile'}, {type: 'mediaVideoLink'}],
      options: {layout: 'list'},
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
      name: 'showWorksSection',
      title: 'Show related works on exhibition page',
      type: 'boolean',
      description:
        'Off: the Works grid stays hidden at the bottom of the public exhibition page. On: show it when Related Works has items.',
      initialValue: false,
    }),
    defineField({
      name: 'showEphemeraSection',
      title: 'Show research & ephemera on exhibition page',
      type: 'boolean',
      description:
        'Off: the Research & Ephemera grid stays hidden at the bottom of the public exhibition page. On: show linked ephemera when any exist.',
      initialValue: false,
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
