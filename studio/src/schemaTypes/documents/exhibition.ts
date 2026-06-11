import {Asterisk} from '@phosphor-icons/react'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import type {Image, PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

import {yearDescOrdering} from '../shared/yearDescOrdering'

type ExhibitionPreviewInput = {
  title?: string
  venue?: string
  year?: number
  carouselImage?: unknown
  installationImages?: unknown[]
  hidePublicPage?: boolean
}

function prepareExhibitionPreview({
  title,
  venue,
  year,
  carouselImage,
  installationImages,
  hidePublicPage,
}: ExhibitionPreviewInput): PreviewValue {
  const raw =
    carouselImage && typeof carouselImage === 'object' && '_type' in carouselImage
      ? carouselImage
      : installationImages?.[0]
  const media =
    raw && typeof raw === 'object' && '_type' in raw && raw._type === 'mediaImage'
      ? (raw as Image)
      : Asterisk
  const visibility = hidePublicPage === true ? 'Hidden' : 'Live'
  const yearStr = year != null ? String(year) : ''
  const venueStr = venue ? String(venue) : ''
  const parts = [venueStr, yearStr, visibility].filter((part) => part !== '')
  return {
    title,
    subtitle: parts.join(' - '),
    media: media as PreviewValue['media'],
  }
}

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
      title: 'Visibility: hide public page',
      type: 'boolean',
      description:
        'Off = Live: eligible for /work and public links. ' +
        'On = Hidden: omitted from public listings and links, and direct URLs 404 outside draft mode.',
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
      name: 'showHomepageYear',
      title: 'Show year on homepage carousel',
      type: 'boolean',
      description:
        'When on, homepage carousel labels show this exhibition year beneath the title. Other exhibition titles stay unchanged.',
      initialValue: false,
    }),
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
      name: 'supportText',
      title: 'Support Text',
      type: 'array',
      description:
        'Optional acknowledgements or support copy shown after the exhibition description.',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'supportLogos',
      title: 'Support Logos',
      type: 'array',
      description: 'Optional supporter or partner logos shown after the support text.',
      of: [{type: 'image'}],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'showMediaIndexList',
      title: 'Show media index list',
      type: 'boolean',
      description:
        'When on, show a numbered list of installation media captions and credits after the exhibition text.',
      initialValue: false,
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
      hidePublicPage: 'hidePublicPage',
    },
    prepare: prepareExhibitionPreview,
  },
})
