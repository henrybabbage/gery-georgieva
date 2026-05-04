import {UserCircle} from '@phosphor-icons/react'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {CV_CATEGORY_OPTIONS} from '../constants/cvCategoryOptions'

export const about = defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  icon: UserCircle,
  fields: [
    defineField({
      name: 'cvFile',
      title: 'CV file',
      type: 'file',
      description:
        'Optional PDF (or other file) for visitors to download. When set, the CV ' +
        'page shows a “CV” link at the top that opens this file.',
      options: {
        accept: 'application/pdf',
      },
    }),
    defineField({
      name: 'cvSectionOrder',
      title: 'CV section order',
      type: 'array',
      description:
        'Drag sections to set the order on the public CV page. Leave empty to use the ' +
        'default order. Categories with entries but not listed here still appear at the end.',
      of: [
        defineArrayMember({
          type: 'string',
          options: {
            list: [...CV_CATEGORY_OPTIONS],
          },
        }),
      ],
      validation: (Rule) =>
        Rule.custom((items: string[] | undefined) => {
          if (!items?.length) {
            return true
          }
          if (items.length !== new Set(items).size) {
            return 'Each section can only appear once'
          }
          return true
        }),
    }),
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description:
        'Default HTML & Open Graph title for the site (homepage and browser tab when a page ' +
        'has no specific title). Leave empty to use “Gery Georgieva”.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description:
        'Default meta description for the site and social previews when a page does not set ' +
        'its own. Leave empty to use “Artist”.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph image',
      type: 'image',
      description:
        'Default social sharing image (e.g. 1200×630). Shown when a page has no specific image.',
      options: {hotspot: true},
    }),
  ],
  preview: {
    prepare() {
      return {title: 'About'}
    },
  },
})
