# Player System: Build Plan

Status: **Phase 1 approved 2026-10-06. Phase 2 in progress.**
Date: 2026-10-06 (program week 1, day 2; program start Mon 2026-10-05).

---

## 0. What I read and what I found

**Sources read**
- Brief (sections 0 to 11).
- Skills:
  - `impeccable` (SKILL.md + `init`). Context loader run, no PRODUCT.md existed, so `init` was done and PRODUCT.md is written.
  - taste-skill: `design-taste-frontend`, `full-output-enforcement` (in `~/.agents/skills/`). `redesign-existing-projects` doesn't apply because this is greenfield.
- `Calisthenics_Plan_Daily_Reference.docx`, fully extracted with mammoth.
- `Calisthenics_Tracker.xlsx`, all 7 sheets extracted with SheetJS: Start Here, Plan, Log, Consistency, Progress, Body, Lists.

**Housekeeping**
- `./docs` was empty. The two files were in `~/Downloads`, so I copied them into `./docs/`.
- taste-skill isn't in the repo. It's installed globally in `~/.agents/skills/`.

**How the skills apply (brief wins on aesthetics, as instructed)**
- Impeccable mode is **Operate** (app UI). Platform is `web`. No image generation is available, so the build is **code-first**.
- taste-skill describes itself as scoped to landing pages. I'll apply its anti-slop bans and dials (6/6/5). Where it conflicts with the brief, the brief wins:
  - Dark-only, with no light mode.
  - Custom SVG for the app mark, rank badges and charts.
  - Progress bars with tracks are fine.
  - Uppercase tracked HUD labels are part of the system, but rationed to System moments and section heads.
- Adopted from taste-skill: zero em/en dashes in UI copy, no decorative dots, no Inter, no glows by default, and the copy self-audit.
- Impeccable's "bounded verification passes" and the brief's per-screen screenshot loop combine like this: for each screen, run one batched shot round (390 + 360), fix everything in one batch, then run one confirm round.

**Your answers (2026-10-06)**
1. **Primary phone:** Android / Chrome. iOS gets fallbacks.
2. **Stat mapping:** strength → **STR**. Core, corrective, posture, mobility and combat → **AGI**.
3. **Quick mode subsets:** as proposed (§6.3).

---

## 1. Stack (pinned majors)

| Area | Package | Version | Note |
|---|---|---|---|
| Build | `vite` | 8.x | `@vitejs/plugin-react` 6 |
| UI | `react`, `react-dom` | 19.x | |
| Routing | `react-router` | **7.18.x** | npm `latest` is v8. Staying on v7: it's what the brief specifies, it's mature, and v8 has nothing we need. Decided. |
| Styling | `tailwindcss`, `@tailwindcss/vite` | 4.x | Default palette wiped with `--color-*: initial`; only tokens exist |
| Motion | `motion` (`motion/react`) | 14.x | |
| Primitives | `@radix-ui/react-dialog`, `-switch`, `-slider` | latest | Unstyled, skinned from tokens |
| Sheets | `vaul` | 1.1.x | React 19 peer OK |
| State | `zustand` | 5.x | UI state only |
| Data | `dexie`, `dexie-react-hooks` | 4.x | Repository layer on top |
| Icons | `@phosphor-icons/react` | 2.x | Thin/regular weights only |
| Fonts | `@fontsource/saira-semi-condensed` or `@fontsource-variable/oxanium`, `@fontsource-variable/geist`, `@fontsource-variable/geist-mono` | 5.x | Self-hosted. The display face is chosen in Phase 2 |
| PWA | `vite-plugin-pwa` + `@vite-pwa/assets-generator` | 2.x | `generateSW`, `registerType: 'prompt'` |
| Validation | `zod` | 4.x | Server I/O + backup import |
| AI | `@anthropic-ai/sdk` | latest | Server only |
| Test | `vitest`, `fake-indexeddb`, `@playwright/test` | 5.x / 1.6x | |
| Dev only | `mammoth`, `xlsx`, `tsx` | | Docs cross-check script |
| Lint | `eslint` (flat) + `typescript-eslint` strict + `eslint-plugin-react-hooks` + `prettier` | | `no-explicit-any` = error |

No other runtime dependencies without asking.

---

## 2. Screen map

```
/onboarding/:step          1 Accept · 2 Profile · 3 Ladders · 4 Quests        (no tab bar)

<TabsLayout>               bottom tab bar: TODAY · TRAIN · STATUS · QUESTS
├─ /today                  Daily Quest (home)
├─ /train                  Gate (Mon-Sat) | Rest Day (Sun)
│   └─ /train/exercise/:id     Exercise Detail
├─ /status                 Character sheet
│   ├─ /status/history         Calendar of past days
│   │   └─ /status/history/:date   Day detail
│   └─ /status/report          Weekly System Report (AI)
├─ /quests                 Main Quests (open + cleared)
│   └─ /quests/:goalId         Goal Detail
└─ /settings               Settings root (entered from Status)
    ├─ /settings/profile
    ├─ /settings/habits        Daily quest library + tiers
    ├─ /settings/ladders       Manual override
    └─ /settings/data          Backup / import / CSV / reset

/gate/focus                Focus Mode (full-screen, no tab bar, wake lock)
/gate/cleared/:sessionId   Gate Cleared summary (full-screen)
/kit                       Hidden component kit (unlinked)
```

**Overlays (global, not routes):**
- Sheets (Vaul):
  - Body Log
  - Set stepper
  - New main quest
  - Stat detail (what feeds it + 30-day trend)
  - Title detail
  - Readiness edit
  - Ask the System results
  - Confirm-reset
- Level-up takeover.
- System toast queue.

**Route guards:** no profile → `/onboarding/1`. `/` → `/today`.

---

## 3. Navigation model

- **Per-tab stacks.** Each tab remembers its last location (Zustand `tabStacks`). Tapping the active tab pops to its root and scrolls to top. Scroll position is restored per path.
- **Transitions:**
  - Push/pop within a tab: a 24px horizontal slide plus fade (spring, ~220ms). Direction comes from stack depth.
  - Tab switch: a 120ms cross-fade, with no slide (tabs are siblings, not a stack).
  - Focus Mode: rises from the Start Gate button.
  - Reduced motion: instant swaps.
- **Hardware back on Android:** back closes the topmost sheet or takeover before it navigates. Opening a sheet pushes a history entry, and `popstate` closes it. Back from a tab root goes to `/today`, then exits.
- **Chrome per route:** a route `handle` declares `{ chrome: 'tabs' | 'none', cta?: … }`. The tab bar and sticky CTA read it, so Focus Mode, Cleared and Onboarding hide the tab bar.
- **Day rollover:** a `useClock` store ticks at local midnight (timer plus a `visibilitychange` re-check). It re-runs close-out and rebuilds today without a reload.

---

## 4. Data model

### 4.1 Types (`src/engine/types.ts`)

The brief's types are kept verbatim. Additions are marked **+** with the reason.

```ts
type Stat = 'STR' | 'AGI' | 'VIT' | 'INT' | 'CHA' | 'WLT';
type ISODate = string;             // local 'YYYY-MM-DD'
type Condition = 'OPTIMAL' | 'FATIGUED' | 'INJURED';
type Area = 'training' | 'penalty' | 'body' | 'diet' | 'face' | 'mind' | 'wealth' | 'bonus';

Profile        { name, weightKg, heightCm, wake: 'HH:MM', programStart: ISODate, currency, saveWeekly,
                 sound, haptics,
                 + aiEnabled: boolean, + joinedAt: ISODate }      // joinedAt bounds close-out
Player         { xp, level, statXp: Record<Stat, number>, bestStreak, titles: string[],
                 equippedTitle, gatesCleared }                     // cache, rebuilt from ledger
LadderProgress { key: 'push'|'squat'|'pull', step, target, fails }
ExerciseProgress { exerciseId, target, fails }
HabitConfig    { id, enabled, tier, since: ISODate }
DayRecord      { date, quests: Quest[], readiness?: { sleep, energy, soreness, pain },
                 bonusAwarded, ratio?, closed, missed?, aiMessage?,
                 + condition?: Condition, + quick?: boolean }
Quest          { id, area, stat, xp, title, detail, done, optional?,
                 kind: 'gate'|'habit'|'penalty'|'ai'|'weigh'|'walk',
                 + habitId?, + tier?, + doneAt? }
Session        { id, date, planDay, name, mode: 'normal'|'recover'|'injured', quick, warmupDone,
                 entries: { key, exerciseId, name, unit, side, target, sets: (number|null)[], rpe?, pain }[],
                 xp, log: SystemLogLine[],
                 + deload: boolean, + warmup: boolean[] }
Goal           { id, title, stat, unit, start, target, current, deadline?, updates: {date, value}[],
                 done, doneAt? }
BodyEntry      { date, weightKg?, waistCm?, hipsCm?, note? }

+ XpEvent      { id, date, at, stat: Stat | null, amount, source: 'quest'|'gate'|'bonus'|'unlock'|'goal',
                 ref: string }
+ Meta         { key, value }   // schemaVersion, lastClosed, lastTierEval, aiPasscode, demo, installDismissed
```

**Why an XP ledger.**
- Unchecking a quest has to remove exactly the XP it gave.
- The "30-day stat trend" and "what feeds this stat" views need history.
- Titles need provable thresholds.
- `Player` is a cached sum of the ledger, rebuilt in one pure function, so it can never drift.
- Level and rank are derived from total XP. Unchecking can lower the level. The level-up takeover only fires on increases.

### 4.2 Dexie schema (v1)

```
profile:   'id'                    // single row 'me'
player:    'id'
ladders:   'key'
exercises: 'exerciseId'
habits:    'id'
days:      'date'
sessions:  'id, date'
goals:     'id, done'
body:      'date'
xp:        'id, date, stat, [source+ref]'
meta:      'key'
```

- **Two databases:** `player-system` (real) and `player-system-demo` (`?demo=1`). Demo can never touch real data.

### 4.3 Repository layer (`src/db/`)

- `db.ts` holds the Dexie class.
- `repos/*.ts` define narrow async interfaces: `days.get/put/range`, `sessions.byDate/put`, and so on. They're implemented on Dexie, with types only from `engine/types`.
- `hooks.ts` provides live-query hooks (`useToday()`, `usePlayer()`…) built on `dexie-react-hooks`.
- **Commands** (`src/app/commands/`) are the only place engine + repos + side effects meet:
  - `checkQuest`
  - `submitReadiness`
  - `clearGate`
  - `logBody`
  - `updateGoal`
  - `closeOutDays`
  - `evaluateTiers`
  - `askSystem`
  
  Each runs in one Dexie transaction, then emits UI events (toast, level-up, sound, haptic) through the Zustand event bus.
- **Backup:** a JSON export of every table plus `schemaVersion`. Import is validated with zod, applied atomically, and preceded by an auto-backup download.

---

## 5. Engine (`src/engine/`, pure TS, no React, no Dexie)

| Module | Responsibility | Tests cover |
|---|---|---|
| `dates` (in `src/lib/dates.ts`, used by engine) | Local `YYYY-MM-DD` math, `programWeek`, `planDay`, `isDeloadWeek` (week % 6 === 0), `msToMidnight` | Asia/Kolkata **and** a DST zone (tests run twice: `TZ=Asia/Kolkata`, `TZ=America/New_York`) |
| `levels` | `xpToNext(L)=60+40L`, `levelFromXp`, `rank(L)`, `statValue=10+floor(statXp/40)` | Boundaries 9/10, 19/20, 34/35, 49/50, 69/70 |
| `readiness` | Condition from the morning check | §7 table |
| `prescription` | Target clamp, deload −1 set (min 2), FATIGUED −1 set + RPE ≤ 7 note, INJURED = warm-up + recovery flow, quick subset, circuit caps | Each modifier and combinations (deload + fatigued + quick) |
| `progression` | Double progression per exercise and ladder: pain step-back, unlock, mastered, +1 rep / +5 s, fail counting, −2 increments, never-progress items | Every branch in §7 of the brief, reps vs holds, per-side, skipped vs missing sets |
| `xp` | Gate XP (4/set to the exercise stat, +2/warm-up item AGI, +25 clear STR), unlock +60, goal +200, daily bonus +30 | Totals, idempotent bonus |
| `ledger` | Fold `XpEvent[]` → `Player` cache | Undo, ordering |
| `quests` | Build today's quests from enabled habits, the gate, penalty, weigh-in, walk and AI; tiered titles and details (protein grams from weight rounded to 5, lights-out time = wake − 8 h) | Scheduled habits (Sun / Mon / first Sunday of month), tier text |
| `tiers` | 7-day evaluation, ≥4 appearances, ≥85% up, <40% down, `since` reset, min/max tier | Edge windows, unopened days count as not done |
| `closeout` | For every unevaluated past day since `joinedAt`: ratio, missed, penalty for today if yesterday < 50%, streak notice if ≥ 80% | Gaps, first day, multiple days offline |
| `streak` | Consecutive ≥ 80% days, plus today if already ≥ 80%; best streak | Today partial vs complete |
| `titles` | 14 titles, each a pure predicate over state | Each unlock condition |
| `adherence` | 7-day adherence, 12-week heatmap cells, missed titles for AI context | |
| `csv` | Training log → tracker Log columns | Exact header and row format |

**Engine rule details I'm proposing (not specified in the brief; please confirm or change):**

- **Condition.**
  - INJURED if pain = yes.
  - Otherwise FATIGUED if sleep < 6 h, or energy ≤ 2, or soreness ≥ 4.
  - Otherwise OPTIMAL.
- **INJURED session.** Warm-up plus a fixed recovery flow drawn from the plan's mobility items: hip flexor stretch, lying hamstring stretch, thoracic extension, adductor rock-back. Nothing progresses, and the gate can still be cleared.
- **Pull ladder at step 1 (Dead hang).** Wednesday item 3 is also Dead hang, so while you're on step 1 I'll drop item 3 to avoid a duplicate block.
- **Level-up "every set at the top".** This means every *prescribed* set: 4 normally, 3 on deload. The docx says 3 × 15, but the plan prescribes 4 sets, so 4 × top is the stricter, consistent reading.
- **Friday circuit ladder items.** The target is min(ladder target, cap), with caps of 10, 15 and 8. It's logged as one set per round and never progresses.
- **Daily bonus.** It's awarded once per day and kept even if you later uncheck a quest. The +30 is total XP only, with no stat.
- **Penalty quest.** "20-min brisk walk", 10 XP to AGI, non-optional, so it counts toward the day's ratio.

---

## 6. Content data (`src/data/`)

### 6.1 Files
- `plan.ts`: warm-up, the six days, quick subsets, recovery flow.
- `exercises.ts`: id, display name, **tracker name**, unit, per-side, stat, range, rest, cue, the docx form-guide steps, and a YouTube search URL.
- `ladders.ts`: push, squat and pull steps with ranges and how-to text.
- `habits.ts`: the habit library.
- `titles.ts`: title id, name and unlock condition text.
- `templates.ts`: main-quest templates.
- `systemCopy.ts`: every System-voice string in one place.

### 6.2 Cross-check: docs vs brief

Ranges follow one pattern: **bottom = the docx starting dose, top = the tracker's Lists level-up target**. Every exercise matches that pattern except these:

| Item | docx / xlsx | Brief | Resolution |
|---|---|---|---|
| Sprawl | 3 × 8, no Lists target | 3 × 8-12 | Brief wins: it progresses |
| Bear crawl | 3 × 20 s, no Lists target | 3 × 20-40 s | Brief wins: it progresses |
| Pull (main) | 4 × 5-10, Lists target 8 | Per-ladder-step ranges | Ladder ranges win |
| Push (main) | 4 × 6-12, Lists 15, rule 3 × 15 | 6-15 (wall 8-15) | Brief (matches Lists) |
| Level-up rule | "3 × 15" | Every set at top | Every prescribed set (§5) |
| Friday rests | 0-15 s between moves, 90 s after each round | "minimal rest" | Focus timer: 15 s between moves, 90 s after each round |
| Adductor rock-back, Thoracic ext. | rest "-" | none | No auto rest timer |
| **Desk breaks** (docx daily checklist) | "every 45-60 min: 10 glute squeezes + hip flexor stretch" | Not in library | **Decided:** added as a daily AGI habit, **on by default** (8 XP) |
| **Monthly posture checks** (Body sheet) | Wall test, squat knee tracking, foot angle | Not in brief | **Decided:** a monthly reminder on the Body card, shown as a checklist with no photo storage |
| Log CSV | Sheet has Total, Best set, Level-up? formula columns too | `Date, Day, Exercise, Variation used, Unit, Set 1..5, RPE, Notes` | Brief's columns. Exercise names use the **tracker's exact names** ("Push-up (any variation)") and Variation = ladder step name, so rows paste into the tracker's dropdown. Units use tracker strings (`reps`, `sec`, `reps / side`, `sec / side`, `steps / side`, `rounds`). Per-side values are one side. Warm-up isn't exported. |

A dev script, `npm run check:plan`, re-parses both docs and asserts that `src/data` matches them (names, sets, rests, range bottoms and tops, cues), with the reviewed exceptions above whitelisted. I'll also run it as a Vitest test whenever `docs/` is present.

### 6.3 Quick mode (confirmed)
| Day | Items |
|---|---|
| Mon | 1 Push-up · 2 Pike push-up · 6 Hollow hold |
| Tue | 1 Squat · 2 Reverse lunge · 6 Bird dog |
| Wed | 1 Pull · 2 Inverted row · 5 Knee raise |
| Thu | 1 SL glute bridge · 2 SL RDL · 5 Deep squat hold |
| Fri | Circuit items 1-4, 2 rounds (finisher kept) |
| Sat | 1 Shadowboxing (2 rounds) · 2 Sprawl · 3 Bear crawl |

### 6.4 Stat mapping (confirmed rule, applied per exercise)
- **STR:**
  - Push, squat and pull ladders.
  - Pike push-up, dips, scapular push-up.
  - Reverse lunge, calf raise.
  - Inverted row, dead hang (grip, the pull-ladder base).
  - SL glute bridge, SL RDL, Cossack squat.
- **AGI:**
  - Plank, hollow hold, bird dog, side plank, knee raise (core).
  - Side-lying leg raise, lateral walk (glute-med corrective).
  - Prone Y-T-W, thoracic extension (posture).
  - Copenhagen plank, deep squat hold, adductor rock-back, stretches (mobility).
  - Shadowboxing, sprawl, bear crawl (combat).

### 6.5 Habit XP (proposed; the brief names "base XP" but gives no values)

Tiered habits get +2 XP per tier above T1.

| Habit | Stat | XP |
|---|---|---|
| AM skincare / PM skincare | CHA | 8 / 8 |
| Chin tucks | CHA | 8 |
| Grooming check (Sun) | CHA | 10 |
| Progress photos (1st Sun) | CHA | 15 |
| Protein | VIT | 12 |
| Water | VIT | 8 |
| Fruit/veg | VIT | 8 |
| No junk | VIT | 10 |
| Lights out | VIT | 12 |
| Steps | AGI | 12 |
| Desk breaks (daily, docx checklist) | AGI | 8 |
| Read | INT | 12 |
| Deep work | INT | 15 |
| Social limit | INT | 10 |
| Journal | INT | 6 |
| Meditate | INT | 8 |
| Log expenses | WLT | 8 |
| No impulse buys | WLT | 8 |
| Pay yourself first (Mon) | WLT | 20 |
| Income-skill block | WLT | 15 |
| Weigh-in (monthly, see below) | VIT | 10 |
| Sunday walk | AGI | 15 |
| Penalty walk | AGI | 10 |

**Pacing check at 100% adherence (~250 XP/day):** Lv 10 around day 10, Lv 20 around week 5, Lv 35 (B) around month 4, Lv 50 (A) around month 7, Lv 70 (S) around month 13. Early levels come fast, which is good for the hook, and S-rank takes about a year.

**Onboarding "more than 12" counter.** This counts **daily** quests: the gate plus daily habits. Weekly and monthly ones (grooming, save, photos, weigh-in) are excluded. The defaults come to 12 (the gate plus 11 daily habits, including desk breaks), so the warning doesn't fire on first run.

**Weigh-in (decided).** A weigh-in quest appears every **4 weeks** from program start (the Monday of weeks 1, 5, 9…). Settings has an option for **every 8 weeks**. Body metrics can still be logged any time from the Body card on Status. Profile gains `+ weighEvery: 4 | 8` (weeks).

---

## 7. Folder structure

```
api/
  system.ts                 Vercel function (passcode, rate limit, zod, provider adapter)
  _lib/providers/{anthropic,openai,gemini}.ts   (OpenAI/Gemini via fetch, no extra SDKs)
  _lib/{prompt,schema,ratelimit}.ts
docs/                       source plan + tracker
public/                     icons (generated), mark.svg
scripts/                    check-plan.ts, gen-icons, shots.ts
src/
  app/        router.tsx, providers.tsx, TabsLayout.tsx, commands/, stores/ (ui, clock, events)
  screens/    onboarding/, today/, train/ (gate, focus, cleared, exercise, rest), status/ (+history, report),
              quests/, settings/, kit/
  components/
    ui/       Button, IconButton, Checkbox, Chip, Stepper, Switch, Slider, Field, Segmented, Sheet,
              ProgressBar, Ring, Pips, Badge, ListRow, SectionHead, EmptyState, Skeleton
    system/   SystemWindow, Toast/ToastHost, LevelUpTakeover, ScanLoader, RankBadge, Mark
    charts/   Radar, Sparkline, LineChart, Heatmap, RestRing
  engine/     *.ts + *.test.ts
  data/       plan, exercises, ladders, habits, titles, templates, systemCopy
  db/         db.ts, repos/, hooks.ts, backup.ts, demo/seed.ts
  lib/        dates, format (₹ Indian grouping, durations), sound (WebAudio), haptics, wakeLock, install, ai
  styles/     tokens.css (@theme), base.css, fonts.ts
tests/e2e/    onboarding-to-penalty.spec.ts, screenshots.spec.ts
DESIGN.md · PRODUCT.md · PLAN.md · README.md · vercel.json
```

---

## 8. Phases and checkpoints

| # | Phase | Output | Gate |
|---|---|---|---|
| 1 | **Plan** | PRODUCT.md, PLAN.md, docs in `./docs` | **Checkpoint: your review (now)** |
| 2 | **Design system** | Scaffold (Vite/TS strict/Tailwind 4/ESLint/Prettier/Vitest/Playwright/fonts). Impeccable new-work for the visual world, then DESIGN.md (tokens, type scale 11/13/15/17/22/28/40/64, spacing, radii 6/10/0, elevation by luminance, motion, component inventory, do/don't). Tokens + primitives + System Window + `/kit` with every state. Shots at 390×844 + 360×780, then critique + audit + fixes. | **Checkpoint: kit screenshots** |
| 3 | **Engine** | All §5 modules + `src/data` + `check:plan`. Vitest written per rule before UI use. Two TZ runs. | `npm test` green |
| 4 | **Shell + data** | Dexie + repos + commands + ledger. Router, tab stacks, transitions, back handling. Toast queue, sheets, level-up takeover. Clock/rollover. `?demo=1` seed (3 weeks, deterministic PRNG, separate DB, persistent "DEMO DATA" marker + exit) | Shell shots |
| 5 | **Screens**, one at a time: Onboarding → Today → Gate → Focus Mode → Gate Cleared → Exercise Detail → Rest Day → Status (+ stat sheet, titles, body, heatmap) → History + Day detail → Main Quests + Goal Detail + New sheet → Settings (+ subpages). | Each screen: shot at 390 + 360, critique, one fix batch, confirm shot, `/impeccable polish` | Shots posted as I go (non-blocking) |
| 6 | **AI + PWA + ship** | `api/system.ts` + client + Ask the System + Weekly Report. PWA (manifest, icons from the mark, offline shell, update toast, install button). E2E: onboarding → status check → quests → Focus Mode gate → Cleared → level-up → next-day penalty (Playwright clock). Lighthouse. Final `/impeccable audit`. README. Vercel config. | Final screenshot set (§11 list) |

**Verification standards for every screen:**
- No horizontal scroll at 360.
- 44px hit targets.
- AA contrast, checked by computing token pairs in a test.
- Reduced-motion pass.
- Copy self-audit (no em-dashes, no slop strings).

---

## 9. Risks and mitigations

- **Wake Lock** needs a user gesture and is released when the tab is hidden. I'll re-acquire it on `visibilitychange` and show a small indicator when it's held.
- **Midnight during a Gate.** A session belongs to the date it started on, and Focus Mode keeps that date until it's cleared.
- **IndexedDB eviction.** I'll call `navigator.storage.persist()` after install, and show a backup reminder in Settings if more than 14 days pass without a backup.
- **AI cost and abuse.** Passcode header, a per-IP limit (e.g. 10/hour, in memory per instance), output clamping, and a timeout. The app stays fully functional with AI off.
- **Vercel deploy** needs your Git remote and Vercel account. I'll make the repo deploy-ready (`vercel.json`, env docs). You do the import and set the env vars, or tell me if the `vercel` CLI is logged in here.

---

## 10. Decisions log

- 2026-10-06, Phase 1 review:
  - React Router: stay on v7.
  - Desk-break habit: added, on by default.
  - Posture checks: monthly reminder, no photos.
  - Weigh-in: every 4 weeks by default, with an 8-week option.
  - Proposed rules in §5 and §6.5: accepted as written.
  - Git: branch `main`, commit at the end of each phase.
