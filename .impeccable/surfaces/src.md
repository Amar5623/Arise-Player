---
version: 1
slug: "src"
primary_target: "src"
related_targets: []
---

# Surface: Player System app shell (all screens)

Scope: the whole installable PWA (Today, Train/Gate/Focus/Cleared, Status, Quests, Settings, Onboarding, /kit). Mode: Operate. Single user, Android Chrome, one-handed, often mid-workout.

## Direction contract

THESIS: An instrument-grade personal tracker that stays quiet and dense 90% of the time and lets "the System" speak only for real events (quest issued, penalty, unlock, level-up). Refuses both the neon cyberpunk HUD template and the stacked rounded fitness-dashboard cards.

OWN-WORLD: Blue-black ground (#05070C) with surfaces stepped up in luminance, hairlines (rgba(140,170,220,.10-.16)) for structure, no drop shadows. One accent, System Blue #4DB8FF, used only for active, primary, progress and System notices. Saira Semi Condensed uppercase with tracking for headings and the System voice; Geist for UI; Geist Mono tabular numerals at heroic sizes. 6px controls, 10px cards, 0px System Windows with corner-bracket ticks. Stat identity as tiny tinted marks (STR coral, AGI cyan, VIT lime, INT violet, CHA rose, WLT gold).

STORY: The owner opens the app, reads today's condition and quest progress at a glance, checks things off with a thumb, runs the Gate one exercise at a time, and sees exactly what changed and why.

FIRST VIEWPORT (Today, 390x844): top-left date + "WEEK 1" + deload badge; top-right mono reset countdown. Below, the Morning Status Check (or a condition chip once done). Then the Daily Quest System Window: bracket frame, [ ! ] header, a full-width segmented meter with [done/total] in mono, first quest group rows (checkbox, title, one-line detail, stat-tinted XP chip). The streak/level strip sits under the window. The tab bar is blurred at the bottom, with primary actions in the lower third.

SIGNATURE: The System Window: a hairline accent frame with angular corner ticks that reveals with a fast scan-line sweep and announces itself with sound and haptics. Paired with numbers as heroes: giant mono level, reps and timers.

FORM: Brief-pinned direction ("System Interface, refined"); no concept-seed roll (pinned direction beats the roll). Seed key: none (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
