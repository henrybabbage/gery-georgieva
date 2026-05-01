import {Newspaper} from '@phosphor-icons/react'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

type PressDoc = {
  linkText?: string
  url?: string
  pdf?: {_type?: string; asset?: {_ref?: string}}
}

export const press = defineType({
  name: 'press',
  title: 'Press',
  type: 'document',
  icon: Newspaper,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({type: 'press', hidden: true}),
    defineField({
      name: 'linkText',
      title: 'Link label',
      type: 'string',
      description: 'Text shown on the site. Use specific titles, not generic phrases.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Article or page — https only. Leave empty if you upload a PDF instead.',
      validation: (Rule) =>
        Rule.custom((value: string | undefined) => {
          if (!value || !value.trim()) {
            return true
          }
          try {
            const u = new URL(value)
            if (u.protocol !== 'http:' && u.protocol !== 'https:') {
              return 'Use http or https'
            }
            return true
          } catch {
            return 'Invalid URL'
          }
        }),
    }),
    defineField({
      name: 'pdf',
      title: 'PDF',
      type: 'file',
      description: 'Upload a PDF instead of a URL. Use one or the other.',
      options: {
        accept: 'application/pdf',
      },
    }),
  ],
  preview: {
    select: {linkText: 'linkText', url: 'url', pdf: 'pdf'},
    prepare({linkText, url, pdf}): PreviewValue {
      const hasPdf = Boolean(
        pdf &&
        typeof pdf === 'object' &&
        'asset' in pdf &&
        pdf.asset &&
        typeof pdf.asset === 'object' &&
        '_ref' in pdf.asset &&
        pdf.asset._ref,
      )
      const subtitle =
        hasPdf && !url
          ? 'PDF'
          : typeof url === 'string'
            ? url.length > 64
              ? `${url.slice(0, 61)}…`
              : url
            : hasPdf
              ? 'PDF'
              : ''
      return {
        title: linkText || 'Press link',
        subtitle,
        media: Newspaper,
      }
    },
  },
  validation: (Rule) =>
    Rule.custom((doc) => {
      const d = doc as PressDoc | undefined
      const hasUrl = typeof d?.url === 'string' && d.url.trim().length > 0
      const hasPdf = Boolean(d?.pdf?.asset?._ref)
      if (hasUrl && hasPdf) {
        return 'Use either a URL or a PDF, not both'
      }
      if (!hasUrl && !hasPdf) {
        return 'Add a URL or upload a PDF'
      }
      return true
    }),
})
