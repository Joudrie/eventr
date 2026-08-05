# Phase 3 — Feed · Gate Report

Per `BUILD-PLAN.md` §4. **Status: complete, with three items that need a real device.**

This is the first phase where the app is recognizably the product. Real seed events, real
distances from a real town, real relative times.

## Delivered

| Item | Notes |
|---|---|
| Location gate | Town search with prefix ranking, optional GPS, persisted to device storage |
| Feed | Real seeded events through `DataSource`, ranked, paginated |
| `EventCard` | Text-forward, optional photo, loud price, live dot, capacity badges |
| Time tabs | Now · Today · This Weekend · All, with a sliding underline |
| Collapsing header | Driven by scroll *direction*, not offset |
| Sticky filter row | Never collapses |
| Pull-to-refresh | Brand progress line with a haptic at the commit point, not a platform spinner |
| Prefetch | Next page fetched around 70% scroll depth |
| Live dot | Pulsing, on events in progress |
| States | Skeletons, empty, error, end-of-list |
| `src/lib/time.ts` | Relative-when-soon, absolute-when-not, timezone-safe |
| `src/lib/geo.ts` | Distance and short price |
| `src/lib/towns.ts` | 22 Greater Boston towns |
| `npm run test:format` | 18 tests over the strings a user reads on every card |

## The card decision: text-forward

There are no image assets, so this had to be settled rather than deferred. **Text-forward is now
the primary card design and the photo is an optional left thumbnail** — not the other way round.

The reasoning is about supply, not aesthetics. The posts this app exists to surface — a town rec
department, a run club, a senior class fundraiser night — mostly will not have a good photo. A
card that looks broken without one would visually punish exactly the listings we most want, and
posters would feel it. Making the title carry the card is also the right hierarchy: the title is
what you scan.

The price stays loud, on the right, at display weight. That is the reference mock's best idea. And
`Free` is rendered at the same weight as `$35` rather than being downplayed, which is the product's
central argument stated typographically.

## Copy bugs the screenshots caught

Both were only visible by running the thing and reading it:

1. **"Searched 1 miles around Danvers."** Pluralization now lives in `strings.ts` alongside the
   text it applies to.
2. **The Now tab's empty state said "Nothing in Danvers today."** Wrong window, and confusing when
   you are explicitly looking at what is happening *right now*. Each tab now has its own wording,
   and the Now tab offers "Today" as the next thing to try rather than jumping to "All".

## Other real bugs fixed

3. **A side effect in render.** The preferences store read `AsyncStorage` inside `useMemo`, which
   runs during render — the promise could resolve before mount, and React said so. Moved to an
   effect with a mounted guard.
4. **A dead control.** The header location row had an empty `onPress`. It now routes to the
   location gate, which is what `BUILD-PLAN.md` §4.1 specified ("changeable from the header").
5. **The verified check floated between title lines.** With a two-line title, centering left the
   check orphaned in the gutter, visually detached from the name it certifies. Now top-aligned to
   the first line's cap height.
6. **`useMyLocation` was not a hook** but the name told the linter it was. Renamed to `locateMe`.

## Gate criteria

> *3+ cards visible at 375×667. 60fps scroll on a real device. Every state reachable and
> screenshotted. Scroll position survives a round trip to a detail view.*

- **3+ cards at 375×667** — pass, 3 full cards plus the fourth beginning. See `feed-light.png`.
- **Every state reachable and screenshotted** — gate, feed, Now tab, and empty are all captured.
  Loading skeletons are captured in the Phase 2 gallery. **The feed's error branch is currently
  unreachable**: `LocalSource` is synchronous and cannot fail. The `ErrorState` component itself is
  verified in the gallery, and the branch will become reachable with `SupabaseSource`.
- **60fps scroll** — **needs a device.** What I can state structurally: the scroll handler is a
  Reanimated worklet running on the UI thread, there is no `setState` anywhere in the scroll path,
  and the header collapse interpolates shared values rather than re-rendering. A headless Linux
  browser is not a meaningful frame-rate measurement.
- **Scroll restoration across a detail round trip** — **not verifiable yet**, since Phase 4 builds
  the detail view. The feed stays mounted under a pushed route, so the offset should persist;
  Phase 4 has to prove it.

## Pull-to-refresh, honestly

The custom indicator is driven by negative scroll offset, which means it depends on overscroll
bounce. **That exists on iOS. It does not exist on web or Android**, where the gesture simply never
produces a negative offset — so on those platforms there is currently no way to force a refresh.

I did not paper over this with a platform spinner, because `INTERACTIONS.md` is explicit that the
platform spinner is not what we want. The real fix is a `RefreshControl` fallback on Android and a
tap-the-header-to-refresh affordance on web. Logging it for Phase 9 rather than pretending the
feature is done everywhere.

## Definition of done (`BUILD-PLAN.md` §5)

| | |
|---|---|
| Typecheck and lint clean | pass |
| Works on web and iOS | web verified, zero console errors; iOS bundle builds, simulator deferred |
| Empty / loading / error / offline states | empty and loading pass; error unreachable with LocalSource; offline is Phase 9 |
| Light and dark verified | pass, both screenshotted |
| WCAG AA verified with a tool | pass |
| VoiceOver labels announce state | pass — each card announces title, summary, price, time, distance, going count, and verified status in one label |
| 375px / 200% text | 375px pass; 200% still needs a device |
| `DESIGN.md` Part 3 audit | pass |
| `INTERACTIONS.md` §9 audit | pass |
| No hardcoded values outside `design/` | pass, lint-enforced |
| Reduced motion verified | pass |
| Screenshots attached | pass |

## Next

Phase 4 — Detail view and the shared-element transition from card to detail, with an interactive
swipe-back that can be abandoned mid-gesture. That phase also settles the scroll-restoration
question left open here.
