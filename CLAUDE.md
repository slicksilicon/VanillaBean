# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

VanillaBean is an application **template** for **front-end-only** single-page apps: React 19 + Vite 7 + TypeScript,
deployed as static files to **Vercel**. It is derived from the EscapeVelocity template (`~/Workspaces/EscapeVelocity`)
and kept in sync with it (see "Template lineage"). The UI shell, the top-row segment bar, the glassmorphism component
library, the charts and the design tokens are EscapeVelocity's own files, copied byte-for-byte.

There is no backend. Apps keep data in the browser (`useStoredState`), call third-party HTTP APIs, and - **only when
run locally** - can call existing EscapeVelocity backends through generated hooks.

The `Sample`, `SubSegmentDemo` and `BackendDemo` segments are demos. Replace them with your own.

New projects: clone, then `./init_project.sh` (asks for the name, title and dev port, then `npm ci`).

## Running

- `./run.sh`: Vite dev server on the port in `vite.config.ts` (template default **7400**; EscapeVelocity apps use 7000-7300,
  7500, 7700 and 7900).
- `./check.sh`: ESLint, then `npm run build` (`tsc -b && vite build`). Exits non-zero if either fails. Run it before committing.
- Deploy: push to the Git repo connected to Vercel, or `npx vercel` / `npx vercel --prod`. `vercel.json` sets the Vite
  framework, `npm ci`, the `dist` output, the SPA rewrite, security headers and immutable caching for `/assets/`.

## Configuration

- **`.env` is committed** and holds public build-time config used by every build, Vercel's included: `VITE_APP_TITLE`.
  Vite inlines every `VITE_` variable into the public bundle, so **never put a secret in one**.
- **`.env.local` is gitignored** (and listed in `.vercelignore`). It holds local-only overrides, mainly the EscapeVelocity
  backend URLs. See `.env.local.sample`. Vite loads it on top of `.env`.

## Frontend architecture

- **Segments are the top-level features.** Each folder under `src/Segments/` whose `<Folder>/<Folder>.tsx` exports
  `export const segmentName = "..."` becomes a tab. `src/segmentsConfig.ts` discovers them at build time with
  `import.meta.glob`, so there is no generation step. Tab order is fixed in code, the same in every
  environment: the names in `SEGMENT_ORDER` (top of `segmentsConfig.ts`) first, then the rest in folder order. Add a new
  segment's `segmentName` there to place it. `Splash`, `Login`, `Library` and `Common` folders are not segments. The glob imports
  every `.tsx` directly inside a segment folder, so keep a segment's helper components in a subfolder (`SubSegments/`).
- A segment with a sidebar uses `src/Segments/SubSegmentLayout.tsx` (see `SubSegmentDemo`).
- `App.tsx` renders the segment bar, then the selected segment inside a per-segment `ErrorBoundary` and `BackendGate`,
  or `Splash` when nothing is selected. Root providers (`main.tsx`): `ToastContainer`, top-level `ErrorBoundary`,
  `QueryClientProvider`. Inside them, `AppSettingsProvider` holds the selected segment.
- **Browser storage:** `src/Hooks/useStoredState.ts` is a `useState` persisted to localStorage (`vanillabean:<key>`),
  guarded against storage being unavailable. It is per browser and per device. Never treat it as the only copy of
  anything important.
- **Third-party HTTP APIs:** put hand-written TanStack Query hooks in `src/Api/<Service>/use<Thing>.ts`. Each file
  exports a `*QueryKey()` builder next to the hook, as the generated hooks do. Do not call `fetch` from components.
- **Every query hook consumed by a component must handle its error state.** Destructure `isError`, `error` and
  `refetch`, and wrap list/table/gallery sections in `<QueryState>` (`src/Components/QueryState/`).
- `src/Query/Types/` is **not generated** here. It mirrors three EscapeVelocity schema types (`Currency`, `Amount`,
  `Range`) at the same path, which keeps the shared components that import them byte-identical. Don't add to it.
- No `any` (lint errors on it). TypeScript: 4-space indent, double quotes, lines up to 160 characters, functional components.

## Calling EscapeVelocity backends (local only)

- A backend is a folder `src/Backends/<Name>/`. Its URL is `VITE_BACKEND_<NAME uppercased>_URL` in `.env.local`
  (e.g. `Tools` -> `VITE_BACKEND_TOOLS_URL=http://localhost:18700`), with no trailing slash.
- **Generate hooks** with `./build-backends.sh <Name>` (backend running), or with
  `./build-backends.sh <Name> --spec path/to/openapi.json`. `./build-backends.sh` with no arguments regenerates every
  backend. It runs EscapeVelocity's own generators from `codegen/ev/` unmodified, once per backend, rewrites the base URL to
  that backend's env var, and replaces `src/Backends/<Name>/Query/` and `openapi.json`.
- **Everything under `src/Backends/<Name>/Query/` is generated. Never edit it.** The output is committed, so Vercel
  never needs a backend. Generated mutations take `{ data: Body }`, and every `*QueryKey()` parameter is optional (an
  omitted parameter yields a prefix key, for invalidation), exactly as in EscapeVelocity.
- A segment that calls backends exports `export const requiredBackends = "Tools"` (comma-separated for several). It is
  a string, not an array, so React Fast Refresh and the lint rule accept the export.
  - If any of those backends' env vars is unset, which is always the case on Vercel, the segment is **left out** of the bar.
  - Otherwise `BackendGate` (`src/Backends/BackendGate.tsx`) probes each backend (`useBackendSession.ts`). It renders
    the segment only when every backend is reachable and signed in, and otherwise shows "Sign in", "isn't running" or
    "not accepting this app". A mismatch between the backend's live version and the committed `openapi.json` only
    shows a toast suggesting `./build-backends.sh <Name>`.
- **Authentication:** VanillaBean has no login. An EscapeVelocity backend authenticates the browser with an HttpOnly
  `auth-token:<port>` cookie scoped to host `localhost`, not to the port. Signing in to that app's own UI in the same
  browser is enough, because the generated hooks send `credentials: "include"`. A 401 mid-session re-probes every
  backend (`main.tsx`), and BackendGate swaps the segment for its "Sign in" panel.
- **One-time setup per backend:** add this app's origin (e.g. `http://localhost:7400`) to `ALLOWED_FRONTEND_URLS` in
  that app's `BackEnd/.env` and restart it. This is configuration only. Never change backend code from here.
- This is a deliberate, local-only exception to EscapeVelocity's rule that a frontend only calls its own backend
  (`docs/cross-app-service-auth.md` in EscapeVelocity). Do not add backend calls to anything that must work on Vercel.

## Component rules (inherited from EscapeVelocity)

- Shared UI components live in `src/Components/`, one folder per component (`Button/Button.tsx` + `Button.css`, no barrel
  file). Reuse or extend one (e.g. a `variant` prop) before adding another. `src/Components/` is strictly for generic
  components. Feature-specific code gets its own top-level folder (`src/Error/`, `src/Backends/`).
- **Colours in component CSS must use the tokens in `src/Components/DesignTokens.css`** (`rgb(var(--info-rgb))`,
  `rgb(var(--danger-rgb) / 0.3)`). Never hardcode a hex or rgba literal. `src/Helpers/ColorScheme.css` is a separate palette
  for chart data series only.
- **`backdrop-filter` only on elements that float above the page** (modals, popovers, dropdowns, menus, toasts). Never on
  inline flow content. See `docs/glass-panel-seam-fix.md`.
- Feedback surfaces: `showToast(message, { variant })` from `src/Components/Toast/toastBus.ts`, `Modal` as the base for
  dialogs (`PopUp` and `RowDetailPopup` build on it), `ErrorBoundary` at the root and around each segment.

## Template lineage (EscapeVelocity -> VanillaBean)

VanillaBean tracks EscapeVelocity's `TEMPLATE_VERSION`. **`TEMPLATE_SYNC.json`** records:
- `synced_to` / `synced_on`
- `scope`: the EscapeVelocity paths that matter here: `FrontEnd/` and one doc
- `path_map`: EscapeVelocity paths to VanillaBean paths. `FrontEnd/src/` becomes `src/`, and the three generator
  scripts go into `codegen/ev/`.
- `opted_out`: files deliberately not taken, each with a reason
- `deviations`: files taken but intentionally changed, each with a reason

Every other in-scope file is **shared**: it must stay **byte-identical** to EscapeVelocity. Never fix a bug in a shared
file here. Fix it in EscapeVelocity (bump and changelog there), then sync.

- `./template.sh status`: EscapeVelocity's version against `synced_to`, and each newer changelog entry with every
  file it touches mapped and classified.
- `./template.sh drift`: every in-scope file classified as identical, deviation, opted out, **DRIFT** (differs but is not
  a declared deviation) or **MISSING** (absent but not opted out). It exits 1 on DRIFT, MISSING or stale entries.
  `--all` lists everything.

### Syncing from EscapeVelocity

1. `./template.sh status` lists the entries newer than `synced_to`. Apply them **oldest first**.
2. Skip files the status shows as opted out or out of scope (all of `BackEnd/` and EscapeVelocity's root scripts).
3. Copy shared files verbatim through `path_map`. Three-way merge deviations by hand. For a new EscapeVelocity
   `FrontEnd/` file, either copy it or add it to `opted_out` with a reason.
4. If an entry touched `codegen/ev/` generators, run `./build-backends.sh` **once**, at the end.
5. If EscapeVelocity's `FrontEnd/package-lock.json` changed, re-seed: copy it, set `name` (top level and
   `packages[""]`) to this project's, `npm install`.
6. `./check.sh`, then each entry's `verify`, then `./template.sh drift` must report no unexpected drift.
7. Update `synced_to` and `synced_on`, and record any new divergence. Same commit.

Do one `breaking` entry at a time, committing between them.
