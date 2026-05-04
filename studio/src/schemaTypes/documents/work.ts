import {Spiral} from '@phosphor-icons/react'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {defineField, defineType} from 'sanity'

import {imageSizeOverrideOptions} from '../constants/imageSizeOverrideOptions'
import {yearDescOrdering} from '../shared/yearDescOrdering'

export const work = defineType({
  name: 'work',
  title: 'Work',
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
      description:
        'When on, there is no live /work/… URL, this work does not appear on the Work grid ' +
        'or the homepage carousel, and direct URLs 404 unless preview/draft is enabled.',
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
    select: {title: 'title', year: 'year', media: 'coverImage'},
    prepare({title, year, media}) {
      return {
        title,
        subtitle: String(year ?? ''),
        media: media || Spiral,
      }
    },
  },
})
