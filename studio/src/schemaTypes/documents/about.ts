import {UserCircle} from '@phosphor-icons/react'
import {defineArrayMember, defineField, defineType} from 'sanity'

/** Same values as `cvEntry.category` — keep in sync. */
const CV_SECTION_LIST = [
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
] as const

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
            list: [...CV_SECTION_LIST],
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
  ],
  preview: {
    prepare() {
      return {title: 'About'}
    },
  },
})
