import {GearSix} from '@phosphor-icons/react'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: GearSix,
  fields: [
    defineField({
      name: 'homepageCarousel',
      title: 'Homepage carousel',
      description:
        'Add works and exhibitions, then drag to order. This list is the full carousel on the ' +
        'homepage. Works need a primary exhibition and image (carousel image and/or cover). ' +
        'Exhibitions need a carousel image and/or at least one installation image.',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'homepageCarouselWork',
          title: 'Work',
          type: 'reference',
          to: [{type: 'work'}],
        }),
        defineArrayMember({
          name: 'homepageCarouselExhibition',
          title: 'Exhibition',
          type: 'reference',
          to: [{type: 'exhibition'}],
        }),
      ],
    }),
  ],
  preview: {
    prepare () {
      return {title: 'Site Settings'}
    },
  },
})
