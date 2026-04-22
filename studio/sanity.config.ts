/**
 * This config is used to configure your Sanity Studio.
 * Learn more: https://www.sanity.io/docs/configuration
 */

import {assist} from '@sanity/assist'
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
import {media} from 'sanity-plugin-media'
import {vimeoField} from 'sanity-plugin-vimeo-field'
import {youtubeInput} from 'sanity-plugin-youtube-input'
import {
  defineDocuments,
  defineLocations,
  presentationTool,
  type DocumentLocation,
} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './src/schemaTypes'
import {structure} from './src/structure'

// Environment variables for project configuration
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'your-projectID'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

function previewOriginFromEnv(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) {
    return 'http://localhost:3000'
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '')
  }
  return `https://${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`
}

const SANITY_STUDIO_PREVIEW_URL = previewOriginFromEnv(process.env.SANITY_STUDIO_PREVIEW_URL)

// Define the home location for the presentation tool
const homeLocation = {
  title: 'Home',
  href: '/',
} satisfies DocumentLocation

// resolveHref() is a convenience function that resolves the URL
// path for different document types and used in the presentation tool.
function resolveHref(documentType?: string, slug?: string): string | undefined {
  switch (documentType) {
    case 'work':
      return slug ? `/work/${slug}` : undefined
    case 'exhibition':
      return slug ? `/exhibition/${slug}` : undefined
    case 'ephemera':
      return slug ? `/ephemera/${slug}` : undefined
    default:
      return undefined
  }
}

// Main Sanity configuration
export default defineConfig({
  name: 'default',
  title: 'Gery Georgieva',

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure, // Custom studio structure configuration, imported from ./src/structure.ts
    }),
    media(),
    vimeoField(),
    youtubeInput({
      apiKey: process.env.SANITY_STUDIO_YOUTUBE_API_KEY || '',
    }),
    // Presentation tool configuration for Visual Editing
    presentationTool({
      previewUrl: {
        origin: SANITY_STUDIO_PREVIEW_URL,
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
      resolve: {
        // The Main Document Resolver API provides a method of resolving a main document from a given route or route pattern. https://www.sanity.io/docs/visual-editing/presentation-resolver-api#57720a5678d9
        mainDocuments: defineDocuments([
          {
            route: '/',
            filter: `_type in ["work", "ephemera"]`,
          },
          {
            route: '/work/:slug',
            filter: `_type == "work" && slug.current == $slug`,
          },
          {
            route: '/exhibition/:slug',
            filter: `_type == "exhibition" && slug.current == $slug`,
          },
          {
            route: '/ephemera/:slug',
            filter: `_type == "ephemera" && slug.current == $slug`,
          },
          {
            route: '/cv',
            filter: `_type == "cvEntry"`,
          },
        ]),
        locations: {
          work: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Untitled',
                  href: resolveHref('work', doc?.slug)!,
                },
                homeLocation,
              ].filter(Boolean) as DocumentLocation[],
            }),
          }),
          exhibition: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Untitled',
                  href: resolveHref('exhibition', doc?.slug)!,
                },
              ].filter(Boolean) as DocumentLocation[],
            }),
          }),
          ephemera: defineLocations({
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Untitled',
                  href: resolveHref('ephemera', doc?.slug)!,
                },
                homeLocation,
              ].filter(Boolean) as DocumentLocation[],
            }),
          }),
          cvEntry: defineLocations({
            locations: [{title: 'CV', href: '/cv'}],
            message: 'This entry appears on the CV page.',
            tone: 'positive',
          }),
        },
      },
    }),
    // Additional plugins for enhanced functionality
    unsplashImageAsset(),
    assist(),
    visionTool(),
  ],

  // Schema configuration, imported from ./src/schemaTypes/index.ts
  schema: {
    types: schemaTypes,
  },
})
