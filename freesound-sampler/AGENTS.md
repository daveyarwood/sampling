# AGENTS.md

## Project overview

Freesound Sampler is a web app that fetches random audio from Freesound.org (CC0 license), chops long audio into 10-second clips via `sox`, and presents 16 samples in a 4x4 grid for in-browser auditioning.

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express + TypeScript (ts-node in dev)
- **Audio processing:** `sox` / `soxi` CLI tools

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start both backend (Express on :3000) and frontend (Vite on :5173) concurrently |
| `npm run dev:server` | Start only the Express backend with nodemon auto-reload |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run build` | Build both frontend (vite build) and backend (tsc) |
| `npm start` | Run the production build (Express on :3000) |
| `npx oxlint` | Lint all TypeScript files |
| `npx oxfmt` | Format all TypeScript/TSX files |

## Architecture

```
Browser (Vite :5173) ──proxy──> Express (:3000)
  /api/*            ──────────> /api/*          (vite.config.ts proxy)
  /samples/*        ──────────> /samples/*      (vite.config.ts proxy)
```

### Server (`src/server/`)

- **`index.ts`** — Express server: OAuth routes, `/api/random-samples` endpoint, static file serving, startup cleanup of `public/samples/`
- **`freesound.ts`** — Freesound API client: OAuth2 token management (code exchange, refresh), search, download
- **`audio.ts`** — Audio processing: `soxi` for duration, `sox` for chopping into 10s WAV clips

### Client (`src/client/`)

- **`main.tsx`** — React entry point
- **`App.tsx`** — Root component: checks auth status, shows `AuthSetup` or `SampleGrid`
- **`AuthSetup.tsx`** — OAuth2 authorization code exchange UI
- **`SampleGrid.tsx`** — Fetches `/api/random-samples`, renders 4x4 grid of `<audio>` elements

## Coding conventions

- **TypeScript strict** — prefer explicit types, avoid `any`
- **Prefer `const`** over `let`
- **Arrow functions** for callbacks and functional-style code
- **Keep modules focused** — one concern per file
- **No dead code** — remove unused imports, variables, and functions
- **Use the existing patterns** — match the style of surrounding code when adding or modifying

## Development workflow (diet cycles)

1. Pick a TODO from the README — each cycle tackles one item
2. Discuss the approach in the Lavish dashboard artifact (`.lavish/dashboard.html`)
3. Implement the feature
4. Run `npx oxlint` and `npx oxfmt` to verify code quality
5. Manually verify the feature works in the browser
6. Update the Lavish dashboard: remove completed item, add brief review notes if any
7. Mark the item done in the README and commit

## Lavish dashboard

The development dashboard lives at `.lavish/dashboard.html` (gitignored). To open it in a new session:

```
npx -y lavish-axi .lavish/dashboard.html
```

Then poll for feedback:

```
npx -y lavish-axi poll .lavish/dashboard.html --agent-reply "<your opening message>"
```

### Dashboard structure

- **Stats bar** at the top: pending count, completed count, total
- **Pending section**: expandable collapse panels, one per TODO item. Each shows the description and implementation notes. Each has a "Start cycle" button that queues a prompt via `window.lavish.queuePrompt()`.
- **Completed section**: a table showing finished items with review notes
- **Add new TODO** section: a free-text `<textarea>` + button to queue a new TODO suggestion. IMPORTANT: the form must NOT use `data-lavish-question` (which deduplicates/overwrites previous unsent answers for the same key) — each suggestion must be independently queued so multiple suggestions don't clobber each other.

### After each cycle

1. Edit `dashboard.html`: remove the completed item's collapse panel from the pending section, add a row to the completed table, update the stats numbers
2. Edit `README.md`: remove the completed TODO from the TODO list
3. Run `npx -y lavish-axi .lavish/dashboard.html --reopen` to refresh the browser view
