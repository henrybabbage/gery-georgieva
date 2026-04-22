import {Spiral} from '@phosphor-icons/react'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'
import {previewMediaFromFirstGalleryItem} from '../lib/galleryPreviewMedia'
import {studioFieldScope} from '../lib/studioFieldScope'

export const work = defineType({
  name: 'work',
  title: 'Work',
  type: 'document',
  icon: Spiral,
  orderings: [orderRankOrdering],
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
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(1900).max(2100),
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
      of: [
        {type: 'mediaImage'},
        {type: 'mediaVideoFile'},
        {type: 'mediaVideoLink'},
      ],
      options: {layout: 'grid'},
      components: {field: studioFieldScope('gallery')},
    }),
    defineField({
      name: 'isFeature',
      title: 'Featured',
      type: 'boolean',
    }),
    defineField({name: 'medium', title: 'Medium', type: 'string'}),
    defineField({name: 'dimensions', title: 'Dimensions', type: 'string'}),
    defineField({name: 'duration', title: 'Duration', type: 'string'}),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'URL to the video (e.g., Vimeo, YouTube)',
    }),
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
    select: {title: 'title', year: 'year', coverImage: 'coverImage', gallery: 'gallery'},
    prepare({title, year, coverImage, gallery}): PreviewValue {
      const media = coverImage?.asset
        ? coverImage
        : previewMediaFromFirstGalleryItem(gallery?.[0], Spiral)
      return {
        title,
        subtitle: String(year ?? ''),
        media: media as PreviewValue['media'],
      }
    },
  },
})
