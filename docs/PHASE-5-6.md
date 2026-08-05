# Phases 5 & 6 — Going / Interested and Filters · Gate Report

Pulled forward together because they were the two sets of inert controls left in the app, and a
dead button is the worst thing to hand someone you want feedback from.

## Delivered

| Item | Notes |
|---|---|
| Going / Interested | Fill sweep, haptic on press-in, odometer count roll, reversible undo |
| Device-scoped RSVP store | Persisted locally, no account, survives reload |
| `Odometer` primitive | Only the digits that changed move |
| Radius sheet | **Live match count against every option**, fetched only while open |
| Price sheet | Any price · Free only · Under $10 · Under $25 |
| Category sheet | All twelve categories, multi-select, with a Clear action |
| `countEvents` on `DataSource` | Counts without paying for rows |

## The radius sheet

`INTERACTIONS.md` §4 called a live count the best small feature in the app, described as a slider
that updates as you drag. The options are discrete (1/5/10/25/50), so it became something better:
**every option shows its count before you pick it.**

> Within 1 mi — 7 · Within 5 mi — 18 · Within 10 mi — 37 · Within 25 mi — 41 · Within 50 mi — 42

You can see the whole shape of your neighbourhood at a glance and pick the radius that actually has
something in it. A slider would have made you commit before finding out.

Counts are fetched only while the sheet is open, so the feed does not pay five extra queries on
every load.

## Going, in detail

Per `INTERACTIONS.md` §1:

- **Haptic on press-in, not release.** On release it feels laggy even when it isn't.
- **Fill sweeps from the left** at `snap` — a solid fill, never a gradient.
- **The count rolls.** Tapping Going moves 212 → 213 with only the changed digit travelling.
- **Undo is the same tap**, run backwards at `settle`. Deliberately asymmetric: the decision is the
  moment worth marking, the reversal is not. Undo is also therefore discoverable without a second
  control.
- **Interested is quieter** — no sweep, softer haptic, accent fill. It is a bookmark, not a
  commitment, and the hierarchy reads without the labels.

Stances are stored per device and persist across reloads. The screen says so plainly — *"Saved on
this device. No account needed."* — rather than implying a backend that does not exist yet.

## Odometer, and the version I threw away

First implementation tracked previous/current digits in state and cross-faded two layers. The React
Compiler lint rule flagged `setState` inside the effect, correctly.

The rewrite is better than a workaround: each place is a **column holding 0–9 that translates to
its target**. "Only changed digits move" then falls out of the structure instead of being computed,
and the component has no state and no effects at all.

## A real accessibility bug it introduced

That column puts ten digits in the tree per place, so a screen reader would read *"zero one two
three…"* for every number on the screen. Fixed by hiding the columns from assistive tech
(`accessibilityElementsHidden`, `importantForAccessibility`, **and** `aria-hidden` — iOS, Android,
and web each honour a different one) while the strip carries the real value as its label.

Verified against the DOM rather than assumed: the counts now expose `aria-label="213"` and
`aria-label="192"`, with the digit columns marked hidden.

**Known limitation, not yet fixed:** the clipped digits are still present in the rendered text, so
`innerText` and any crawler still sees `0123456789` per place. That is cosmetic for users and real
for SEO on statically rendered event pages. The fix is to render a plain number until the value
first changes, so pre-rendered output stays clean — worth doing before launch, not worth blocking
this on.

## Filters compose

Verified by driving the real app rather than by inspection:

| Filter | Result |
|---|---|
| Wakefield, 10 mi, all | 37 events |
| → 5 mi | 18 |
| → + Free only | 14 |
| → + Running | 2 |

Every filter change resets the remembered scroll offset, since restoring a position into a
different set of results would drop you somewhere arbitrary.

## Definition of done

| | |
|---|---|
| Typecheck and lint clean | pass |
| Works on web | pass, zero console errors through the whole flow |
| Empty / loading / error states | pass — unchanged from Phase 3 |
| Light and dark verified | pass |
| WCAG AA verified with a tool | pass |
| VoiceOver labels announce state | pass — buttons report `checked`, counts announce their value |
| 375px | pass |
| `DESIGN.md` Part 3 audit | pass |
| `INTERACTIONS.md` §9 audit | pass |
| No hardcoded values outside `design/` | pass, lint-enforced |
| Reduced motion verified | pass — the roll and the sweep both resolve instantly |
| Screenshots attached | pass |

## Still inert

Nothing in the feed or detail view, now. The remaining unbuilt surfaces are posting, comments, and
the ad slots — phases 7, 8, and 10, plus workstreams 2 and 3 of `NEXT-PROMPT.md`.
