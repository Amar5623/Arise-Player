# Player System: Design System

Direction: **"System Interface, refined."** It reads as a calm, precise, dark instrument. 90% of the UI is quiet and dense with real information. 10% is the System speaking: quest notices, penalties, unlocks and level-ups. Only that 10% gets the accent frame, the scan reveal, the sound and the haptics. The contrast between those two registers *is* the aesthetic.

Source of truth for values: `src/styles/tokens.css`, where Tailwind 4 reads them from `@theme`. The default Tailwind palette, radii, shadows and type scale are wiped (`--*: initial`), so a utility outside this file does not exist.

---

## 1. Color

Dark only. Use scene: a phone at arm's length in a room at home, early morning or late evening, often mid-set. A dark ground keeps glare down and lets the few lit elements carry state.

### Ground and surfaces (elevation = luminance, not shadow)

| Token | Hex | Use |
|---|---|---|
| `--color-base` | `#05070C` | App ground. Never pure black. |
| `--color-s1` | `#0A0F1A` | Cards, list groups, tab bar fill (at 82%) |
| `--color-s2` | `#0F1624` | Inputs, raised rows, segmented track, sheet body |
| `--color-s3` | `#151E30` | Hover and pressed on s1/s2, sheet header, selected segment |
| `--color-s4` | `#1B2638` | Pressed on s3 |
| `--color-line` | `rgba(140,170,220,.10)` | Hairline dividers, card borders |
| `--color-line-2` | `rgba(140,170,220,.16)` | Control borders, emphasized hairlines |
| `--color-line-3` | `rgba(140,170,220,.28)` | Hover border, chart axes |
| `--color-ctl` | `#617088` | **Interactive boundaries**: unchecked checkbox, field border, switch track. 3.81:1 on s1, 3.60:1 on s2 (WCAG 1.4.11). Hairlines are for dividers only. |

### Ink (text)

| Token | Hex | Min contrast | Rule |
|---|---|---|---|
| `--color-ink` | `#E6EDF7` | 12.9:1 on s4 | Primary text, hero numbers |
| `--color-ink-2` | `#8C9AB3` | 5.35:1 on s4 | Secondary text, details, units |
| `--color-ink-3` | `#74819A` | 4.61:1 on s2 | Tertiary text. **Allowed only on base, s1 and s2.** On s3/s4 use ink-2. |
| `--color-ink-4` | `#56627A` | (3:1 on base) | **Never text.** Disabled strokes, inactive pips, grid lines, placeholder glyph strokes. |

### Accent: System Blue (one, and only one)

| Token | Hex | Use |
|---|---|---|
| `--color-sys` | `#4DB8FF` | Active tab, primary button fill, progress fill, focus ring, System Window frame (notice). |
| `--color-sys-dim` | `rgba(77,184,255,.14)` | Selected fill, accent-tinted chip ground |
| `--color-sys-ink` | `#05070C` | Text on accent fill (9.2:1) |
| `--color-sys-hi` / `--color-sys-lo` | `#6CC5FF` / `#3AA6EE` | Primary hover / pressed |
| `--color-selection` | sys at 32% | Text selection |

The accent is **never** decorative. It never goes on inactive states, headings or icons at rest.

### Semantic

| Token | Hex | Meaning | Ground tint |
|---|---|---|---|
| `--color-ok` | `#4BE3A0` | Success, cleared, OPTIMAL | `--color-ok-dim` 12% |
| `--color-warn` | `#F5B94A` | Warning, FATIGUED, deload | `--color-warn-dim` 12% |
| `--color-bad` | `#FF4D6A` | Penalty, INJURED, pain, destructive | `--color-bad-dim` 12% |
| `--color-rare` | `#9B87FF` | Level-up, skill unlock, titles | `--color-rare-dim` 14% |

Semantic colors always travel with an icon or a word. Color is never the only signal.

### Stat marks (small marks only, never fills)

Validated with the dataviz validator against `#0A0F1A`. CVD separation passes (worst adjacent 10.3), as do the normal-vision floor (15.6) and contrast (all ≥ 3:1). They deliberately sit brighter than the validator's dark lightness band because they are tiny marks on near-black, and each always appears with its text abbreviation.

| Stat | Token | Hex |
|---|---|---|
| STR | `--color-str` | `#FF7F5C` coral |
| AGI | `--color-agi` | `#3DD6D0` cyan |
| VIT | `--color-vit` | `#A8DC4E` lime |
| INT | `--color-int` | `#B59BFF` violet |
| CHA | `--color-cha` | `#FF7EB6` rose |
| WLT | `--color-wlt` | `#E9C46A` gold |

**Heatmap ramp** (`--color-heat-1..4`: `#255073 #2F6A96 #3984B9 #439EDC`) is a validated ordinal ramp of sys (light end 2.26:1 on s1). It deliberately stops short of full sys, so the record stays quieter than System notices. Missed days are an `ink-4` outline with a small cross; days without a record are a faint hairline outline.

Allowed: a 6px dot, a 2px tick, glyph tint, the 2px underline of an XP chip, a radar vertex. Not allowed: backgrounds, card fills, bars wider than 4px, text color for body copy.

### Rank tints (rank badge and gate header only)

E `--color-ink-2` · D `--color-ok` · C `--color-agi` · B `--color-sys` · A `--color-rare` · S `--color-wlt`.

---

## 2. Typography

Three faces, each with one job. All are self-hosted with `@fontsource` and work offline.

| Role | Face | Use | Never |
|---|---|---|---|
| **Display / HUD** | Saira Semi Condensed 500/600/700, UPPERCASE, tracked | Section headings, tab labels, badges, System Window header and voice, rank letters | Body copy, buttons, long strings (> ~32 chars) |
| **UI** | Geist Variable 400/500/600 | Body, quest titles, buttons, inputs, settings | Hero numbers |
| **Numbers** | Geist Mono Variable, `tabular-nums` | Every number: reps, XP, timers, levels, money, dates in data | Prose. Operators and units beside a hero number are set in the sans (`4 × 11`), so mono spacing doesn't gap them. Geist Mono's zero is slashed by design; that's part of the face. |

Banned faces: Inter, Roboto, Arial, Space Grotesk, Orbitron, Poppins.

### Scale (the only sizes that exist)

| Token | px / line-height | Typical use |
|---|---|---|
| `text-11` | 11 / 14 | Display micro-labels (tracking .12em), chip text, axis labels |
| `text-13` | 13 / 18 | Details, secondary lines, display section heads (tracking .10em) |
| `text-15` | 15 / 22 | Body, quest title, buttons, inputs |
| `text-17` | 17 / 24 | Screen titles (sans 600), large buttons |
| `text-22` | 22 / 28 | Display screen headings, System voice line, stat values |
| `text-28` | 28 / 32 | Mono figures in cards (weight, streak) |
| `text-40` | 40 / 44 | Mono timers, Gate prescription |
| `text-64` | 64 / 64 | Hero numbers: level, Focus Mode reps, rest timer |

Tracking: display 11 at .12em, 13 at .10em, 17/22 at .06em, 28+ at .02em. Mono hero sizes use -.02em. Weights step visibly (400 / 500 / 600). Headings get more space above than below.

---

## 3. Space, layout, radii, z

- **Grid:** 4px base. The steps used are 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (Tailwind `--spacing: 4px`, so `p-4` = 16px).
- **Gutter:** 16px sides. Content is single-column at 360–430px. On desktop it sits in a centred 430px phone frame on a base ground.
- **Safe areas:** `viewport-fit=cover`, with `env(safe-area-inset-*)` on the header, tab bar and sticky CTA.
- **Thumb zone:** primary actions sit in the lower 40%. The sticky CTA sits 8px above the tab bar.
- **Alignment:** left-aligned and information-first. Centred layouts are reserved for the level-up takeover and the rest timer.
- **Rhythm:** vary the containers. Use a System Window, then a plain strip, then list rows, then a grid. Never more than two cards of the same anatomy in a row.

### Radii (documented rule)

| Token | px | Applies to |
|---|---|---|
| `--radius-mark` | 2 | Checkbox, XP chip, pips, meter segments, badges |
| `--radius-ctl` | 6 | Buttons, inputs, segmented controls, steppers, sheet top corners |
| `--radius-inner` | 4 | Concentric radius for an element nested inside a 6px control (segment, switch thumb) |
| `--radius-card` | 10 | Cards and list groups |
| (0) | 0 | System Window, toast, level-up takeover. Angular because the System is angular. |

There is no pill radius and no `rounded-2xl`.

### Elevation
- Elevation comes from a luminance step plus a hairline. There are no drop shadows.
- The only blur in the app is on the tab bar and the sheet overlay: `backdrop-filter: blur(16px)` over s1 at 82%.

### Z-index scale (`src/styles/tokens.css`)
| Token | Value | Layer |
|---|---|---|
| `--z-sticky` | 10 | Sticky header, sticky CTA |
| `--z-tabbar` | 20 | Tab bar |
| `--z-sheet` | 40 | Vaul sheets and overlay |
| `--z-takeover` | 50 | Level-up takeover, Focus Mode chrome |
| `--z-toast` | 60 | System toasts |
| `--z-grain` | -1 | Fixed grid texture behind content (`#root` isolates), `pointer-events: none` |

Layout tokens: `--frame-w: 430px` (phone frame, every fixed layer uses it), `--tabbar-h: 64px` (a minimum), `--cta-h: 52px`.

---

## 4. Motion

- Spring-based and fast. **Reduced motion:** `<MotionConfig reducedMotion="user">` at the root turns every Motion transform/layout animation into an instant swap. A global CSS rule limits CSS transitions to colour and opacity, so state still reads but nothing moves. Scan reveals don't play. Toast swipe-to-dismiss stays, because it's input, not animation.

| Token | Value | Use |
|---|---|---|
| `--dur-1` | 150ms | Press feedback, hover, check fill |
| `--dur-2` | 200ms | Tab cross-fade, chip count-up, sheet content |
| `--dur-3` | 250ms | Stack push/pop, toast drop |
| `--dur-4` | 600ms | Celebrations (count-up totals, unlock) |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | Default exit-heavy curve |
| spring `ui` | stiffness 520, damping 40 | Indicators, layout shifts |
| spring `soft` | stiffness 260, damping 30 | Sheets, takeover number morph |

**Authored moments:**
1. **Scan reveal** (System Window, **opt-in** via `reveal`, ~300ms): the corner ticks draw, then a cover wearing the window's own ground retracts downward behind a 1px scan line. It's opt-in because the System only speaks when something happened, such as the first open of the day, a penalty or an unlock. Re-mounting a screen never replays it.
2. **Quest check** (~350ms):
   - The box fills.
   - A 1px line sweeps through the title, left to right, ending at ink-3.
   - The XP chip counts up.
   - Feedback: `vibrate(10)` plus an optional tick sound.
3. **Level-up takeover** (≤ 2.5s, skippable):
   - Opaque base ground. Rare-tone brackets draw in from the four screen corners, and one rare scan line sweeps down.
   - Content is bottom-anchored in the thumb zone and left-aligned: `[ + ] LEVEL UP`, then `LEVEL` with the mono 64 number rolling old → new.
   - The rank badge sits on the right and redraws stroke by stroke when the rank changed.
   - Stat deltas stagger in at 40ms.
   - A 2px rare bar counts down the auto-close above a **Continue** button that takes focus. Esc, tap anywhere or Continue skips, and focus returns to the opener.
4. **Rest ring:** a linear countdown of `stroke-dashoffset`, synced to wall-clock time rather than frame time. At zero it gives a haptic `[30,60,30]`, a chime and an ok flash.
5. **Navigation:** stack push/pop is a 24px x-offset plus fade on spring `ui`. Tab switch is a 120ms cross-fade.

There is no ambient looping motion. The only exceptions are the scan loader while AI analyses, and the wake-lock indicator.

---

## 5. Texture

- A fixed 24px grid of hairline crosses on the base layer at 2% opacity, applied to a `fixed inset-0 pointer-events-none` element only, never to scrolling containers. It's hidden under `prefers-reduced-transparency` and in forced-colors mode.

---

## 6. Components (inventory; all live in `/kit`)

**`components/ui`:**
- **Button:** primary (sys fill), secondary (s2 + line-2), ghost (no fill), danger (bad outline).
  - Sizes: md (44px) and lg (52px).
  - States: rest, hover, pressed (`scale(.98)` + s-step), focus-visible (2px sys ring, offset 2), disabled (ink-4 stroke, ink-3 text), loading (inline scan bar, label kept).
- **IconButton:** 44×44 hit target with a 20–24px Phosphor regular glyph.
- **Checkbox (quest check):** 22px box, radius-mark, `ctl` stroke on s1. When checked: sys fill and a drawn check. Pressed scales the box to 90%. Disabled: transparent with ink-4 at 50%. `CheckMark` is the same box as decoration, for rows that open a screen.
- **Chip:** XP chip (mono 11, a stat-tinted 2px underline, `+12 XP`); status badge (ok/warn/bad/rare/sys with icon + display 11 text); condition chip.
- **Segmented:** a 2–5 option radiogroup with an animated selected block and 44px options (48px track). Arrow, Home and End keys work. Used for the RPE 6–10 selector, 1–5 readiness scales and modes.
- **Stepper:** − value + with the unit under the number, in `lg` (mono 64, 56px buttons) and `md` (mono 40, 48px buttons). A tap commits on release, never on touch-down, so a scroll that starts on it can't change the value. Hold for 380ms to auto-repeat, accelerating. The value is announced 500ms after it settles.
- **Switch:** Radix primitive skinned with tokens; the track is `ctl` when off.
- **No slider.** Sliders swallow page scroll and jump on tap. Bounded numbers use the Stepper, and 1-5 scales use Segmented.
- **Field:** label above, input on s2 with a `ctl` border, helper and error below, and a unit suffix in mono. Focus is the shared 2px sys ring (offset 2), and an error border stays visible while focused. States: rest, focus, error, disabled.
- **Meter:** a segmented progress meter (one segment per quest, 2px gaps) plus a continuous XP bar. Both have a track.
- **Pips:** ladder step pips (done / current / locked).
- **ListRow:** leading slot, title + detail, trailing slot (value, chevron, switch). Hairline separators between rows only.
- **SectionHead:** display 13 uppercase heading with an optional trailing action. No label above it.
- **EmptyState:** a one-line statement of what goes here plus one action.
- **Skeleton:** shape-matched blocks on s2 with a slow luminance pulse (static under reduced motion).
- **Sheet:** a Vaul drawer with a drag handle, s2 body, radius-ctl top corners and the blurred overlay.

**`components/system`:**
- **SystemWindow:** variants notice (sys), warning (warn), penalty (bad), rare (rare), clear (ok).
  - Header `[ ! ] NOTIFICATION` in display 13, rendered as a real heading (`h2`/`h3`). Rare events use `[ + ]`.
  - 1px tinted frame at 40% alpha, 10px corner ticks at full tint, inner glow `inset 0 0 32px <tint>/.07`, 0 radius.
  - Scan reveal is opt-in (`reveal`).
- **Toast:** a compact SystemWindow (header in hud-11 rather than hud-13, a deliberate compaction) that drops from the top and is queued. It auto-dismisses after 3.2s; toasts with an action stay until handled; the timer pauses while touched, hovered or focused. Swipe up to dismiss.
- **QuestRow:** checkbox, title, detail (up to two lines), stat-tinted XP chip. Done draws a 1px sweep through the title as an inline background, so wrapped titles strike through line by line. Rows that open a screen (Gate, weigh-in) are a single button with a decorative `CheckMark` and a chevron, never a checkbox. Disabled rows dim the title to ink-3 and the chip to 50%.
- **LevelUpTakeover**, **ScanLoader** ("ANALYSING"), **RankBadge** (E–S geometric mark), **StatMark**, **AppMark**.

**`components/charts` (hand-built SVG):**
- **Radar:** 6 axes, a single series, a hairline web, a sys stroke at 1.5px with a 12% fill, and stat-tinted vertices.
- **Sparkline, LineChart:** 2px lines with crosshair + tooltip.
- **Heatmap:** 12 weeks × 7 days on a one-hue sys ramp, 2px gaps, with a legend.
- **RestRing.**

Every chart has an `aria-label` summary plus a visually hidden table.

**Shell:**
- **TabBar:** 4 tabs and a sys indicator bar that slides with `layoutId`. Labels truncate rather than overflow at large text sizes.
- **CtaDock:** the thumb-zone primary action, fixed 8px above the tab bar (or at the bottom on screens without tabs), over a 24px base-coloured fade.

---

## 7. Voice

| Register | Style | Examples |
|---|---|---|
| **System** | Display face, uppercase header, short declaratives, no exclamation marks | `[ ! ] NOTIFICATION` / "Daily quest has arrived." "Penalty issued." "Skill unlocked: Incline push-up." |
| **UI** | Plain English, sentence case | "Log body", "Start Gate", "Short on time (30 min)" |

- **Errors** name the problem and the fix: "AI is locked. Set the passcode in Settings → AI."
- **Copy rules:** no em or en dashes in UI copy (use a hyphen for ranges: `6-10`), no emoji, and no "Welcome back".

---

## 8. Do / Don't

| Do | Don't |
|---|---|
| Let numbers be the heroes: mono at 40/64 | Gradient text, purple-to-blue gradients |
| Keep the accent for active, primary, progress and System | Glow on everything. Only System Windows get the inner glow. |
| Vary containers (window, strip, rows, grid) | Stack identical rounded cards |
| Use the uppercase display face *as* the heading | Put a small label above a heading |
| Use hairlines and luminance steps for depth | Drop shadows, glassmorphism cards |
| Pair semantic color with an icon and a word | Color-only state |
| Keep hit targets ≥ 44px with visible focus | `alert()` / `confirm()`. Use sheets and System toasts. |
| Number exercise order (a real sequence) | Use 01/02/03 as decoration |
| Theme the selection, caret, scrollbar and focus ring | Leave browser-default surfaces |
| Design empty states with one action | Use lorem ipsum, fake metrics or emoji markers |
