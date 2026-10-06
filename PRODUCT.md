# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Installable PWA, portrait, `display: standalone`. Primary device: Android phone running Chrome (confirmed). iOS Safari is a supported secondary target with graceful fallbacks (no vibration API, install through Share → Add to Home Screen). Desktop renders a centred phone frame for review only.

## Stack

User-specified: Vite + React 19 + TypeScript (strict), React Router 7 data router, Tailwind CSS 4 with tokens in `@theme`, Motion, Radix primitives (dialog, switch, slider) styled from scratch, Vaul sheets, Zustand, Dexie (IndexedDB) behind a repository layer, Phosphor icons, hand-built SVG charts, vite-plugin-pwa, Vitest, Playwright. Deployed on Vercel as an SPA plus one serverless function (`api/system.ts`) for AI.

## Users

One person: the owner. An AI engineer in India (Asia/Kolkata, ₹), running a deliberate self-improvement programme across training, face and grooming, diet and recovery, intellect, and finances. Main moments of use: a morning check-in, short checks during the day, a 30 to 45 minute home bodyweight session six days a week with the phone propped up nearby, and an evening review. No other users, accounts or roles.

## Product Purpose

Turns the programme into a game-style "System". It issues daily quests, prescribes and progresses each training session, keeps score as XP, levels, ranks and six stats, issues penalties when days are missed, and tracks long-term goals. Success means the owner opens it every day, does the work, and can see real progression in their reps, body metrics, streaks and money. The game layer exists to support consistency, not to replace it.

## Positioning

A personal tool built around one specific programme. A 6-day beginner calisthenics plan with corrective work (anterior pelvic tilt, knock knees, duck feet), skill ladders and double progression is encoded as rules, and those rules own sets and reps. Habit difficulty also adjusts itself, rising or falling with real adherence. The game mechanics borrow the mood of hunter/system manhwa (status windows, daily quests, penalties, level-ups) but use no copyrighted names, characters, logos or lines.

## Operating Context

- Training happens at home with bodyweight, a chair or bench, a sturdy table and (later) a pull-up bar. The phone is used mid-set, often with sweaty hands, at arm's length or on the floor.
- Source programme documents: `docs/Calisthenics_Plan_Daily_Reference.docx` (plan, form cues, ladders) and `docs/Calisthenics_Tracker.xlsx` (Log, Body, Lists of level-up targets). The app replaces the tracker but can export its training log in the tracker's Log-sheet columns.
- Programme start: Monday 2026-10-05. Days roll over at local midnight.
- Must work fully offline. AI features are optional and go through a passcode-protected serverless route.

## Capabilities and Constraints

- Local-first. All data lives in IndexedDB on the device, with JSON backup and import. Cloud sync may come later, which is why a repository layer sits between the UI and Dexie.
- The training engine is deterministic and owns all prescriptions. AI may suggest bonus quests and weekly reports, but it never changes sets, reps or loads.
- Health guardrails: no pseudo-science (no mewing or jaw-exercise claims), no supplements, no crash dieting or fasting protocols. Pain means stop the exercise and step back, and the app suggests a physio if pain persists. The app is not medical advice.
- Terminology: Player, Gate (training session), Daily Quest, Main Quest (long-term goal), Penalty, Condition (OPTIMAL / FATIGUED / INJURED), ladders (push / squat / pull), tiers (T1…Tn), ranks E to S, stats STR, AGI, VIT, INT, CHA, WLT.
- Training stat mapping (confirmed): strength work feeds STR. Core, corrective/activation, posture, mobility and combat conditioning feed AGI.

## Brand Commitments

- Name: "Player System".
- Voice has two registers. The System speaks rarely, in short, terse, declarative notices ("Daily quest has arrived." "Penalty issued."). Everything else is plain English.
- No copyrighted names, characters, logos or quoted lines from any manhwa. The art direction is original.

## Evidence on Hand

- The programme content (plan, cues, ladders, level-up targets) comes from the two files in `docs/`.
- There is no real usage history yet. Demo history (`?demo=1`) is synthetic, must be labelled as demo data everywhere it appears, and must never be on by default. No invented metrics may appear outside demo mode.

## Product Principles

1. **The engine is the authority.** Every number the app prescribes comes from a tested rule, never from AI or guesswork.
2. **Consistency over intensity.** Difficulty rises on its own when earned and eases when the owner is struggling or hurt.
3. **Quiet by default, loud on purpose.** Most of the time the app is calm and informational. It only announces itself for real events.
4. **One-handed and mid-workout.** Primary actions must be reachable and tappable with a sweaty thumb at arm's length.
5. **Honest data.** Missed days count as missed. Nothing is faked outside clearly marked demo mode.

## Accessibility & Inclusion

WCAG AA contrast on a dark base, visible focus, labelled controls, hit targets of at least 44px, `prefers-reduced-motion` honoured, and screen-reader text for charts (radar, heatmap). Sound is off by default. Haptics are never the only feedback channel.
