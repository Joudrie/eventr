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

**Correction to an earlier claim in this document.** I wrote that the clipped digits leak into
statically rendered event pages and hurt SEO. That was wrong, and checking rather than assuming is
what showed it: during static rendering the detail body never renders at all (the query is still
pending), so the generated HTML contains no odometer and no digit noise. The leak is confined to
the live DOM, where the columns are already hidden from assistive tech. Nothing to fix.

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

---

## Polish pass

Bugs found by driving the app rather than reading it.

### 1. Every page shipped with an empty `<title>`

The deployed site served `<title data-rh="true"></title>` and no description or Open Graph tags.
A link texted to a friend rendered as a blank tab and a preview-less grey box — which is most of
what decides whether the friend taps it.

The cause was not a missing component but a **placement bug**: `Seo` sat below the early returns in
`app/index.tsx`. During static rendering the storage read never resolves, so `ready` stays false,
the component returns before reaching `Seo`, and nothing reaches the generated HTML. Hoisted above
the gates, and the metadata appears.

### 2. Event pages were one shared template

`/event/<id>` resolved to a single `[id].html`, so every event had the same (empty) title, and deep
links returned a 404 status that the client happened to recover from.

`generateStaticParams` now emits **43 real pages**, one per event, each with its own title and share
description:

> **Wakefield Farmers Market · Eventr**
> Twenty-two vendors on the common, every Saturday through October. · Hall Park, Wakefield · Free ·
> Posted by Wakefield Parks & Recreation

This required a synchronous build-time read (`src/data/static.ts`), because the async `DataSource`
cannot serve a static render — the same class of problem as bug 1. The descriptions deliberately
omit dates: seed schedules are relative to build time, so a baked-in "Thu, Aug 6" would be quietly
wrong a week later.

**Still true and worth knowing:** those pages carry correct *metadata* but no body content, because
the detail body is gated on the async query. Good enough for share previews, not yet good enough
for search indexing. Fixing it means feeding static data in as `initialData` — worth doing before
launch, not before there is a backend.

### 3. Changing your town silently wiped your filters

Set "Free only", change town, and the filter was gone with no indication. Price and category lived
in `FeedScreen` state, and changing town unmounts that screen.

They now live in persisted preferences, which also closes an outstanding `BUILD-PLAN.md` Phase 6
item — *"filters persisted across launches"* — that was never actually done. Verified: filters
survive both a town change and a full reload.

Stored categories are validated against the enum on read rather than trusted. A stale value from an
older build would otherwise filter the feed to nothing with no way for the user to tell why.

The time tab deliberately does **not** persist. Reopening the app tomorrow still showing yesterday's
"Now" would be wrong.

### Two things that looked like bugs and were not

- **Deep link → Back lands on the location gate.** Correct: a first-time visitor arriving from a
  shared link genuinely has no town yet. Someone who has used the app before goes to the feed.
- **Six rapid taps on Going left the count unchanged.** Also correct — six toggles is an even
  number. Re-tested with five: the stance sticks, the count lands on 29, and storage holds
  `{"e-derby-wharf-walk":"going"}`. No desync.
