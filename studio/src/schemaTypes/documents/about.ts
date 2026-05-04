import {UserCircle} from '@phosphor-icons/react'
import {defineField, defineType} from 'sanity'

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
  ],
  preview: {
    prepare() {
      return {title: 'About'}
    },
  },
})
