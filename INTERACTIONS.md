# Eventr — Motion, Micro-Interactions & Consumer Detail

The spec for how the app *feels*. `DESIGN.md` says what it looks like; this says what it does when
you touch it.

---

## 0. The rule that governs everything here

**Animation is feedback, not decoration.**

Every motion in this app must answer a question the user is actually asking:

| Question | Answered by |
|---|---|
| Did that register? | Press states, haptics, optimistic updates |
| What just changed? | Count rolls, state fills, highlight washes |
| Where did this come from / go? | Shared-element transitions, directional slides |
| Is something happening? | Skeletons, progress, pending styling |
| Can I undo that? | Reversible transitions that run backwards |

If a motion answers none of those, it's decoration — cut it. **This is not in conflict with
`DESIGN.md`'s "nothing animates on entry."** Decorative entrance animation (staggered card
fade-ins, bounce-in modals, confetti) is a generated-app tell. Functional response animation is
the opposite — it's the thing cheap apps skip, and its absence is why they feel dead.

### Duration ladder

Pick from this set. Never invent a duration.

```
instant   0ms     optimistic state changes — never wait on a network call
tap       90ms    press-in / press-out
snap     140ms    toggles, chips, tab underline, count rolls
move     220ms    sheets, shared-element transitions, page pushes
settle   320ms    dismissals, undo reversals
slow     900ms    ambient only (live-dot pulse) — nothing interactive
```

### Easing

```
standard   cubic-bezier(0.2, 0, 0, 1)     almost everything
exit       cubic-bezier(0.4, 0, 1, 1)     things leaving the screen
spring     damping 18, stiffness 220      sheets and shared elements only
```

No bounce. No elastic. No overshoot above 1.03. Overshoot is where "playful" becomes "template."

### Implementation constraint

All of this runs on **Reanimated 3 worklets on the UI thread**, never `setState` in a scroll
handler. Gestures via **react-native-gesture-handler**. If an animation can't hold 60fps on a
3-year-old phone, it doesn't ship. `useNativeDriver` equivalent or nothing.

---

## 1. Going / Interested — the hero interaction

This is the emotional center of the product. Everything else can be competent; this has to be
*satisfying*. Someone deciding to go somewhere on a Saturday should feel a small click of
commitment.

### Going — press sequence

1. **Press in (90ms)** — button scales to `0.96`, background darkens one step. Immediate.
2. **Haptic** — `impactLight` fires on press-in, not on release. This is the detail that makes
   it feel physical; firing on release feels laggy even when it isn't.
3. **Release (140ms)** — scales back to `1.0` with a `1.02` peak. Fill sweeps in from the left
   edge, ink→sun, over 140ms. Label flips from `Going?` to `You're going`.
4. **Count rolls** — the `23 going` counter increments as an **odometer**: the old digit slides up
   and out, the new digit slides up and in, 140ms, clipped. Only the digits that changed move.
5. **The card, if in feed** — a single quiet pulse of the border to `sun` and back, 220ms, so
   you can see which card you just acted on when you scroll away.

### Going — undo

Tap again. Every step above runs **backwards** at `settle` (320ms) — fill retracts to the left,
count rolls down, haptic is `selection` (softer than the commit). Undo should feel unremarkable;
commitment is the part that gets the flourish.

### Interested — deliberately quieter

Interested is a bookmark, not a commitment, and the motion should say so. No fill sweep. The
outline icon fills solid, scales `1.0 → 1.12 → 1.0` over 140ms, `selection` haptic. If triggered
from the feed, the card does **not** pulse. The hierarchy between the two buttons should be
legible without reading them.

### Failure

Optimistic always — the UI updates at `instant`, the network call follows. If it fails: the state
reverts at `settle`, a 4px horizontal shake (2 cycles, 180ms total), `notificationError` haptic,
and a bottom toast: *"Couldn't save that. Tap to retry."* Never a blocking dialog.

---

## 2. Scrolling the feed

The feed is where 90% of session time lives. It has to feel weightless.

**Collapsing header.** The town + radius row collapses as you scroll down and returns as you
scroll up — driven by **scroll velocity and direction**, not absolute position. Position-based
headers feel broken when you're near the top. The wordmark stays; only the location row and
padding collapse. Interpolated on the UI thread, no state updates.

**Sticky filter bar.** The chip row pins under the header and stays. It never collapses — it's the
primary control and hiding it costs more than the space it takes.

**Pull to refresh.** Not the platform spinner. A 2px `sun` progress line under the header that
fills left-to-right as you pull, snaps to indeterminate on release, and retracts on completion.
Restrained, brand-colored, not cute. `impactLight` at the trigger threshold — so you feel the
commit point without looking.

**Infinite scroll.** Prefetch the next page at 70% scroll depth so it's never visibly loading.
Newly appended items fade in over 140ms — no stagger, no slide. Stagger on a list is a tell.

**Tap header to scroll to top.** Animated, 320ms. Standard and everyone expects it.

**Scroll restoration.** Coming back from a detail view returns you to the exact pixel offset, not
the top. Getting this wrong is the single most enraging bug in any feed app.

**Live-now dot.** A 6px `flag` dot next to events happening right now, pulsing opacity
`1.0 → 0.4 → 1.0` over `slow` (900ms). It is the only ambient animation in the entire app, which
is exactly what makes it read as important rather than noisy.

---

## 3. Card → detail

The highest-value transition in the app, and the one that most makes it feel native rather than
web-in-a-box.

**Shared element.** The card photo and title are the shared elements. On tap, the photo expands
from its 88px thumbnail position into the detail hero position; the title travels and scales from
`title` to `display-l`. Everything else on the detail view crossfades in behind it. `move` (220ms),
`spring` easing.

**Everything else in the card** — price, distance, meta row — crossfades out over the first 90ms so
it doesn't visually collide with the arriving detail layout.

**Back** runs the same transition in reverse, and supports the **interactive swipe-from-edge
gesture** — the transition follows your finger and can be abandoned halfway. Non-interruptible
back transitions are a dead giveaway that something isn't really native.

---

## 4. Filters & sorting

**Sheet presentation.** Slides from the bottom with `spring`, backdrop fades to 40% ink over
`move`. Grabber handle at top. Drag-to-dismiss follows the finger, with velocity-based snap —
flick down fast and it goes even if you barely moved it.

**Chip toggles.** Fill and text invert over `snap` (140ms). `selection` haptic. Multi-select chips
never reflow the row when their width changes on selection — reserve the bold-weight width up front
so nothing jumps.

**The radius slider — best small feature in the app.** As you drag, a live count updates in real
time above the thumb: *"31 events within 15 miles."* Debounced query at 120ms, but the number
animates as an odometer so it feels continuous. This turns an abstract setting into a direct
answer, and it's the kind of thing people show their friends.

**Applying filters.** Sheet dismisses at `settle`. The feed crossfades — not slides — to the new
results over `snap`, and the result count in the header rolls to its new value. Crossfade because
the list identity didn't change, only its contents.

**Active filter state.** Any non-default chip renders filled with a count badge, and a `Clear`
appears at the row's end. You should never be confused about why the feed looks empty.

**Time tabs.** Underline slides between tabs at `snap` with `standard` easing. Content changes with
a **directional** slide — moving right in the tab order slides content in from the right. Direction
carries meaning; a plain crossfade throws that information away.

---

## 5. Comments

**Optimistic post.** Your comment appears instantly at 60% opacity with no timestamp, then settles
to full opacity when the server confirms. Failure reverts it with a retry affordance inline.

**New comment highlight.** Arrives with a `sun` background wash at 15% that fades to transparent
over 900ms. Enough to find it, gone before it's annoying.

**Organizer replies.** Auto-pin to top with an `ORGANIZER` label chip. When one pins, the list
reorders with a 220ms layout animation so you can see it move — a comment silently teleporting to
the top is confusing.

**Comment count on the card** rolls like the going count.

**Locked threads** show a plain line — *"The organizer turned off comments."* — not a disabled
input. Disabled inputs invite people to keep tapping them.

---

## 6. Post flow

**Step progress.** A thin `sun` bar under the header that fills by step. Forward steps slide in
from the right, back from the left. Consistent with the tab rule.

**Validation.** On blur, never on keystroke. Inline, one line, in `flag` — never a red-bordered
wall of fields. The `Continue` button stays enabled and, if you tap with errors, scrolls to and
focuses the first problem. Disabled continue buttons that don't say why are hostile.

**Character counters** appear only in the last 20 characters of the limit, and turn `flag` in the
last 10. A counter that's always visible is nagging; one that shows up when it matters is helpful.

**Address geocoding.** As you type, debounced 300ms suggestions. On selection, the map pin drops
and settles once (no bounce), and the map pans at `move`. You confirm by dragging the pin if it's
wrong — drag is 1:1 with the finger, with `selection` haptic on release.

**Photo.** Picked image crossfades into the slot over `snap`. Upload progress is a bar across the
image bottom, not a spinner over it — you should still see your photo while it uploads.

**Submit.** No confetti. No checkmark bloom. A clean transition to a confirmation screen stating
what actually happened — *"Posted. It's live."* or, for first-time posters, *"Submitted. A person
reviews first posts, usually within a few hours. We'll text you when it's up."* — with the event
preview below it and `notificationSuccess` haptic. Confetti is a top-3 generated-app tell.

---

## 7. Loading, empty, error, offline

**Skeletons, not spinners.** Skeletons match the real card layout exactly — same photo square,
same three text lines at the same widths. A gentle **opacity pulse** (`0.6 → 1.0`, 900ms), *not* a
shimmer sweep. The diagonal shimmer gradient is itself a tell, and it also violates the no-gradient
rule.

**Skeleton → content** is a 140ms crossfade in place. No layout shift, ever — the skeleton occupies
the exact final dimensions.

**Empty states are actionable, never illustrated.** A short factual line plus the button that fixes
it:

> **Nothing within 5 miles today.**
> `Widen to 25 miles` · `See this weekend`

**Errors** state what failed and offer the retry: *"Couldn't load events. Tap to retry."*

**Offline.** Serve the cached feed with a persistent slim bar: *"Offline — showing events from
2:14 PM."* Going/Interested taps queue locally and flush on reconnect, with the pending item styled
at 60% opacity. An events app that's blank in a parking garage with no signal has failed at its
one job.

---

## 8. Consumer details — the long list

The small stuff that makes an app feel like someone actually used it.

### Time & distance
- Relative when it's soon, absolute when it isn't: `Starts in 40 min` · `Tonight 7:30` ·
  `Tomorrow 9:00 AM` · `Sat, Aug 15` · `Aug 15`
- Live events show `Ends in 2 hr`
- Distance: one decimal under 10 miles (`2.3 mi`), whole numbers above (`27 mi`)
- `Just posted` badge for anything under 2 hours old

### Gestures
- Long-press a card → quick actions sheet: Share · Interested · Add to calendar · Report
- Swipe from left edge → back, interactive
- Pinch to zoom the detail photo, with drag-to-dismiss
- Double-tap does **nothing**. It means "like" everywhere else, and we don't have likes — a
  no-op is better than a surprise.

### Taps that should just work
- Address → opens Apple/Google Maps with directions
- Phone → dials
- Links in descriptions → autolinked and opened in-app browser
- `Add to calendar` → real `.ics` with title, time, and address prefilled
- Share → native share sheet with a real deep link and a proper preview card

### State & memory
- Scroll position restored on back
- Last used filters remembered across launches
- Town remembered, changeable from the header at any time
- Recently viewed events available for 7 days
- Draft posts saved automatically — killing the app mid-post loses nothing

### Card state styling
- `full` — greyed with a `FULL` chip, still tappable, sorted down
- `filling` — `FILLING UP` chip in `sun`
- `cancelled` — title struck through, `CANCELLED` in `flag`, stays visible until the end time
  passes so people who planned to go find out
- Missing photo — the card reflows to a text-forward layout with the title at `display-l`. It
  should look like an intentional variant, not a broken card.

### Considerate touches
- Weather chip on the detail view for outdoor-category events within 7 days — high value for
  exactly the free outdoor community events this app exists to surface
- Duplicate detection on post: *"Someone already posted an event at this place and time. Is this
  the same one?"*
- Timezone-safe everywhere; events never shift by an hour
- Respects system text size up to 200% without clipping
- Full dark mode, using the same tokens with an inverted surface ramp
- VoiceOver labels on every control; the Going button announces its state, not just its label
- **`prefers-reduced-motion` is honored globally** — all transforms become crossfades, ambient
  pulse stops, shared elements become instant cuts. Non-negotiable, and it's also a real
  accessibility obligation from the compliance list.

### Haptics map

| Event | Haptic |
|---|---|
| Going (commit) | `impactLight` on press-in |
| Interested / undo / chip toggle / tab change | `selection` |
| Pull-to-refresh threshold | `impactLight` |
| Post submitted | `notificationSuccess` |
| Action failed | `notificationError` |
| Everything else | none |

Haptics on scroll or on every tap is worse than none at all. Restraint is the whole skill.

---

## 9. Motion anti-tells

Never ship any of these:

- Confetti or celebration bursts
- Staggered list entrance animations
- Bounce, elastic, or spring overshoot past `1.03`
- Diagonal shimmer sweeps on skeletons
- Full-screen loading spinners
- Animated illustrations or Lottie in empty states
- Typewriter text
- Parallax on scroll
- Anything that animates on mount without a user action
- Transitions slower than 320ms
- Blocking modals for anything recoverable

---

## 10. The prompt

> Implement Eventr's interaction layer per `INTERACTIONS.md`, alongside `DESIGN.md` and
> `BLUEPRINT.md`.
>
> Reanimated 3 worklets on the UI thread and react-native-gesture-handler. No JS-thread animation,
> no `setState` in scroll handlers. Every animation must hold 60fps on a 3-year-old device.
>
> Build in this order, stopping after each for review:
> 1. **Motion tokens** — durations, easings, and haptic helpers as a single shared module. Every
>    later animation imports from it. No inline magic numbers anywhere in the codebase.
> 2. **Going / Interested** — press states, fill sweep, odometer count roll, haptics, optimistic
>    update with revert-and-shake on failure, full reversibility on undo. §1 is the spec; this is
>    the interaction the whole app is judged on.
> 3. **Feed scroll** — velocity-driven collapsing header, sticky filter bar, custom pull-to-refresh,
>    prefetch at 70%, scroll position restoration.
> 4. **Card → detail shared-element transition**, including interactive swipe-back that can be
>    abandoned mid-gesture.
> 5. **Filter sheets** — drag-to-dismiss with velocity snap, chip toggles, and the live-updating
>    radius slider count from §4.
> 6. **States** — skeletons matching real layouts exactly (opacity pulse, never shimmer),
>    actionable empty states, inline errors, offline cache bar with queued actions.
> 7. **Consumer details** from §8, in the order listed.
>
> Hard requirements:
> - Honor `prefers-reduced-motion` globally from step 1, not retrofitted at the end.
> - Every animated value must be interruptible and reversible — no animation that must finish.
> - No layout shift when a skeleton swaps to content.
> - Zero items from §9 anywhere in the codebase.
> - Every interactive element gets a VoiceOver label that announces state, not just name.
> - Before declaring any step complete, self-audit against §9 and the `DESIGN.md` checklist.
