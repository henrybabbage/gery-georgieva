import {PlayIcon} from '@sanity/icons'
import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

type MediaVideoLinkParent = {
  provider?: string
  vimeo?: {_type?: string; asset?: {_ref?: string}}
  youtube?: {id?: string}
}

export const mediaVideoLink = defineType({
  name: 'mediaVideoLink',
  title: 'Video link',
  type: 'object',
  validation: (Rule) =>
    Rule.custom((item: MediaVideoLinkParent | undefined) => {
      const p = item?.provider
      if (!p) {
        return 'Choose Vimeo or YouTube'
      }
      if (p === 'vimeo') {
        if (!item?.vimeo?.asset?._ref) {
          return 'Select a Vimeo video'
        }
        return true
      }
      if (p === 'youtube') {
        if (!item?.youtube?.id) {
          return 'Add a YouTube video'
        }
        return true
      }
      return true
    }),
  fields: [
    defineField({
      name: 'provider',
      title: 'Video service',
      type: 'string',
      description: 'Choose where this video is hosted. Only the matching field is shown below.',
      options: {
        list: [
          {title: 'Vimeo', value: 'vimeo'},
          {title: 'YouTube', value: 'youtube'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'vimeo',
      title: 'Vimeo',
      type: 'vimeo',
      hidden: ({parent}: {parent: MediaVideoLinkParent}) =>
        parent?.provider !== 'vimeo',
    }),
    defineField({
      name: 'youtube',
      title: 'YouTube',
      type: 'youtubeVideo',
      hidden: ({parent}: {parent: MediaVideoLinkParent}) =>
        parent?.provider !== 'youtube',
    }),
    defineField({name: 'caption', title: 'Caption', type: 'text', rows: 2}),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
  ],
  preview: {
    select: {provider: 'provider', caption: 'caption', credit: 'credit'},
    prepare({provider, caption, credit}): PreviewValue {
      const fallback =
        provider === 'vimeo'
          ? 'Vimeo'
          : provider === 'youtube'
            ? 'YouTube'
            : 'Video link'
      return {
        title: (caption as string | undefined)?.trim() || fallback,
        subtitle: credit,
        media: PlayIcon,
      }
    },
  },
})
