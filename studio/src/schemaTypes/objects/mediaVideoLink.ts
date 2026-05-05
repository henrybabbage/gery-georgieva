import {PlayIcon} from '@sanity/icons'
import type {PreviewValue} from '@sanity/types'
import {defineField, defineType} from 'sanity'

type MediaVideoLinkParent = {
  provider?: string
  vimeo?: {_type?: string; asset?: {_ref?: string}}
  youtube?: {id?: string; title?: string; thumbnails?: string[]}
}

type VimeoPictures = {
  sizes?: Array<{link?: string; width?: number}>
}

function bestVimeoPosterUrl(pictures: VimeoPictures | null | undefined): string | undefined {
  const sizes = pictures?.sizes
  if (!sizes?.length) return undefined
  let best: string | undefined
  let bestW = -1
  for (const s of sizes) {
    if (!s.link) continue
    const w = s.width ?? 0
    if (w >= bestW) {
      best = s.link
      bestW = w
    }
  }
  return best
}

function bestYoutubeThumbUrl(thumbnails: string[] | null | undefined): string | undefined {
  const urls = thumbnails?.filter((u) => typeof u === 'string' && u.trim() !== '')
  if (!urls?.length) return undefined
  return urls[urls.length - 1]
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
      hidden: ({parent}: {parent: MediaVideoLinkParent}) => parent?.provider !== 'vimeo',
    }),
    defineField({
      name: 'youtube',
      title: 'YouTube',
      type: 'youtubeVideo',
      hidden: ({parent}: {parent: MediaVideoLinkParent}) => parent?.provider !== 'youtube',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 2,
    }),
    defineField({name: 'credit', title: 'Credit', type: 'string'}),
  ],
  preview: {
    select: {
      provider: 'provider',
      caption: 'caption',
      credit: 'credit',
      vimeoVideoName: 'vimeo.asset->name',
      vimeoPictures: 'vimeo.asset->pictures',
      youtubeTitle: 'youtube.title',
      youtubeThumbs: 'youtube.thumbnails',
    },
    prepare({provider, caption, credit, vimeoVideoName, vimeoPictures, youtubeTitle, youtubeThumbs}): PreviewValue {
      const fallback =
        provider === 'vimeo' ? 'Vimeo' : provider === 'youtube' ? 'YouTube' : 'Video link'
      const captionT = typeof caption === 'string' ? caption.trim() : ''
      const vimeoNameT =
        typeof vimeoVideoName === 'string' ? vimeoVideoName.trim() : ''
      const ytTitleT = typeof youtubeTitle === 'string' ? youtubeTitle.trim() : ''
      const title =
        captionT ||
        (provider === 'vimeo' ? vimeoNameT : '') ||
        (provider === 'youtube' ? ytTitleT : '') ||
        fallback

      let media: PreviewValue['media'] = PlayIcon
      if (provider === 'vimeo') {
        const url = bestVimeoPosterUrl(vimeoPictures as VimeoPictures | null | undefined)
        if (url) media = url
      } else if (provider === 'youtube') {
        const url = bestYoutubeThumbUrl(
          Array.isArray(youtubeThumbs) ? youtubeThumbs : undefined,
        )
        if (url) media = url
      }

      return {
        title,
        subtitle: typeof credit === 'string' ? credit : undefined,
        media,
      }
    },
  },
})
