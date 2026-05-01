import {Newspaper} from '@phosphor-icons/react'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

type PressKind = 'url' | 'pdf' | 'text'

type PressDoc = {
  kind?: PressKind
  linkText?: string
  slug?: {current?: string}
  url?: string
  pdf?: {_type?: string; asset?: {_ref?: string}}
  publishedAt?: string
  publication?: string
  author?: string
  articleImages?: unknown[]
  body?: unknown[]
}

function inferKind(d: PressDoc | undefined): PressKind | undefined {
  if (!d) {
    return undefined
  }
  if (d.kind) {
    return d.kind
  }
  const hasPdf = Boolean(d.pdf?.asset?._ref)
  const hasUrl = typeof d.url === 'string' && d.url.trim().length > 0
  if (hasPdf) {
    return 'pdf'
  }
  if (hasUrl) {
    return 'url'
  }
  if (hasPortableTextContent(d.body)) {
    return 'text'
  }
  return undefined
}

function hasPortableTextContent(body: unknown): boolean {
  if (!Array.isArray(body) || body.length === 0) {
    return false
  }
  return body.some((block) => {
    if (typeof block !== 'object' || block === null || !('_type' in block)) {
      return false
    }
    if ((block as {_type: string})._type !== 'block') {
      return false
    }
    const children = (block as {children?: unknown[]}).children
    if (!Array.isArray(children)) {
      return false
    }
    return children.some(
      (span) =>
        typeof span === 'object' &&
        span !== null &&
        'text' in span &&
        typeof (span as {text?: string}).text === 'string' &&
        (span as {text: string}).text.trim().length > 0,
    )
  })
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
      name: 'kind',
      title: 'This item is',
      type: 'string',
      description:
        'External link: paste a URL only (no images or files here). PDF: attach one PDF below. Archive on this site: full article page on this website — you can attach images/video like an exhibition, plus the article text.',
      options: {
        list: [
          {
            title: 'External link (URL only — no images)',
            value: 'url',
          },
          {
            title: 'PDF (attach a file below)',
            value: 'pdf',
          },
          {
            title: 'Archive on this site (article text + optional images/video)',
            value: 'text',
          },
        ],
        layout: 'radio',
        direction: 'vertical',
      },
      initialValue: 'url',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (value === 'url' || value === 'pdf' || value === 'text') {
            return true
          }
          if (inferKind(context.document as PressDoc)) {
            return true
          }
          return 'Pick one: link, PDF, or text'
        }),
    }),
    defineField({
      name: 'linkText',
      title: 'Title / headline',
      type: 'string',
      description:
        'For links and PDFs: the clickable line on the Press list. For archives hosted here: the page title (Press list + article page).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description:
        'Link out to the article or page (https). This type does not use image or file uploads — switch to Archive or PDF if you need those.',
      hidden: ({document}) => inferKind(document as PressDoc) !== 'url',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as PressDoc | undefined
          if (inferKind(doc) !== 'url') {
            return true
          }
          if (!value || !String(value).trim()) {
            return 'Add the article URL'
          }
          try {
            const u = new URL(String(value))
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
      title: 'Attach PDF',
      type: 'file',
      description:
        'Upload or choose one PDF (e.g. scan or exported article). Visitors open it from the Press list. This type does not include image uploads — use Archive on this site if you need a gallery.',
      hidden: ({document}) => inferKind(document as PressDoc) !== 'pdf',
      options: {
        accept: 'application/pdf',
      },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as PressDoc | undefined
          if (inferKind(doc) !== 'pdf') {
            return true
          }
          const asset = value && typeof value === 'object' && 'asset' in value ? (value as {asset?: {_ref?: string}}).asset : undefined
          return asset?._ref ? true : 'Upload a PDF'
        }),
    }),
    defineField({
      name: 'slug',
      title: 'Page URL (slug)',
      type: 'slug',
      description:
        'Public address for this archive page: /press/your-slug. Generate from the headline or type a short, unique segment.',
      options: {
        source: 'linkText',
        slugify: (input) =>
          input
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 96),
      },
      hidden: ({document}) => inferKind(document as PressDoc) !== 'text',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as PressDoc | undefined
          if (inferKind(doc) !== 'text') {
            return true
          }
          const current = value && typeof value === 'object' && 'current' in value ? (value as {current?: string}).current : undefined
          return current?.trim() ? true : 'Set a slug so the article has a public URL'
        }),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publication date',
      type: 'date',
      description: 'Original publication or review date (shown under the title on the archive page).',
      hidden: ({document}) => inferKind(document as PressDoc) !== 'text',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as PressDoc | undefined
          if (inferKind(doc) !== 'text') {
            return true
          }
          return value ? true : 'Add the publication date'
        }),
    }),
    defineField({
      name: 'publication',
      title: 'Publication or website',
      type: 'string',
      description: 'Outlet where it first appeared — magazine, newspaper, or site (e.g. The White Review, Frieze).',
      hidden: ({document}) => inferKind(document as PressDoc) !== 'text',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as PressDoc | undefined
          if (inferKind(doc) !== 'text') {
            return true
          }
          return typeof value === 'string' && value.trim().length > 0 ? true : 'Add the publication or website name'
        }),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      description: 'Byline as it should appear (writer, critic, or interviewer).',
      hidden: ({document}) => inferKind(document as PressDoc) !== 'text',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as PressDoc | undefined
          if (inferKind(doc) !== 'text') {
            return true
          }
          return typeof value === 'string' && value.trim().length > 0 ? true : 'Add the author byline'
        }),
    }),
    defineField({
      name: 'articleImages',
      title: 'Attach images & video (optional)',
      type: 'array',
      description:
        'Only for archives on this site. Click “Add item” (or the +) to attach stills, Vimeo/YouTube, or video files — same layout as exhibition installation images (list layout, caption & credit under each). Leave empty if the piece is text-only. On the site, media appears after the article text, like a trailing gallery.',
      of: [{type: 'mediaImage'}, {type: 'mediaVideoFile'}, {type: 'mediaVideoLink'}],
      options: {
        layout: 'list',
      },
      hidden: ({document}) => inferKind(document as PressDoc) !== 'text',
    }),
    defineField({
      name: 'body',
      title: 'Article text',
      type: 'array',
      of: [{type: 'block'}],
      description:
        'Full text of the piece. On the archive page it appears first (under the title and publication details), then any attached images/video follow.',
      hidden: ({document}) => inferKind(document as PressDoc) !== 'text',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const doc = context.document as PressDoc | undefined
          if (inferKind(doc) !== 'text') {
            return true
          }
          return hasPortableTextContent(value) ? true : 'Add the article text'
        }),
    }),
  ],
  preview: {
    select: {
      linkText: 'linkText',
      kind: 'kind',
      url: 'url',
      pdf: 'pdf',
      body: 'body',
      slug: 'slug',
      publishedAt: 'publishedAt',
    },
    prepare({linkText, kind, url, pdf, body, slug, publishedAt}): PreviewValue {
      const resolvedKind = inferKind({kind, url, pdf, body} as PressDoc)
      const hasPdf = Boolean(
        pdf &&
          typeof pdf === 'object' &&
          'asset' in pdf &&
          pdf.asset &&
          typeof pdf.asset === 'object' &&
          '_ref' in pdf.asset &&
          pdf.asset._ref,
      )
      let subtitle: string
      if (resolvedKind === 'text') {
        const slugCurrent = slug && typeof slug === 'object' && 'current' in slug ? (slug as {current?: string}).current : undefined
        const dateHint = typeof publishedAt === 'string' && publishedAt ? publishedAt : ''
        subtitle = slugCurrent ? `/press/${slugCurrent}` : 'Article'
        if (dateHint) {
          subtitle = `${subtitle} · ${dateHint}`
        }
      } else if (resolvedKind === 'pdf' || (hasPdf && resolvedKind !== 'url')) {
        subtitle = 'PDF'
      } else if (typeof url === 'string' && url) {
        subtitle = url.length > 64 ? `${url.slice(0, 61)}…` : url
      } else {
        subtitle = ''
      }
      return {
        title: linkText || 'Press',
        subtitle,
        media: Newspaper,
      }
    },
  },
  validation: (Rule) =>
    Rule.custom((doc) => {
      const d = doc as PressDoc | undefined
      const kind = inferKind(d)
      if (!kind) {
        return 'Pick a type and add a URL, PDF, or article content'
      }
      if (!d?.linkText?.trim()) {
        return 'Add a title / headline'
      }
      if (kind === 'url') {
        if (d.pdf?.asset?._ref) {
          return 'Remove the PDF or change the type to PDF'
        }
        if (d.slug?.current) {
          return 'Remove the page slug, or switch to “Archive on this site” if you need a page here'
        }
      }
      if (kind === 'pdf') {
        if (typeof d.url === 'string' && d.url.trim()) {
          return 'Remove the URL or change the type to link'
        }
        if (d.slug?.current) {
          return 'Remove the page slug (only written articles use a slug)'
        }
      }
      if (kind === 'text') {
        if (typeof d.url === 'string' && d.url.trim()) {
          return 'Remove the URL when using an on-site archive, or switch the type to link'
        }
        if (d.pdf?.asset?._ref) {
          return 'Remove the PDF when using an on-site archive, or switch the type to PDF'
        }
        if (!d.slug?.current?.trim()) {
          return 'Set a page slug so this archive has a public URL'
        }
        if (!d.publishedAt) {
          return 'Add the publication date'
        }
        if (!d.publication?.trim()) {
          return 'Add the publication or website'
        }
        if (!d.author?.trim()) {
          return 'Add the author'
        }
        if (!hasPortableTextContent(d.body)) {
          return 'Add the article text'
        }
      }
      return true
    }),
})
