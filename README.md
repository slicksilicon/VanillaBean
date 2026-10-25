# VanillaBean

A template for front-end-only React single-page apps deployed to Vercel, built from the
[EscapeVelocity](../../Workspaces/EscapeVelocity) template's UI: the top-row segment bar, the sub-segment sidebar
layout, the glassmorphism component library, charts and design tokens.

## Start a new app

```bash
git clone <this repo> my-app && cd my-app
./init_project.sh          # name, title, dev port, npm ci
./run.sh                   # http://localhost:7400
```

Add a feature by creating `src/Segments/<Name>/<Name>.tsx` that exports `segmentName`. It appears as a tab; list it in
`SEGMENT_ORDER` in `src/segmentsConfig.ts` to set its position.

| Command | What it does |
|---|---|
| `./run.sh` | Vite dev server |
| `./check.sh` | ESLint, typecheck and production build |
| `./build-backends.sh <Name>` | Generate typed hooks for a local EscapeVelocity backend into `src/Backends/<Name>/Query/` |
| `./template.sh status` / `drift` | Compare with the EscapeVelocity template this is synced from |

## Data

- **In the browser:** `useStoredState(key, initial)`, a localStorage-backed `useState`.
- **Third-party APIs:** TanStack Query hooks in `src/Api/<Service>/`.
- **EscapeVelocity backends, local only:** set `VITE_BACKEND_<NAME>_URL` in `.env.local`, add this app's origin to the
  backend's `ALLOWED_FRONTEND_URLS`, sign in to that app once, and declare `export const requiredBackends = "<Name>"`
  in the segment. On Vercel those segments are hidden.

## Deploy

Connect the repository to Vercel, or run `npx vercel --prod`. `vercel.json` already sets the build. The committed `.env`
supplies the title, and the tab order is fixed in `src/segmentsConfig.ts`; nothing has to be configured in the Vercel project.

See [CLAUDE.md](CLAUDE.md) for the architecture and the template-sync procedure.
