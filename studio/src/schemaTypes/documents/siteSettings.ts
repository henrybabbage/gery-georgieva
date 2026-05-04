import {GearSix} from '@phosphor-icons/react'
import type {ReferenceOptions} from '@sanity/types'
import {defineArrayMember, defineField, defineType} from 'sanity'

const homepageCarouselRefSearchOptions = {
  sort: [
    {field: 'year', direction: 'desc' as const},
    {field: 'title', direction: 'asc' as const},
  ],
} as unknown as ReferenceOptions

type HomepageCarouselItem = {_ref?: string} | null | undefined

function homepageCarouselUniqueRefs(items: HomepageCarouselItem[] | undefined): true | string {
  if (!items?.length) {
    return true
  }
  const refs = items
    .map((item) => item?._ref)
    .filter((ref): ref is string => typeof ref === 'string' && ref.length > 0)
  if (refs.length !== new Set(refs).size) {
    return 'Each work or exhibition can only appear once in the carousel'
  }
  return true
}

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
        'homepage. Works need a primary exhibition and image (carousel, first gallery still, ' +
        'and/or cover). Exhibitions need a carousel image and/or at least one installation image.',
      type: 'array',
      validation: (Rule) =>
        Rule.custom((items: HomepageCarouselItem[] | undefined) =>
          homepageCarouselUniqueRefs(items),
        ),
      of: [
        defineArrayMember({
          name: 'homepageCarouselWork',
          title: 'Work',
          type: 'reference',
          to: [{type: 'work'}],
          options: homepageCarouselRefSearchOptions,
        }),
        defineArrayMember({
          name: 'homepageCarouselExhibition',
          title: 'Exhibition',
          type: 'reference',
          to: [{type: 'exhibition'}],
          options: homepageCarouselRefSearchOptions,
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
