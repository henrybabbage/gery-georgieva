import {ListDashes} from '@phosphor-icons/react'
import {defineField, defineType} from 'sanity'

import {CV_CATEGORY_OPTIONS} from '../constants/cvCategoryOptions'

function categoryPreviewTitle(category: string | undefined) {
  if (!category) return ''
  const found = CV_CATEGORY_OPTIONS.find((o) => o.value === category)
  return found?.title ?? category
}

export const cvEntry = defineType({
  name: 'cvEntry',
  title: 'CV Entry',
  type: 'document',
  icon: ListDashes,
  orderings: [
    {
      title: 'Year, newest first',
      name: 'yearDesc',
      by: [{field: 'year', direction: 'desc'}],
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title / Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [...CV_CATEGORY_OPTIONS],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'role', title: 'Role / Degree', type: 'string'}),
    defineField({name: 'institution', title: 'Institution / Venue', type: 'string'}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'description', title: 'Notes', type: 'text', rows: 2}),
    defineField({
      name: 'internalRef',
      title: 'Internal Link',
      type: 'reference',
      description: 'Link to an exhibition page if applicable.',
      to: [{type: 'exhibition'}],
    }),
  ],
  preview: {
    select: {title: 'title', year: 'year', category: 'category'},
    prepare({title, year, category}) {
      return {
        title,
        subtitle: `${year} — ${categoryPreviewTitle(category)}`,
        media: ListDashes,
      }
    },
  },
})
