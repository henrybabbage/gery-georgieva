import {defineField, defineType} from 'sanity'

type MediaItemParent = {
  mediaType?: string
  videoSource?: string
  videoUrl?: string
  videoFile?: {_type?: string; asset?: {_ref?: string}}
  vimeo?: {_type?: string; asset?: {_ref?: string}}
}

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'object',
  validation: (Rule) =>
    Rule.custom((item: MediaItemParent | undefined) => {
      if (item?.mediaType !== 'video') return true
      const src = item.videoSource
      if (!src) {
        const hasUrl = Boolean(item.videoUrl)
        const hasFile = Boolean(item.videoFile?.asset?._ref)
        if (!hasUrl && !hasFile) {
          return 'Add a video URL or file, or choose a video source type'
        }
        return true
      }
      if (src === 'url' && !item.videoUrl) {
        return 'Video URL is required'
      }
      if (src === 'file' && !item.videoFile?.asset?._ref) {
        return 'Video file is required'
      }
      if (src === 'vimeo' && !item.vimeo?.asset?._ref) {
        return 'Select a Vimeo video'
      }
      return true
    }),
  fields: [
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {list: ['image', 'video']},
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}: {parent: MediaItemParent}) =>
        parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'videoSource',
      title: 'Video source',
      type: 'string',
      description:
        'How this video is provided. Leave unset only for existing items ' +
        'that use URL or file below.',
      options: {
        list: [
          {title: 'URL (Vimeo, YouTube, etc.)', value: 'url'},
          {title: 'Uploaded file', value: 'file'},
          {title: 'Vimeo (synced library)', value: 'vimeo'},
        ],
        layout: 'radio',
      },
      hidden: ({parent}: {parent: MediaItemParent}) =>
        parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (Vimeo/YouTube)',
      type: 'url',
      hidden: ({parent}: {parent: MediaItemParent}) => {
        if (parent?.mediaType !== 'video') return true
        if (!parent.videoSource) return true
        return parent.videoSource !== 'url'
      },
    }),
    defineField({
      name: 'videoFile',
      title: 'Video File',
      type: 'file',
      hidden: ({parent}: {parent: MediaItemParent}) => {
        if (parent?.mediaType !== 'video') return true
        if (!parent.videoSource) return true
        return parent.videoSource !== 'file'
      },
    }),
    defineField({
      name: 'vimeo',
      title: 'Vimeo video',
      type: 'vimeo',
      hidden: ({parent}: {parent: MediaItemParent}) => {
        if (parent?.mediaType !== 'video') return true
        if (!parent.videoSource) return true
        return parent.videoSource !== 'vimeo'
      },
    }),
    defineField({
      name: 'isAudiencePhoto',
      title: 'Audience Photo',
      type: 'boolean',
      description:
        'Mark if this is an audience/vernissage photo, not official ' +
        'documentation.',
      initialValue: false,
    }),
    defineField({name: 'caption', title: 'Caption', type: 'text', rows: 2}),
    defineField({name: 'credit', title: 'Photo Credit', type: 'string'}),
  ],
})
