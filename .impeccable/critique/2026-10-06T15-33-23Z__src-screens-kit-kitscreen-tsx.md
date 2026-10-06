---
target: /kit component kit
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/home/amar/player-system/src/screens/kit/KitScreen.tsx"
target_fingerprint: "sha256:b535753edb1a64e388485e0f00462df393590a85361845f38bf65fca5ddb92ac"
target_path: /home/amar/player-system/src/screens/kit/KitScreen.tsx
timestamp: 2026-10-06T15-33-23Z
slug: src-screens-kit-kitscreen-tsx
---
Method: dual-agent (A: design review, B: detector + browser evidence), plus a separate technical audit agent.

## Design Health Score (pre-fix)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The loading button read as disabled; heatmap and chart tooltips vanished when the finger lifted |
| 2 | Match system / real world | 3 | Heatmap row "S" was ambiguous |
| 3 | User control and freedom | 3 | The level-up takeover had no Esc and nothing focusable |
| 4 | Consistency and standards | 3 | Recovery was warn in the window but sys in the badge; disabled primary put ink-3 on s3 |
| 5 | Error prevention | 2 | Unchecked checkbox outline at 1.68:1; scrolling across the stepper or slider changed values |
| 6 | Recognition rather than recall | 3 | Pips have no legend |
| 7 | Flexibility and efficiency | 2 | Pointer-only charts |
| 8 | Aesthetic and minimalist design | 3 | The heatmap slab outshouted System windows |
| 9 | Error recovery | 3 | Good inline field errors |
| 10 | Help and documentation | 2 | No contextual help pattern yet |
| **Total** | | **27/40** | Acceptable |

Audit (technical, pre-fix): 14/20 Good. A11y 2, Perf 3, Responsive 3, Theming 3, Integrity 3. P0 0, P1 2, P2 13, P3 6.

## Design specificity
The System layer (window, ticks, rank octagon, app mark, segmented quest meter, stat-tinted XP chip, rest ring bezel) is authored for this product. The everyday layer is competent but generic dark-kit. The detector flagged only the brief-sanctioned 2% grid texture (CLI). In the browser it flagged 16 items: dark-glow on System windows, toasts and scan lines, and a marquee on the scan loader. All are false positives in context, because they are the brief-mandated inner glow, the scan reveal and the AI loader.

## Priority issues (all fixed in this run)
- [P1] Control outlines under 3:1 (checkbox 1.68, field 1.33, switch 1.72). Fixed with a new `--color-ctl` token, 3.6-3.8:1.
- [P1] Level-up takeover under-delivered the peak and was not keyboard-dismissable. Rebuilt with corner brackets, a scan, an asymmetric thumb-zone layout, rank redraw, countdown, a focused Continue button, Esc and focus restore.
- [P1] Sheets didn't take focus (Vaul autoFocus off). Fixed.
- [P2] QuestRow: the Gate row was announced as a checkbox, disabled rows looked live, and the strikethrough broke on wrapped titles. Fixed: button row, dimmed disabled state, inline-background sweep.
- [P2] Heatmap too loud and missed days invisible. Fixed: calmer validated ramp below full sys, missed days drawn as an ink-4 cross, tap-to-pin tooltip, full day labels.
- [P2] Touch: Segmented options 38px, stepper committed on pointerdown, slider swallowed scroll. Fixed: 44px options, commit on release, slider removed (Stepper/Segmented instead).
- [P2] Reduced motion only partial. Fixed: MotionConfig at the root plus a CSS transition rule.
- [P2] SystemWindow clip-path cut focus rings, and the reveal replayed on every mount. Fixed: cover-based reveal, opt-in.
- [P2] RestRing re-rendered its parent every frame. Fixed: self-ticking from wall-clock time, writing through refs.
- [P2] Kit missing states: active tab bar, CTA dock, field/switch/segmented focus, stepper at min, pressed row, done penalty row. Added.

## Deferred (tracked)
- Single 656 kB chunk: route-level lazy loading in Phase 4 (shell), LazyMotion then.
- Font preload and a metric-matched fallback, latin-only precache: Phase 6 (PWA).
- Undo for accidental quest toggles: Today screen (Phase 5), as an undo toast.
- Groups of one quest in the Daily Quest window: Today screen layout (Phase 5).

## Questions
- Primary action: solid System Blue (current) or a tinted/outlined treatment so full saturation belongs to the System only?
