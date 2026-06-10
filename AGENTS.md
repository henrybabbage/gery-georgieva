# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

npm workspaces monorepo for **Gery Georgieva** (artist portfolio):

| Workspace | Purpose | Dev port |
|-----------|---------|----------|
| `frontend/` | Next.js 16 public site (depth gallery homepage, Work, Exhibitions, etc.) | `3000` |
| `studio/` | Sanity Studio CMS | `3333` |

There is no local database or Docker. Content is served from **Sanity Cloud** (`713wn0e7` / `production`).

### Environment variables (required for frontend)

Copy `frontend/.env.example` → `frontend/.env.local` and set a valid **`SANITY_API_READ_TOKEN`** (Viewer token from [sanity.io/manage](https://www.sanity.io/manage) → API → Tokens). The app throws at startup without it; `defineLive` / `sanityFetch` return 401 with an invalid token.

For Studio, copy `studio/.env.example` → `studio/.env.local` with `SANITY_STUDIO_PROJECT_ID=713wn0e7` and `SANITY_STUDIO_DATASET=production`. You can reuse the frontend `.env.local` in `studio/` if you prefer (see `vercel-installation-instructions.md`).

If the project is linked to Vercel: `cd frontend && npx vercel link && npx vercel env pull .env.local`.

### Dev servers

From repo root (see `package.json` scripts):

- `npm run dev` — both Next.js and Studio
- `npm run dev:next` — frontend only
- `npm run dev:studio` — Studio only

**Gotcha:** `dev:next` and `dev:studio` run `predev` → `sanity:typegen` (schema extract + typegen). First start can take ~30–60s before the server is ready.

**Gotcha:** `sanity dev` may prompt to upgrade local Sanity packages. Answer **`n`** in non-interactive/tmux sessions so the dev server can start.

### Lint / type-check / build

- `npm run lint` — ESLint in `frontend/` (warnings only as of setup)
- `npm run type-check` — `tsc --noEmit` in both workspaces
- `npm run build --workspace=frontend` — requires valid `SANITY_API_READ_TOKEN` (page data collection uses Live API)

CI (`.github/workflows/ci.yml`) runs `npm install`, `lint`, and `type-check` only — no build.

### Optional

- `npm run import-sample-data` — imports into Sanity (needs CLI auth + `sample-data.tar.gz`)
- `SANITY_WEBHOOK_SECRET` — only for `/api/revalidate` in production-like flows
