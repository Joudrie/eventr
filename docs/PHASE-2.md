# Phase 2 — Primitives · Gate Report

Per `BUILD-PLAN.md` §4. **Status: complete.** No screens were built. This is the phase where
"does it look generated" is won or lost, so it got its own gate.

## Delivered

| Primitive | Notes |
|---|---|
| `Text` | The only component in the app that sets a font size, weight, or text color. `label` auto-uppercases. |
| `Icon` | Eight hand-drawn glyphs on a 24px grid, 2px stroke, round caps. No emoji, no icon font. |
| `Press` | The shared press behavior — scale, haptic timing, reduced motion — decided once. |
| `Button` | 5 variants × default/large, plus disabled, loading, icon, block, and pill. |
| `Chip` | Toggle and sheet-opening variants, with a count badge. |
| `Card` | Flat, bordered, 4px radius. Static, pressable, and muted. |
| `Badge` / `VerifiedMark` / `LiveDot` | Status markers, the inline verified check, and the one piece of ambient motion. |
| `Skeleton` / `SkeletonCard` | Opacity pulse, matching the real card layout exactly. |
| `EmptyState` / `ErrorState` / `EndOfList` | Actionable and factual. |
| `Sheet` | Springs up, backdrop dims, drag-to-dismiss with velocity snap. |
| `Toast` | Bottom toast with a retry action. |
| `Divider` | Hairline rule. |

Plus **`src/copy/strings.ts`** — every user-facing string in one file, so the voice audit is a
single review rather than a codebase grep. The rules are written at the top of it.

And **`app/gallery.tsx`** — every primitive in every state on one screen, dev-only (`__DEV__`
guard; the production export renders "Not found", verified).

## Decisions worth recording

- **Chips do not bold on selection.** Only the fill changes. Bolding reflows the row and makes
  neighbouring chips jump — `INTERACTIONS.md` §4 flags this. Matching the weight across both states
  avoids the problem instead of compensating for it.
- **Cards dim on press; they do not scale.** A full-width surface that scales reads as a wobble
  rather than a press. `Press` takes `scaleOnPress={false}` for exactly this.
- **The verified mark is inline after the organizer name at text size** — not the floating corner
  sticker from the reference mock, which competes with the title for the eye and looks bolted on.
- **The live dot is the only ambient animation in the app.** That scarcity is what makes it read as
  important rather than as noise.
- **Toast is the one thing allowed to animate on entry.** It has no other way to announce itself,
  and its arrival *is* the feedback. Everything else waits for a user action.
- **Disabled controls fade rather than switching to a grey.** Introducing a "disabled color" adds a
  second visual language for no gain.

## The Sheet, in detail

Dismissal is **velocity-aware**: a fast downward flick closes it even if you barely moved it,
because intent lives in the speed rather than the distance. A distance-only threshold makes a sheet
feel sticky in precisely the case where the user was most decisive.

The sheet also **owns its own exit** — it plays the close animation and *then* calls `onClose`,
rather than being unmounted mid-animation by a parent state flip. That is what lets the backdrop
fade stay tied to the sheet's actual position instead of running on a separate timer.

The entrance is driven by layout rather than an effect. `Modal` unmounts its children while hidden,
so the first measurement after opening is a reliable "about to appear" signal — and it is the first
moment the exact travel distance is known, so the spring starts from the sheet's real height
instead of a guess.

## Real bugs found and fixed

1. **`accessibilityElementsHidden` leaking into the DOM.** `react-native-svg` forwards unrecognized
   props straight to the DOM node on web, so every icon logged a React warning. Fixed by moving the
   accessibility props to a wrapping `View`. Caught by watching the console during the screenshot
   run, not by reading the code.
2. **A shared value mutated after being used as an effect dependency** in `Sheet`. The React
   Compiler lint rule flagged it. The fix was structural — drive the entrance from `onLayout`
   instead of `useEffect` — which also removed the guess at the travel distance.

## Screenshots

`docs/screenshots/` — `gallery-light.png`, `gallery-dark.png`, `gallery-sheet.png`,
`gallery-cards-loading.png`, `gallery-states-dark.png`. All 375px wide, both schemes.

## `DESIGN.md` Part 3 audit

| Check | Result |
|---|---|
| Zero emoji in any UI string | pass — icons are drawn SVG; `strings.ts` has none |
| Zero gradients | pass — no gradient anywhere in the codebase |
| No component library defaults | pass — every primitive is hand-built against tokens |
| Empty / loading / error / end states exist | pass — all four exist as primitives |
| Feed shows 3+ events at 375×667 | deferred to Phase 3 — no feed yet |
| All text passes WCAG AA | pass — `npm run audit:contrast`, 32 pairings |
| No exclamation points | pass — `strings.ts` has none |
| Seed data names real places | pass — verified in Phase 1 |
| Long titles, missing photos, long descriptions render | pass — the gallery includes an 80-char title and a 120-char summary |
| Every tap target ≥ 44×44 | pass — `Press` applies hitSlop; `Button` has `minHeight: 44` |
| Works at 375px | pass — every screenshot is 375px |
| 200% text size | **partially verified** — see below |
| Nothing animates on mount without user action | pass, with the documented Toast exception |
| `INTERACTIONS.md` §9 anti-tells | pass — no confetti, stagger, bounce, shimmer, spinner-on-blank, or parallax |
| `prefers-reduced-motion` honored | pass — every `timing()`/`spring()` carries `ReduceMotion.System` |

**On 200% text:** react-native-web renders in px, so browser font scaling does not exercise the
native Dynamic Type path, and I can't honestly claim this one is verified. What I can say is that
no primitive sets a fixed `height` on a text-bearing container — they all use `minHeight`, so there
is nothing structurally positioned to clip. Needs a real device check on your Mac.

## Definition of done (`BUILD-PLAN.md` §5)

| | |
|---|---|
| Typecheck and lint clean | pass |
| Works on web and iOS | web verified with zero console errors; iOS bundle builds, simulator still deferred |
| Empty/loading/error states | pass — they are the deliverable |
| Light and dark verified | pass, screenshotted in both |
| WCAG AA verified with a tool | pass |
| VoiceOver labels announce state | pass — `Press` forwards role and state; chips report checked/selected |
| 375px / 200% text | 375px pass; 200% partially verified |
| `DESIGN.md` Part 3 audit | pass, table above |
| `INTERACTIONS.md` §9 audit | pass |
| No hardcoded values outside `design/` | pass, lint-enforced |
| Reduced-motion verified | pass |
| Screenshots attached | pass |

## Next

Phase 3 — Feed. Location gate, event cards against real seed data, time tabs, and the scroll
behaviors from `INTERACTIONS.md` §2: velocity-driven collapsing header, sticky filter bar, custom
pull-to-refresh, prefetch at 70%, scroll restoration.

The open question Phase 3 has to answer: **photos.** There are no image assets, so every card
currently renders the no-photo variant. Either real seed imagery gets added, or the text-forward
fallback becomes the primary design — and it has to look like an intentional variant, not a broken
card.
