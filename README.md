# VanillaBean

A template for React single-page apps deployed to Vercel - static by default, with an optional TypeScript API,
MongoDB (Atlas) and Google sign-in chosen per app - built from the
[EscapeVelocity](../../Workspaces/EscapeVelocity) template's UI: the top-row segment bar, the sub-segment sidebar
layout, the glassmorphism component library, charts and design tokens.

## Start a new app

```bash
git clone <this repo> my-app && cd my-app
./init_project.sh          # name, title, dev port, npm ci, then ./configure.sh
./run.sh                   # http://localhost:7400 (and the API on 7410 when enabled)
```

Add a feature by creating `src/Segments/<Name>/<Name>.tsx` that exports `segmentName`. It appears as a tab; list it in
`SEGMENT_ORDER` in `src/segmentsConfig.ts` to set its position.

| Command | What it does |
|---|---|
| `./configure.sh` | Choose features: Google sign-in, MongoDB, own API, EscapeVelocity backends |
| `./run.sh` | Vite dev server, plus the app's API when enabled |
| `./check.sh` | ESLint, app and server typecheck, production build |
| `./build-backends.sh App` | Regenerate the hooks for the app's own API after changing `server/` |
| `./build-backends.sh <Name>` | Generate typed hooks for a local EscapeVelocity backend into `src/Backends/<Name>/Query/` |
| `./template.sh status` / `drift` | Compare with the EscapeVelocity template this is synced from |

## Data

- **In the browser:** `useStoredState(key, initial)`, a localStorage-backed `useState`.
- **MongoDB:** routes in `server/routes/`, logic in `server/tools/`, typed hooks generated into `src/Backends/App/Query/`.
  Local mongod in dev, a free Atlas M0 cluster on Vercel. Segments never touch the database.
- **Third-party APIs:** TanStack Query hooks in `src/Api/<Service>/`.
- **EscapeVelocity backends, local only:** set `VITE_BACKEND_<NAME>_URL` in `.env.local`, add this app's origin to the
  backend's `ALLOWED_FRONTEND_URLS`, sign in to that app once, and declare `export const requiredBackends = "<Name>"`
  in the segment. On Vercel those segments are hidden.

## Deploy

Connect the repository to Vercel, or run `npx vercel --prod`. `vercel.json` already sets the build and routes `/api/*` to
the function. A static app needs no Vercel configuration. With sign-in or MongoDB on, set the environment variables
`./configure.sh` lists at the end (client secret, JWT key, allowlist, Atlas URI).

See [CLAUDE.md](CLAUDE.md) for the architecture and the template-sync procedure.
