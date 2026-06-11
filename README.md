# Gery Georgieva Website

Portfolio and archive website for Gery Georgieva, a London-based artist working across video, performance, and installation.

The project is a small npm workspace monorepo:

- `frontend` - public Next.js site
- `studio` - Sanity Studio for content editing

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Sanity Studio 5 and `next-sanity`
- Vercel Analytics and Speed Insights
- Three.js, GSAP, Lenis, Motion, and custom shader/gallery interactions

## Site Structure

The public site is served from `frontend/app` and includes:

- `/` - homepage carousel
- `/work` and `/work/[slug]` - public work list and detail pages (Sanity `exhibition` documents; legacy `work` docs are migrated manually in Studio)
- `/ephemera/[slug]` - ephemera/research detail pages
- `/archive` - archive view
- `/press` and `/press/[slug]` - press listing and detail pages
- `/cv` - CV entries
- `/contact` - contact page
- `/feature` - feature/showcase route

The Sanity desk structure is organized around:

- Home/site settings
- About and SEO metadata
- Work
- Ephemera
- Exhibitions
- Press
- CV entries

## Requirements

- Node.js compatible with Next.js 16
- npm
- Access to the Sanity project `713wn0e7`
- A Sanity read token for private dataset access and draft/preview features

## Local Setup

Install dependencies from the repository root:

```sh
npm install
```

Create environment files:

```sh
cp frontend/.env.example frontend/.env.local
cp studio/.env.example studio/.env.local
```

Update the values in both files.

`frontend/.env.local`:

```sh
NEXT_PUBLIC_SANITY_PROJECT_ID="713wn0e7"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2025-09-25"
NEXT_PUBLIC_SANITY_STUDIO_URL="https://gerygeorgieva.sanity.studio"
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID="GTM-XXXXXXX"
SANITY_API_READ_TOKEN="..."
SANITY_WEBHOOK_SECRET="..."
```

`studio/.env.local`:

```sh
SANITY_STUDIO_PROJECT_ID="713wn0e7"
SANITY_STUDIO_DATASET="production"
SANITY_STUDIO_PREVIEW_URL="http://localhost:3000"
SANITY_STUDIO_STUDIO_HOST="gerygeorgieva"
```

`NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` is optional. `SANITY_WEBHOOK_SECRET` is only required when configuring Sanity publish webhooks for on-demand revalidation.

## Development

Run the frontend and Studio together:

```sh
npm run dev
```

Default local URLs:

- Frontend: http://localhost:3000
- Studio: http://localhost:3333

Run one workspace at a time:

```sh
npm run dev --workspace=frontend
npm run dev --workspace=studio
```

The frontend `predev` script regenerates Sanity TypeScript types by extracting the Studio schema into `sanity.schema.json` and writing `frontend/sanity.types.ts`.

## Validation

Run linting:

```sh
npm run lint
```

Run TypeScript checks across workspaces:

```sh
npm run type-check
```

Build the frontend:

```sh
npm run build --workspace=frontend
```

Build the Studio:

```sh
npm run build --workspace=studio
```

Format the repository:

```sh
npm run format
```

## Content Preview and Revalidation

The site uses Sanity Presentation/draft mode via:

- `frontend/app/api/draft-mode/enable/route.ts`
- `next-sanity/visual-editing`
- `NEXT_PUBLIC_SANITY_STUDIO_URL`
- `SANITY_API_READ_TOKEN`

Published content can trigger tag-based cache revalidation through:

```txt
POST /api/revalidate
```

Configure a Sanity webhook with the same `SANITY_WEBHOOK_SECRET` used by the frontend deployment. The route revalidates both the changed document ID and document type.

## Deployment

### Frontend

The frontend is configured for Vercel in `frontend/vercel.json`.

When creating the Vercel project, set:

- Root Directory: `frontend`
- Framework Preset: Next.js
- Build Command: `npm run build`

Add the frontend environment variables listed above to the Vercel project.

### Sanity Studio

Deploy the Studio from the `studio` workspace:

```sh
npm run deploy --workspace=studio
```

The configured Studio host is:

```txt
gerygeorgieva.sanity.studio
```

## Repository Notes

- Shared workspace scripts live in the root `package.json`.
- Sanity schema source lives in `studio/src/schemaTypes`.
- Generated schema/type files are `sanity.schema.json`, `studio/sanity.types.ts`, and `frontend/sanity.types.ts`.
- The public site uses local font files from `frontend/public/fonts`.
- Vercel Analytics and Speed Insights are mounted in the root layout.
