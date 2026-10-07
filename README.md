# Player System

A personal level-up app in the shape of a game System: daily quests, a training Gate prescribed and progressed by rules, XP, levels, ranks, six stats, penalties for missed days, and long-term main quests. Built for one player, on an Android phone, offline first.

- **Stack:** Vite, React 19, TypeScript (strict), React Router 7, Tailwind CSS 4, Dexie (IndexedDB), Zustand, Motion, Vaul, Phosphor icons, vite-plugin-pwa. One Vercel function for AI.
- **Docs in this repo:** [`docs/BRIEF.md`](docs/BRIEF.md) (the spec), [`PLAN.md`](PLAN.md) (architecture and decisions), [`DESIGN.md`](DESIGN.md) (design system), [`PRODUCT.md`](PRODUCT.md) (product record).

## Run locally

Node 22 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. Also serves `/api/system` from `api/system.ts` when `.env.local` has the AI variables. |
| `npm test` | Engine, data and API tests (Vitest), run twice: Asia/Kolkata and America/New_York. |
| `npm run check:plan` | Re-reads `docs/*.docx` and `docs/*.xlsx` and checks the plan data matches them. |
| `npm run e2e` | Playwright: onboarding → status check → quests → Gate in Focus Mode → Gate Cleared → level-up → next-day penalty. |
| `npm run shots` | Screenshots of every screen at 390×844 and 360×780 into `screenshots/`. |
| `npm run build` | Typecheck and production build (with the service worker). |
| `npm run lint` / `npm run format` | ESLint / Prettier. |

**See it with data:** open `http://localhost:5173/today?demo=1`. That loads three weeks of sample history into a separate database (`player-system-demo`); every screen shows a **Demo data** strip with an Exit link. Your own data is never touched. `?demo=0` (or Settings → Leave demo) goes back.

`/kit` shows every component in every state.

## Environment variables

The app works fully without AI. AI adds bonus quests on Today and the Weekly System Report on Status.

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI | Server only. Never sent to the browser. |
| `AI_MODEL` | No | Defaults to `claude-haiku-4-5` for Anthropic and `gemini-3.5-flash-lite` for Gemini. A Claude id is ignored when the provider is Gemini. |
| `APP_PASSCODE` | For AI | Any secret string. The app sends it as `x-app-passcode`; set the same value in the app under **Settings → AI**. The route rejects every request without it, because the URL is public. |
| `AI_PROVIDER` | No | `anthropic` (default), `openai` (with `OPENAI_API_KEY`) or `gemini` (with `GEMINI_API_KEY`). |

**Using a free Gemini key instead:** create a key in Google AI Studio, then set `AI_PROVIDER=gemini`, `GEMINI_API_KEY` and `APP_PASSCODE`; `ANTHROPIC_API_KEY` is not needed. The default model, Gemini 3.5 Flash-Lite, has the largest free daily allowance (about 500 requests a day as of October 2026; AI Studio shows your project's exact limits). The app makes one request per bonus-quest refresh or weekly report, so personal use stays far below it. If Google's daily cap is reached, the app says so and everything else keeps working.

For local AI, copy `.env.example` to `.env.local` and fill it in. The route also rate limits each IP (12 requests per 10 minutes), validates input and output with zod, and clamps what the model returns: 2-4 quests, titles of at most 6 words, XP 5-30, no duplicates of today's quests.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo. The framework preset is Vite; `vercel.json` already sets the build command, the `dist` output, SPA rewrites (everything except `/api/*` serves `index.html`), and cache headers.
3. **Settings → Environment Variables:** add `APP_PASSCODE` and either `ANTHROPIC_API_KEY`, or `AI_PROVIDER=gemini` with `GEMINI_API_KEY`. `AI_MODEL` is optional.
4. **Deploy.** Then open the app, go to **Settings → AI**, turn AI on and enter the passcode.

## Install on your phone

- **Android (Chrome):** open the deployed URL, then **⋮ → Install app** (or **Settings → Install app** inside Player System). It launches standalone, in portrait, and works offline.
- **iPhone (Safari):** **Share → Add to Home Screen.** Haptics are not available on iOS; everything else works.

The service worker caches the app shell, fonts and icons. When a new version is deployed, the app shows a **New version available** notice with **Reload**.

## Backup and restore

All data lives on the phone (IndexedDB). Nothing is synced.

- **Back up:** Settings → Data → **Export backup** saves one JSON file with everything.
- **Restore:** Settings → Data → **Import backup**. The file is validated first, then replaces all data on this device in one step. A file that fails validation changes nothing.
- **Training log:** Settings → Data → **Export training log** saves a CSV in the tracker's Log-sheet columns (`Date, Day, Exercise, Variation used, Unit, Set 1..5, RPE, Notes`), with the tracker's exact exercise names, so rows paste straight into `Calisthenics_Tracker.xlsx`.
- **Reset:** Settings → Data → **Reset all data** (type `RESET` to confirm).

Export a backup before changing phones or clearing browser data.

## How it is put together

```
api/                 Vercel function (AI) and its helpers
src/engine/          Pure TypeScript rules + tests: prescription, progression, XP, levels, quests,
                     tiers, close-out, streaks, titles, heatmap, goals, CSV
src/data/            Plan, ladders, exercises, habits, titles, templates (from the docs)
src/db/              Dexie database, repositories, live hooks, demo seed
src/app/             Router, shell, commands (engine + DB + side effects), stores
src/components/      ui/ primitives, system/ System components, charts/ SVG charts, app/ shared pieces
src/screens/         One folder per tab, plus onboarding and the kit
tests/               Playwright e2e and screenshot runs
```

The engine owns every number the app prescribes. AI never changes sets, reps or loads.
