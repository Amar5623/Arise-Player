# PROJECT: "PLAYER SYSTEM", a personal level-up app (React PWA, deployed on Vercel)

> The owner's original brief, kept verbatim as the build's spec. Decisions made since are in PLAN.md §10.

You are building a production-quality, mobile-first React app for one user: me. I'm an AI engineer in India. I'm running a full "glow-up" across training, face and looks, diet and recovery, intellect, and finances. The app turns all of that into a game-style "System", inspired by the status windows, daily quests, penalty and level-up mechanics of hunter/system manhwa. **Do not use any copyrighted names, characters, logos or quoted lines.** The game *mechanics* and a *system-interface mood* are the inspiration. The art direction must be our own.

It must feel like a real native app installed from Chrome. It is not a website and it is not an AI-generated dashboard. Design quality is the #1 acceptance criterion. Read the whole brief before writing any code.

## 0. Skills and how to use them

- Design skills are installed: **taste-skill** (`design-taste-frontend`, `redesign-existing-projects`, `full-output-enforcement`) and **Impeccable** (`/impeccable …` commands). Read their SKILL.md files first and follow them throughout. Where this brief and a skill disagree on aesthetics, **this brief wins**.
- Taste-skill dials for this project: `DESIGN_VARIANCE = 6`, `MOTION_INTENSITY = 6`, `VISUAL_DENSITY = 5`.
- Run `/impeccable init` at the start. After each phase, run `/impeccable critique` and `/impeccable audit` and fix what they find. Run `/impeccable polish` before you call any screen done.
- Read `./docs/Calisthenics_Plan_Daily_Reference.docx` and `./docs/Calisthenics_Tracker.xlsx`. Install whatever you need to parse them (e.g. `mammoth`, `xlsx`), but only as dev tooling. The plan data in section 6 comes from these files. Cross-check it against them.

## 1. Working method (follow in order, stop at each checkpoint)

1. **Plan:** write `PLAN.md` with the screen map, navigation model, data model, folder structure and phase list. **Checkpoint: show me before continuing.**
2. **Design system first:** write `DESIGN.md` (tokens, type scale, spacing, radii, elevation, motion, component inventory, do/don't list). Build the tokens and primitives, plus a hidden `/kit` route that renders every component in every state. Screenshot `/kit` at 390×844 with Playwright and critique it. **Checkpoint: show me the screenshots.**
3. **Domain engine:** pure TypeScript in `src/engine/`, with no React. Write Vitest unit tests for every rule in section 7 before the UI uses them.
4. **Screens:** build them one at a time. After each, take a Playwright screenshot at 390×844 (and 360×780), look at it critically, and fix spacing, alignment, hierarchy and contrast before moving on.
5. **PWA + Vercel:** add the PWA setup and serverless AI route, run a final audit, and write the README.

Never skip the screenshot-and-critique loop. "It compiles" is not done. "It looks deliberate at 390px" is done.

## 2. Tech stack (use exactly this unless you have a strong reason; tell me if so)

- **Vite + React 19 + TypeScript (strict)**, with React Router v7 (data router) for stack navigation inside tabs.
- **Tailwind CSS v4**, with design tokens as CSS variables in `@theme`. No default Tailwind palette colours in components. Everything goes through tokens.
- **Motion** (`motion/react`) for transitions, shared-layout animations and spring physics.
- **Radix primitives** where needed (dialog, switch, slider), styled from scratch. **Vaul** for bottom sheets. **Do not use stock shadcn/ui styling.**
- **Zustand** for UI state. **Dexie (IndexedDB)** for persisted data, through a repository layer so cloud sync can be added later. Local-first, so everything works offline.
- **Phosphor Icons** (thin/regular weight) or custom SVG. No emoji as icons. No Lucide default look.
- Charts: hand-built SVG components (radar, sparkline, heatmap, line). No chart library styling.
- **vite-plugin-pwa** (injectManifest or generateSW): offline shell, install prompt, maskable icons, splash/theme colour, `display: standalone`, portrait.
- **Vitest** for engine tests and **Playwright** for mobile e2e and screenshots.
- **Vercel**: SPA rewrites in `vercel.json`, plus one serverless function `api/system.ts` for AI.

## 3. Design direction: "System Interface", refined (READ CAREFULLY)

**Concept:** a calm, precise, dark tactical HUD that occasionally *announces* itself. Think of a premium watch face or a fighter-jet MFD crossed with a high-end fitness app. It is **not** a neon cyberpunk template. 90% of the UI is quiet, readable and dense with real information. 10% is the System speaking: quest notices, penalty warnings, level-ups, skill unlocks. That 10% gets the glow, the corner-bracket frame, the sound and the haptics. Contrast between the two modes is the whole aesthetic.

**Colour (tokens, tune them but keep the logic):**
- Base `#05070C` (blue-black, never pure black), with surfaces stepping up in luminance: `#0A0F1A`, `#0F1624`, `#151E30`. Hairline borders are `rgba(140,170,220,0.10–0.16)`.
- Text: primary `#E6EDF7`, secondary `#8C9AB3`, tertiary `#56627A`.
- **One** accent: System Blue `#4DB8FF` (or close). Use it only for the active state, the primary action, progress, and System notices.
- Semantic: success `#4BE3A0`, warning `#F5B94A`, danger/penalty `#FF4D6A`, rare/level-up `#9B87FF`.
- Six stat colours appear **only** as small marks (dots, tiny bars, stat glyph tint), never as big fills: STR coral, AGI cyan, VIT green, INT violet, CHA rose, WLT gold. Ensure AA contrast on the dark base.

**Typography:**
- Display/HUD: a condensed technical face used in UPPERCASE with tracking, e.g. **"Saira Semi Condensed"** or **"Oxanium"**. Use it only for labels, headings and the System voice.
- Body/UI: **"Geist"** (or "Manrope").
- Numbers: **"Geist Mono"** or **"JetBrains Mono"** with tabular numerals. Numbers are heroes in this app (reps, XP, timers, levels), so give them large, confident sizes.
- **Banned:** Inter, Roboto, Arial, Space Grotesk, Orbitron, Poppins.
- Set a strict type scale (e.g. 11/13/15/17/22/28/40/64) and use nothing outside it.

**Shape and surface:**
- Radii are small and consistent: 6px for controls, 10px for cards, 0px on System windows. **No `rounded-2xl` on everything.**
- Elevation comes from luminance steps and hairlines, not drop shadows. **No glassmorphism or backdrop blur everywhere.** Blur only the tab bar and sheets.
- The **System Window** component, used only for System messages, has a 1px accent hairline, angular corner-bracket ticks, a subtle inner glow, a header row like `[ ! ] NOTIFICATION`, and a quick scan-line reveal animation on enter.
- Texture: an extremely faint grid or noise on the base layer (≤3% opacity). Optional and tasteful.

**Layout:**
- Mobile-first at 360–430px wide, plus a centred max-width phone frame on desktop.
- 16px side gutters and a 4/8px spacing grid. Respect safe-area insets (`viewport-fit=cover`).
- Primary actions sit in the **thumb zone**. A sticky bottom CTA sits above the tab bar when needed.
- Left-aligned, information-first layouts. **Not** everything centred.
- Use asymmetry deliberately on hero moments (Status screen level block, Gate header).

**Motion and feedback:**
- Spring-based and fast: 150–250ms for UI and 400–700ms for celebrations. Honour `prefers-reduced-motion`.
- Checking a quest: the box fills, a short line sweeps through, the XP chip ticks up (count-up), there's a light haptic (`navigator.vibrate(10)`) and an optional soft tick sound.
- Level-up: a full-screen takeover with the number morphing, the rank badge if the rank changed, and stat deltas. Skippable, at most 2.5s.
- Rest timer: a big circular countdown ring, with a haptic and chime at zero.
- Tab and page transitions: subtle horizontal slide or shared-element transitions. No bouncy gimmicks.
- Sounds: a tiny generated WebAudio set (tick, clear, level, warn), off by default and toggled in Settings.

**Anti-slop rules (any violation fails review):**
- No purple-to-blue gradients, no gradient text, no glowing everything, no glassmorphism cards, no emoji section markers.
- No generic hero, no "Welcome back 👋", no lorem ipsum, no fake placeholder metrics, no stock illustrations.
- No identical rounded cards stacked forever. Vary the rhythm: lists, rows, a hero number, a grid, a strip.
- No accent-bar-on-left-of-card cliché. No 01/02/03 numbering unless it's a real sequence (workout exercise order is a real sequence, so that's fine).
- Empty states are designed: they say what goes here and offer one action.
- Every interactive element has hover/pressed/focus/disabled states and a ≥44px hit target.
- Copy is short, plain and in the System's voice for notices ("Daily quest has arrived." "Penalty issued."). Normal UI copy is plain English.

## 4. Information architecture and screens

**Bottom tab bar (4 tabs):** TODAY · TRAIN · STATUS · QUESTS. Settings opens from the avatar/gear on Status.

1. **Awakening / Onboarding** (first run, 4 steps with a progress indicator)
   - (a) System notice: "You have met the conditions to become a Player. Accept?"
   - (b) Profile: name, weight, height, wake time, program start date (default Monday 2026-10-05), currency (default ₹), weekly savings amount.
   - (c) Starting point on each ladder (push/squat/pull), with a short visual description of each step.
   - (d) Pick daily quests from the library, grouped by area, with sensible defaults pre-selected and a counter warning if more than 12 are picked ("Start lean. Difficulty rises on its own.").
2. **TODAY: Daily Quest** (home)
   - Header: date, program week, deload badge, and a live reset countdown to midnight.
   - **Morning Status Check** card, shown until done: sleep hours, energy 1–5, soreness 1–5, sharp/joint pain yes/no. Result: Condition = OPTIMAL / FATIGUED / INJURED. Collapses to a small condition chip once done.
   - The **Daily Quest** System Window: an overall progress meter and `[done/total]`, with quests grouped (Training, Penalty, Body, Diet & Recovery, Face & Looks, Mind, Wealth, System Bonus). Each row has a checkbox, title, one-line detail, and an XP chip tinted with its stat. The Training row opens the Gate. The weigh-in row opens the Body Log sheet.
   - Streak and level mini-strip.
   - "Ask the System" button that generates AI bonus quests.
   - A one-line System message for the day.
3. **TRAIN: Gate**
   - Week strip (MON–SAT) with today marked. Gate header (rank-tinted "E-RANK GATE", name, condition/deload/recovery badges, estimated time, and a toggle between "Short on time (30 min)" and the full session).
   - Corrective warm-up checklist.
   - Exercise list (order matters, so numbered). Each card shows today's prescription (`4 × 11 reps`), its range, rest time, ladder progress pips and the "next unlock".
   - **Start Gate** opens **Focus Mode** (full-screen stack screen), with one exercise at a time:
     - Big target numbers, the form cue, and a link to a YouTube form tutorial.
     - Large set chips. Tapping one logs the target; long-pressing or tapping again opens a number stepper sheet.
     - An RPE selector (6–10) and a **Pain** button.
     - An auto-starting **rest timer ring**, with swipe or next/prev between exercises.
     - The screen stays awake (Wake Lock).
   - **Gate Cleared** summary screen: XP gained, per-stat deltas, and a "System log" of every progression change (target up, held, eased, skill unlocked, pain step-back). A level-up takeover follows if earned.
   - **Exercise Detail** (stack): how to do it, the full ladder with the current step, a history chart of best set per session, and the last 10 sessions.
   - Sunday: Rest Day screen (walk quest, optional mobility, preview of the next Gate).
4. **STATUS** (the character sheet, this app's signature screen)
   - Hero: a huge level number, a rank badge (E/D/C/B/A/S) as a distinctive geometric mark, the title, and an XP bar with `into / next`.
   - Six stats with values and a **radar chart**. Tapping a stat shows what feeds it and a 30-day trend.
   - Record strip: current streak, best streak, Gates cleared, 7-day adherence.
   - **Quest record heatmap** (12 weeks, GitHub-style, with a legend).
   - Skill ladders summary.
   - Body card: latest weight/waist/W:H with deltas and a weight trend line, plus a "+ Log" button that opens the Body Log sheet. Show a monthly progress-photo reminder (no photo storage needed in v1).
   - **Titles** gallery (equip one; locked ones are greyed with the unlock condition).
   - **Weekly System Report** (AI).
   - Entry to History (calendar of past days → day detail).
5. **QUESTS: Main Quests (long-term goals)**
   - Goal cards with stat, progress bar, `current / target` (money formatted in ₹ with Indian grouping), and days left. Tapping one opens Goal Detail (update value, history of updates, edit, delete).
   - "New main quest" sheet with templates: emergency fund, first strict pull-up, waist to 80 cm, read 12 books, 60-day skincare streak, ship a side project.
   - A Cleared section.
6. **Settings** (stack from Status)
   - Profile.
   - Daily quest library: toggle each habit on or off; tiered ones show `T1…Tn` with manual −/+.
   - Ladders: manual override.
   - Sound/haptics.
   - AI: on/off and a passcode field (see section 8).
   - Data: export backup JSON, import, export the training log as CSV in the same columns as the tracker's Log sheet (`Date, Day, Exercise, Variation used, Unit, Set 1..5, RPE, Notes`), and reset with a typed confirmation.
   - Install-app button (`beforeinstallprompt`).

**Global:** a toast/notification system styled as small System Windows, queued and dropping from the top. Sheets use Vaul with a drag handle. **No `alert()` or `confirm()`.**

## 5. Data model (TypeScript types in `src/engine/types.ts`, persisted in Dexie)

- `Profile` {name, weightKg, heightCm, wake "HH:MM", programStart ISO date, currency, saveWeekly, sound, haptics}
- `Player` {xp, level, statXp: Record<Stat, number>, bestStreak, titles: string[], equippedTitle, gatesCleared}
- `LadderProgress` {key: 'push'|'squat'|'pull', step, target, fails}
- `ExerciseProgress` {exerciseId, target, fails}
- `HabitConfig` {id, enabled, tier, since ISO date}
- `DayRecord` {date, quests: Quest[], readiness?: {sleep, energy, soreness, pain}, bonusAwarded, ratio?, closed, missed?, aiMessage?}
- `Quest` {id, area, stat, xp, title, detail, done, optional?, kind: 'gate'|'habit'|'penalty'|'ai'|'weigh'|'walk'}
- `Session` {id, date, planDay, name, mode: 'normal'|'recover'|'injured', quick, warmupDone, entries: {key, exerciseId, name, unit, side, target, sets: (number|null)[], rpe?, pain}[], xp, log: SystemLogLine[]}
- `Goal` {id, title, stat, unit, start, target, current, deadline?, updates: {date, value}[], done, doneAt?}
- `BodyEntry` {date, weightKg?, waistCm?, hipsCm?, note?}

Dates are local-time `YYYY-MM-DD` strings (the user is in Asia/Kolkata). Write timezone-safe helpers.

## 6. Content and plan data (encode in `src/data/`, cross-check against the docx/xlsx)

**Corrective warm-up, every training day (8 min):**
- Cat-cow: 10 reps
- Half-kneeling hip flexor stretch: 45 s/side
- Glute bridge: 2×12 with a 2 s squeeze
- Short foot exercise: 5×10 s/foot
- 90/90 hip switches: 8/side
- Dead bug: 2×8/side

The warm-up targets anterior pelvic tilt, knock knees and duck feet.

**Weekly plan** (exercise, sets, rest; ranges are reps unless stated):
- **MON Push + Core:**
  - Push-up [push ladder] 4 sets, 90 s
  - Pike push-up 3×6–10, 90 s
  - Bench/chair dips 3×8–12, 60 s
  - Scapular push-up 2×10, 45 s
  - Plank (posterior tilt) 3×30–60 s, 45 s
  - Hollow hold 3×15–30 s, 45 s
  - Quick mode keeps items 1, 2 and 6
- **TUE Legs: Squat + Glute Med:**
  - Squat [squat ladder] 4 sets, 90 s
  - Reverse lunge 3×8–12/side, 60 s
  - Side-lying leg raise 3×15–20/side, 45 s
  - Lateral walk 3×12 steps/side, 45 s
  - Calf raise 3×15–20, 45 s
  - Bird dog 3×8–12/side, 45 s
- **WED Pull + Core:**
  - Pull [pull ladder] 4 sets, 90 s
  - Inverted/table row 3×8–12, 75 s
  - Dead hang 3×20–40 s, 60 s
  - Prone Y-T-W 2×10, 45 s
  - Hanging/lying knee raise 3×8–12, 45 s
  - Side plank 3×20–40 s/side, 45 s
- **THU Legs: Hinge + Mobility:**
  - Single-leg glute bridge 4×8–15/side, 60 s
  - Single-leg RDL 3×8–12/side, 60 s
  - Cossack squat 3×6–10/side, 60 s
  - Copenhagen plank (short lever) 3×15–30 s/side, 45 s
  - Deep squat hold 3×45–60 s, 30 s
  - Adductor rock-back 2×10/side (mobility)
- **FRI Full-Body Skill Circuit** (3 rounds, minimal rest, logged only and never progresses targets):
  - Push (best variation, cap 10)
  - Squat (cap 15)
  - Pull (cap 8)
  - Hollow hold 20 s
  - Hip flexor stretch 45 s/side
  - Lying hamstring stretch 30–45 s/side
- **SAT Combat Conditioning + Posture:**
  - Shadowboxing 3×3 min, 60 s
  - Sprawl 3×8–12, 60 s
  - Bear crawl 3×20–40 s, 45 s
  - Thoracic extension over chair 8 reps
  - Hip flexor stretch 45 s/side
- **SUN:** rest. Walk 30–40 min (8–10k steps); optional cat-cow and hip flexor stretch.

Each exercise has a one-line form cue taken from the docx. Each has a YouTube link: `https://www.youtube.com/results?search_query=<name>+form+tutorial`.

**Ladders** (each step has its own range; level-up happens when every set hits the top):
- **Push** (6–15, wall starts at 8): Wall → Incline → Knee → Full → Decline/Diamond.
- **Squat:**
  - Box squat 10–15
  - Bodyweight squat 10–15
  - Tempo squat (3-1-1) 8–15
  - Split squat 8–10/side
  - Bulgarian split squat 8–10/side
  - Assisted pistol/shrimp 3–8/side
- **Pull:**
  - Dead hang 20–40 s
  - Scapular pull-up 6–10
  - Negative pull-up 2–5
  - Band-assisted 4–8
  - Full pull-up 3–10

**Habit library** (id, stat, base XP, area, tiers → title). Tiers start at T1.
- **FACE (CHA):**
  - AM skincare (cleanse · moisturise · SPF 30+)
  - PM skincare
  - Chin tucks 2×[10,12,15,20]
  - Grooming check (Sundays)
  - Progress photos (first Sunday of the month)
- **DIET (VIT):**
  - Protein [1.2,1.4,1.6,1.8] g/kg → shown as grams from body weight, rounded to 5. Detail lists Indian sources: eggs, dal, paneer, curd, chicken, soya.
  - Water [2,2.5,3,3.5] L
  - Fruit/veg [3,4,5] servings
  - No junk or sugary drinks
  - Lights out by (wake − 8h) for 7.5 h of sleep
- **BODY (AGI):** Steps [6k,7k,8k,9k,10k].
- **MIND (INT):**
  - Read [10,15,20,25,30] pages
  - Deep work [25,45,60,90] min
  - Social media under [90,75,60,45,30] min
  - Journal 3 lines
  - Meditate [5,10,15] min
- **WEALTH (WLT):**
  - Log every expense
  - No impulse buys (48 h rule)
  - Pay yourself first: ₹saveWeekly (Mondays)
  - Income-skill block [30,45,60] min
- **Default on:** AM/PM skincare, protein, water, sleep, steps, read, deep work, social limit, expenses, grooming, save, photos.

No pseudo-science (no mewing, no jaw-exercise claims, no supplements, no crash dieting).

## 7. Game and progression rules (pure functions with unit tests)

- **Prescription:**
  - Target = the stored target clamped to the current range.
  - Deload every 6th program week: −1 set (minimum 2).
  - FATIGUED condition: recovery mode, with −1 set (minimum 2) and an RPE ≤ 7 note.
  - INJURED: warm-up and mobility only; the gate can still be cleared.
  - Short-on-time mode: warm-up + the quick subset.
- **Double progression after a session** (per exercise logged; skipped exercises don't change):
  - **Pain flagged:** ladder steps back one (target = bottom of that step's range), or the target resets to the range bottom. Log "If it persists, see a physio."
  - **All prescribed sets ≥ target AND RPE < 10 AND not in recovery mode:**
    - At the range top on a ladder: unlock the next step, target = its range bottom, +60 XP, and a "SKILL UNLOCKED" message.
    - At the range top otherwise: "mastered, slow the tempo".
    - Otherwise: target += 1 rep (or 5 s for holds), capped at the top.
  - **Missing sets, or any set below target − 2 (reps) / − 10 s (holds):** fails += 1. At 2 fails, target −= 2 increments (floor at range bottom) and fails resets.
  - **Otherwise:** hold.
  - Circuit, mobility and fixed-range items never progress.
- **Habit tiers:** evaluated daily for each enabled tiered habit whose `since` is ≥ 7 days ago, over the last 7 days (a missed/unopened day counts as appeared-but-not-done; need ≥ 4 appearances).
  - Completion ≥ 85%: tier +1 → "QUEST DIFFICULTY UP" notice.
  - Completion < 40%: tier −1.
  - Changing a tier resets `since`.
- **Daily close-out** (runs on app open for every unevaluated past day since joining): ratio = done / non-optional quests. Days with no record are missed (ratio 0).
  - Yesterday < 50%: today gets a **Penalty quest** ("20-min brisk walk") and a red PENALTY ISSUED notice.
  - Yesterday ≥ 80%: "streak continues".
- **Streak:** consecutive days ≥ 80%, plus today if already ≥ 80%.
- **Rewards:**
  - 100% of today's quests: +30 XP bonus once, "DAILY QUEST COMPLETE".
  - Gate XP: 4 per logged set to that exercise's stat, +2 per warm-up item to AGI, +25 clear bonus to STR.
  - A goal cleared gives +200 XP to its stat.
- **Levels and ranks:**
  - XP needed from level L to L+1 = 60 + 40·L.
  - Rank: E (1–9), D (10–19), C (20–34), B (35–49), A (50–69), S (70+).
  - Displayed stat value = 10 + floor(statXp / 40).
- **Titles:** The Awakened, Gate Breaker (first gate), Flawless (100% day), Iron Will (7-day streak), Unbreakable (30-day streak), Dungeon Regular (25 gates), Ascender (any ladder step), Grounded (full push-up), Bar Conqueror (full pull-up), Scholar (INT 25), Treasurer (WLT 25), Magnetic (CHA 25), Quest Finisher (goal cleared), Rising Hunter (level 10).
- The day rolls over at local midnight while the app is open (visibilitychange + timer).

## 8. AI "System" (Vercel serverless; the key never reaches the browser)

- `api/system.ts` (Vercel function) accepts `{ type: 'quests' | 'report', context }` plus an `x-app-passcode` header that must equal `APP_PASSCODE` (env), because the URL is public.
- Use the Anthropic SDK with `ANTHROPIC_API_KEY` and `AI_MODEL` (default `claude-haiku-4-5`). Make the provider swappable behind a small adapter (Gemini/OpenAI via env).
- Add a simple per-IP rate limit (in-memory is fine) and validate input and output with **zod**.
- `quests` returns `{message, quests:[{title ≤6 words, detail, stat, xp 5–30}]}`, 2–4 items. Clamp and sanitise on the server. They are added as the "System Bonus" group, replacing undone AI quests.
- `report` returns plain text with STATUS / STRENGTHS / WEAK POINTS / NEXT WEEK. Render it nicely, not as a raw blob.
- **System prompt rules:**
  - Terse game-System voice.
  - Never change sets/reps/loads (the engine owns training).
  - No crash diets, fasting protocols, supplements, medications or unproven face hacks.
  - Respect readiness (fatigue/pain means recovery).
  - Quests must be specific, measurable, under 45 min and different from today's existing quests.
  - Target the weakest stats, the missed quests of the last 7 days and open goals.
- **Context sent:** profile basics, week, deload, condition, today's gate, ladder states, today's quests, last-7-day completion and missed titles, open goals, recent sessions. No API keys and no free-text personal notes.
- **UI:**
  - Loading state is a System "analysing…" scan animation.
  - Errors appear as a warning toast with a clear fix ("Set APP_PASSCODE in Settings").
  - The app works fully with AI disabled.

## 9. PWA, performance, accessibility

- Installable (manifest, icons 192/512/maskable, generated from an SVG mark you design: an angular glyph, not a letter in a circle), offline-capable, and auto-update with a "New version available, Reload" toast.
- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, PWA installable.
- Self-host fonts via `@fontsource` (no runtime Google Fonts dependency offline).
- Semantic HTML, visible focus, labels on every control, AA contrast, reduced-motion support, and screen-reader text for the radar/heatmap.
- No layout shift and no horizontal scroll at 360px.

## 10. Repo quality

- Folder structure: `src/app` (router, providers), `src/screens/*`, `src/components/ui` (primitives), `src/components/system` (SystemWindow, Toast, LevelUp…), `src/engine` (pure logic + tests), `src/data` (plan, habits, titles), `src/db` (Dexie + repositories), `src/lib` (dates, format, sound, haptics), `api/`.
- ESLint + Prettier, strict TS, no `any`. Keep components small. No dead code.
- Add `README.md` covering: run locally, env vars (`ANTHROPIC_API_KEY`, `AI_MODEL`, `APP_PASSCODE`), deploy to Vercel (import repo → set env → deploy), install on Android Chrome (⋮ → Install app) and iOS Safari (Share → Add to Home Screen), and backup/restore.
- Seed script / dev toggle: `?demo=1` loads 3 weeks of realistic sample history so I can review every screen populated. It must be clearly marked as demo data and never on by default.

## 11. Definition of done

- Every screen in section 4 exists, works offline, and has been screenshotted at 390×844 and 360×780 and critiqued against section 3 and the anti-slop list.
- `/impeccable audit` reports no high-severity issues, and `/impeccable polish` has been run on every screen.
- All engine tests pass. A Playwright e2e test covers onboarding → status check → check quests → run a Gate in Focus Mode → Gate Cleared → level-up → next-day penalty.
- `npm run build` is clean and deploys to Vercel. The app installs on Android Chrome and launches standalone.
- Finish by showing me final screenshots of: Today, Gate, Focus Mode, Gate Cleared, Status, Main Quests, Settings, Onboarding step 1, and the Level-up takeover.
