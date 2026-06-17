import {Spiral} from '@phosphor-icons/react'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

import {imageSizeOverrideOptions} from '../constants/imageSizeOverrideOptions'
import {yearDescOrdering} from '../shared/yearDescOrdering'

type WorkPreviewInput = {
  title?: string
  year?: number
  media?: unknown
  hidePublicPage?: boolean
}

function prepareWorkPreview({
  title,
  year,
  media,
  hidePublicPage,
}: WorkPreviewInput): PreviewValue {
  const visibility = hidePublicPage === true ? 'Hidden' : 'Live'
  const yearStr = year != null ? String(year) : ''
  const subtitle = [visibility, yearStr].filter((part) => part !== '').join(' - ')
  return {
    title,
    subtitle,
    media: (media || Spiral) as PreviewValue['media'],
  }
}

export const work = defineType({
  name: 'work',
  title: 'Legacy Works',
  type: 'document',
  icon: Spiral,
  orderings: [yearDescOrdering, orderRankOrdering],
  fields: [
    orderRankField({type: 'work', hidden: true}),
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
      description: 'Off = Visible\nOn = Hidden',
      initialValue: true,
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(1900).max(2100),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      description:
        'After selecting an image, scroll below the crop/hotspot controls for Size override and other options.',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'sizeOverride',
          title: 'Size override',
          type: 'string',
          options: {
            list: imageSizeOverrideOptions,
            layout: 'radio',
            direction: 'horizontal',
          },
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      description:
        'Use list view: click an image row to open it — Size override, caption, and credit are below the image.',
      type: 'array',
      of: [{type: 'mediaImage'}, {type: 'mediaVideoFile'}, {type: 'mediaVideoLink'}],
      options: {layout: 'list'},
    }),
    defineField({
      name: 'exhibition',
      title: 'Primary exhibition',
      type: 'reference',
      to: [{type: 'exhibition'}],
      description:
        'Used for “Exhibited in” on the work page when set. Homepage carousel slides for ' +
        'this work link to the work page.',
    }),
    defineField({
      name: 'carouselImage',
      title: 'Homepage carousel image',
      type: 'mediaImage',
      description:
        'Image for this work on the homepage carousel. If unset, the first still image in ' +
        'Gallery is used, then Cover Image. Open the field to set Size override below the image.',
    }),
    defineField({
      name: 'showHomepageYear',
      title: 'Show year on homepage carousel',
      type: 'boolean',
      description:
        'When on, homepage carousel labels show this work year beneath the title. Other work titles stay unchanged.',
      initialValue: false,
    }),
    defineField({name: 'medium', title: 'Medium', type: 'string'}),
    defineField({name: 'dimensions', title: 'Dimensions', type: 'string'}),
    defineField({name: 'duration', title: 'Duration', type: 'string'}),
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
        'Compatibility field for legacy public work pages. Prefer exhibition support fields for new exhibition pages.',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'supportLogos',
      title: 'Support Logos',
      type: 'array',
      description:
        'Compatibility field for legacy public work pages. Prefer exhibition support logos for new exhibition pages.',
      of: [{type: 'image'}],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'artistStatement',
      title: 'Artist Statement',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'relatedEphemera',
      title: 'Related Ephemera',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'ephemera'}]}],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'showRelatedResearchSection',
      title: 'Show related research on work page',
      type: 'boolean',
      description:
        'Off: the Related research list stays hidden at the bottom of the public work page. ' +
        'On: show linked ephemera when any exist.',
      initialValue: false,
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'collaborators',
      title: 'Collaborators',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'commissionedBy',
      title: 'Commissioned By',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      year: 'year',
      media: 'coverImage',
      hidePublicPage: 'hidePublicPage',
    },
    prepare: prepareWorkPreview,
  },
})
