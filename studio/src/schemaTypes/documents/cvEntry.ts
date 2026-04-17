import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {ListDashes} from '@phosphor-icons/react'

export const cvEntry = defineType({
  name: 'cvEntry',
  title: 'CV Entry',
  type: 'document',
  icon: ListDashes,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'cvEntry', hidden: true}),
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
        list: [
          {title: 'Exhibition', value: 'exhibition'},
          {title: 'Education', value: 'education'},
          {title: 'Award', value: 'award'},
          {title: 'Residency', value: 'residency'},
          {title: 'Publication', value: 'publication'},
          {title: 'Performance', value: 'performance'},
          {title: 'Screening', value: 'screening'},
          {title: 'Commission', value: 'commission'},
          {title: 'Lecture', value: 'lecture'},
          {title: 'Other', value: 'other'},
        ],
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
        subtitle: `${year} — ${category}`,
        media: ListDashes,
      }
    },
  },
})
