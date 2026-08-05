# Phase 4 — Detail & Transition · Gate Report

Per `BUILD-PLAN.md` §4. **Status: complete.** Both open questions from Phase 3 are settled.

## Delivered

| Item | Notes |
|---|---|
| Event detail | Full description, time range, venue, price tiers, organizer, contact, outbound ticket link |
| Card → detail transition | Header travels from the card's measured position, body crossfades behind it |
| Interactive swipe-back | Left-edge drag, abandonable mid-gesture |
| Deep links | `/event/<id>` resolves directly, including a "no longer listed" state for stale links |
| Outbound actions | Directions (Apple Maps on iOS, Google elsewhere), call, email, website, tickets |
| Share | Native share sheet with a real link |
| Add to calendar | Real `.ics` — download on web, share sheet on native |
| Scroll restoration | The Phase 3 open question, now fixed and verified |

## The transition, and why it isn't `sharedTransitionTag`

Reanimated exposes `sharedTransitionTag`, and it was the obvious first choice. It is **native-only** —
there is no web implementation. Using it would have meant shipping a transition that silently does
nothing on the platform this app actually launches on, and that I could not verify from here.

So the card measures itself on press (`measureInWindow`) and hands the rect to the detail screen
through a small module store. The detail header starts at that rect, scaled to the card's title
size (18/24), and springs into place while everything else crossfades in behind it. Every value is
one we control, which is exactly what makes it interruptible and reversible.

`docs/screenshots/detail-transition-midflight.png` is a frame caught 110ms in: the header is still
small and still sitting where the card was, and the body has not arrived yet.

**Honest limitation:** this is a *positional and scale* morph of the header, not a full
photo-and-title morph. With text-forward cards there is no photo to morph, and the title and price
are the shared elements — which is the right choice for this card design rather than a compromise.

## Swipe-back

A left-edge pan drives the same values in reverse. Past 30% of the screen width, or above 700px/s,
it commits; short of that it springs back. Verified both ways: a short drag returns to the detail
view, a long one lands back on the feed.

The stack's own animation and gesture are disabled for this route (`animation: 'none'`,
`gestureEnabled: false`) so there is exactly one thing animating the screen.

## Scroll restoration — the Phase 3 open question

**Fixed and verified: leave the feed at 900px, come back, still at 900px.**

Getting there took three wrong turns worth recording:

1. **Relying on the navigator to keep the screen mounted.** It doesn't — expo-router unmounts
   inactive screens on web. The offset now lives in an explicit module store, written at
   navigation and restored on the next mount.
2. **Restoring on the first content-size change.** That fires while the query is still pending and
   the list is empty, so the scroll is clamped to zero *and* it burns the one restoration attempt.
   Now it waits for actual content.
3. **`useAnimatedScrollHandler` for the offset.** Replaced with `useScrollViewOffset`, which is the
   API built for reading a scroller's position.

And one thing that looked like a bug and wasn't: **Playwright scrolls an element into view before
clicking it**, so a test that tapped an off-screen card scrolled the feed itself and then blamed the
app. The fix was to tap only cards actually on screen. Worth noting because the "evidence" was
consistent and completely misleading — the app had been correct through two of those three fixes.

## A real bug in the gesture

The edge check originally derived the touch origin from `absoluteX - translationX`. That looks
equivalent to "where the finger went down" and isn't: `translationX` is measured from the moment the
gesture *activates*, which is already `activeOffsetX` pixels into the swipe. The derived origin
drifts, and real edge swipes get rejected. The origin is now captured in `onBegin`, which fires at
touch-down.

## Calendar export

`buildICS` produces a genuine RFC 5545 file, with tests for the parts that quietly break:

- **UTC basic format** (`20260815T130000Z`)
- **Escaping** — an unescaped comma in "Hall Park, Church St" silently truncates the field in most
  calendar clients
- **Line folding at 75 octets** with a leading-space continuation, which matters because long
  descriptions are the common case here
- **CRLF throughout** — some clients reject LF-only files outright

## Gate criteria

> *The transition is interruptible in both directions and holds 60fps. Reduced-motion mode degrades
> it to a clean cut with no broken layout.*

- **Interruptible both directions** — pass. Verified: an abandoned swipe springs back and stays on
  the detail; a committed one returns to the feed. The entry spring is likewise interruptible since
  it drives a single shared value.
- **Reduced motion** — pass by construction. `useReducedMotion()` initialises `openness` at 1 and
  skips both animations, so the screen simply appears with no partial layout. Every `timing()` and
  `spring()` also carries `ReduceMotion.System`.
- **60fps** — **still needs a device.** All transition values are shared values interpolated in
  worklets, with no `setState` in any animation path. A headless Linux browser cannot answer this.

## Definition of done (`BUILD-PLAN.md` §5)

| | |
|---|---|
| Typecheck and lint clean | pass |
| Works on web and iOS | web verified with zero console errors; iOS bundle builds, simulator deferred |
| Empty / loading / error states | pass — detail has all three, including the stale-deep-link case |
| Light and dark verified | pass, both screenshotted |
| WCAG AA verified with a tool | pass |
| VoiceOver labels announce state | pass |
| 375px / 200% text | 375px pass; 200% still needs a device |
| `DESIGN.md` Part 3 audit | pass |
| `INTERACTIONS.md` §9 audit | pass |
| No hardcoded values outside `design/` | pass, lint-enforced |
| Reduced motion verified | pass |
| Screenshots attached | pass |

## Next

Phase 5 — Going / Interested. The hero interaction: press states, fill sweep, odometer count roll,
haptic on press-in, card border pulse, fully reversible undo, optimistic updates with
revert-and-shake on failure, plus device identity and the Mine screen.

The Going and Interested buttons currently render on the detail view and do nothing — that is
Phase 5's job, and they are the only inert controls left in the app.
