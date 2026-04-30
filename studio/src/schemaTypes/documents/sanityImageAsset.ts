import {defineField, defineType} from 'sanity'

const imageTypeOptions = [
  {title: 'Performance - Live action, events, or audience moments', value: 'performance'},
  {title: 'Work - Canonical view of the artwork itself', value: 'work'},
  {title: 'Installation - In-situ view showing space/context', value: 'installation'},
  {title: 'Detail - Close-up focusing on a specific part', value: 'detail'},
]

const imageSizeOverrideOptions = [
  {title: 'Small (sm) - Compact thumbnails', value: 'sm'},
  {title: 'Medium (md) - Standard card image', value: 'md'},
  {title: 'Large (lg) - Default feature image', value: 'lg'},
  {title: 'Extra Large (xl) - Hero or high-emphasis image', value: 'xl'},
]

export const sanityImageAsset = defineType({
  name: 'sanity.imageAsset',
  title: 'Image Asset',
  type: 'document',
  fields: [
    defineField({
      name: 'imageType',
      title: 'Image Type',
      type: 'string',
      description:
        'Optional global classification for this asset. Use the option labels as editorial guidance.',
      options: {
        list: imageTypeOptions,
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'sizeOverride',
      title: 'Size Override',
      type: 'string',
      description:
        'Optional global display size token for this asset. Leave empty to keep component defaults.',
      options: {
        list: imageSizeOverrideOptions,
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
  ],
})
