# Eventr — Master Build Plan

The single document that organizes everything. If you only read one file before starting, read
this one; it tells you what to read next and in what order to do the work.

---

## 0. How the docs fit together

| Doc | Answers | Read it |
|---|---|---|
| `PRODUCT.md` | What is this and why does it exist | Once, first |
| `COMPETITORS.md` | Why it wins, what not to become | Once |
| `BLUEPRINT.md` | What to build — stack, schema, screens, ranking | Continuously |
| `DESIGN.md` | What it looks like, and what makes apps look generated | Before every component |
| `INTERACTIONS.md` | What it feels like — motion, haptics, detail | Before every interaction |
| `OPEN-QUESTIONS.md` | What's decided and what isn't | When blocked |
| **`BUILD-PLAN.md`** | **Order of operations and definition of done** | **Every session** |

**Reading order for a fresh builder:** `PRODUCT` → `BUILD-PLAN` → `BLUEPRINT` → `DESIGN` →
`INTERACTIONS`.

---

## 1. Non-negotiables

These override convenience, velocity, and any suggestion to the contrary. If a task can't be done
without violating one, stop and ask.

1. **Never process a payment for an event.** Outbound links only. This is the product's identity
   and its entire regulatory posture.
2. **Posting is always free.** Money comes from verification, boosts, and sponsored slots. Never
   from the right to post.
3. **No account required to browse or RSVP.** Guest-first, device-scoped.
4. **No social graph.** No likes, followers, DMs, or profiles. If a feature needs one, it's the
   wrong feature.
5. **Zero emoji in the UI. Zero gradients.** See `DESIGN.md` Part 1.
6. **RLS on every table, written with the schema.** Never bolted on later.
7. **Every list gets empty, loading, error, and end states** before it counts as done.
8. **`prefers-reduced-motion` honored from the first animation**, not retrofitted.
9. **Seed and test data must be locally real** — actual Greater Boston towns, plausible venues,
   realistic times and prices. Never "Event 1," never lorem ipsum.
10. **Stop at every phase gate for review.** Do not scaffold ahead into the next phase.

---

## 2. Repo structure

```
eventr/
├── app/                        # Expo Router — routes only, thin
│   ├── _layout.tsx
│   ├── index.tsx               # feed
│   ├── event/[id].tsx          # detail
│   ├── post/                   # post flow steps
│   ├── mine.tsx
│   └── location.tsx            # first-run location gate
├── src/
│   ├── design/
│   │   ├── tokens.ts           # color, type, space, radius — single source
│   │   ├── motion.ts           # durations, easings, haptics — single source
│   │   └── primitives/         # Text, Button, Chip, Card, Sheet, Skeleton…
│   ├── features/
│   │   ├── feed/
│   │   ├── event/
│   │   ├── rsvp/
│   │   ├── comments/
│   │   ├── post/
│   │   └── filters/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── device.ts           # anonymous device identity
│   │   ├── geo.ts              # distance, geocoding
│   │   ├── time.ts             # relative/absolute formatting, timezone-safe
│   │   └── queries/            # TanStack Query hooks
│   └── types/                  # generated from Supabase + hand-written
├── supabase/
│   ├── migrations/
│   └── seed/
├── admin/                      # moderation console
└── *.md                        # the specs
```

**Rules:** routes contain no business logic. Primitives never import from `features/`. Nothing
outside `design/` defines a color, duration, or spacing value.

---

## 3. Conventions

- **TypeScript strict.** No `any`. Database types generated from Supabase, never hand-maintained.
- **Naming:** components `PascalCase`, hooks `useThing`, query hooks `useEventsQuery`, mutations
  `useRsvpMutation`. Files match their default export.
- **Data access only through TanStack Query hooks in `lib/queries/`.** No component calls Supabase
  directly, ever.
- **All copy lives in one strings module.** Makes the `DESIGN.md` voice audit a single-file review
  rather than a codebase grep.
- **Commits:** imperative, scoped, one concern each — `feed: velocity-driven header collapse`.
- **No component library.** Primitives are hand-built against tokens. A recognizable default look
  is the tell we're most trying to avoid.

---

## 4. Phase plan

Ten phases. Each has a gate. **Stop at every gate.**

Interaction work is interleaved with feature work deliberately — motion retrofitted at the end
always feels retrofitted.

---

### Phase 0 — Rails
*No product yet. This is the foundation you don't want to redo.*

- Expo + TypeScript strict + Expo Router, verified running on web **and** in iOS simulator
- ESLint + Prettier + typecheck, all wired into a pre-commit hook
- `design/tokens.ts` and `design/motion.ts` — the complete token sets from `DESIGN.md` and
  `INTERACTIONS.md`, with reduced-motion resolution built into the motion module from the start
- Reanimated 3 + gesture-handler installed and confirmed running on the UI thread
- Env/secrets handling; nothing committed

**Gate:** blank app builds on both targets, lints clean, and a throwaway box animates at 60fps
using only imported tokens. Zero magic numbers.

---

### Phase 1 — Data
*Everything downstream depends on getting this right once.*

- Migrations for the full schema in `BLUEPRINT.md` §2
- PostGIS index and an `events_within_radius(lat, lng, meters, filters…)` RPC
- **RLS on every table, in the same migration as the table**
- The ranking function from `BLUEPRINT.md` §5, in SQL, tunable by constants
- Archive job: `live` → `archived` at `ends_at + 2h`
- Seed: ~40 events across Wakefield, Melrose, Stoneham, Reading, Malden, Medford, Saugus,
  Somerville — real towns, plausible venues, a realistic mix of free/paid, categories, times,
  and a deliberate spread of edge cases (no photo, very long title, full, filling, cancelled,
  live right now, 2000-char description)
- Generated TypeScript types

**Gate:** radius query returns correctly ranked results in under 100ms with seed data. An
anonymous key can read `live` events and nothing else — verified by an actual attempt to read
`pending` rows and write to `events`.

---

### Phase 2 — Primitives
*No screens. Components only. This phase is where "does it look generated" is won or lost.*

- `Text` (the full type scale), `Button`, `Chip`, `Card`, `Sheet`, `Skeleton`, `Toast`,
  `EmptyState`, `ErrorState`, `Divider`, `Badge`
- Press states and haptics per `INTERACTIONS.md` baked into `Button` and `Chip`
- Light and dark ramps from day one
- A dev-only gallery route rendering every primitive in every state

**Gate:** the gallery is reviewed against the full `DESIGN.md` Part 3 checklist. Contrast verified
with a real tool, not by eye. Nothing here looks like an off-the-shelf library.

---

### Phase 3 — Feed (read-only)

- Location gate: town autocomplete + optional GPS, persisted, changeable from the header
- Feed list of real seeded events
- Card per `DESIGN.md`, including the no-photo and long-title variants
- Time tabs: Now · Today · This Weekend · All, with directional content slide
- Scroll behaviors from `INTERACTIONS.md` §2 — velocity-driven collapsing header, sticky filter
  bar, custom pull-to-refresh, prefetch at 70%, scroll restoration
- Live-now pulsing dot
- Skeletons, empty, error, end-of-list

**Gate:** 3+ cards visible at 375×667. 60fps scroll on a real device. Every state reachable and
screenshotted. Scroll position survives a round trip to a detail view.

---

### Phase 4 — Detail + transition

- Full detail view: description, time, venue, map link, price tiers, contact, outbound ticket
  button, share, report
- Shared-element transition from card, per `INTERACTIONS.md` §3
- Interactive swipe-back, abandonable mid-gesture
- Pinch-zoom photo, tap-to-Maps, tap-to-call, autolinked description, add-to-calendar `.ics`

**Gate:** the transition is interruptible in both directions and holds 60fps. Reduced-motion mode
degrades it to a clean cut with no broken layout.

---

### Phase 5 — Going / Interested
*The hero interaction. Budget real time here.*

- Anonymous device identity, generated locally, no PII
- Going and Interested mutations, one stance per device, switchable
- Full press sequence from `INTERACTIONS.md` §1: press states, fill sweep, odometer count roll,
  haptic on press-in, card border pulse, fully reversible undo
- Optimistic updates with revert-and-shake on failure
- `Mine` screen — your going/interested list and your posts

**Gate:** side-by-side with a competitor's equivalent button, ours feels better. Tapping rapidly
never desyncs the count. Airplane mode queues and flushes correctly.

---

### Phase 6 — Filters & sort

- Filter sheet: radius, price, category, verified-only, sort
- Drag-to-dismiss with velocity snap
- **The live-updating radius slider count** from `INTERACTIONS.md` §4
- Active filter state, count badges, `Clear`
- Filters persisted across launches
- Result count rolls in the header on apply

**Gate:** every filter combination returns correct results. Empty results give an actionable
empty state naming the filter to relax. Alpha-ready — this is the first build worth handing to
someone in Wakefield.

---

### Phase 7 — Posting & moderation

- 4-step post flow per `BLUEPRINT.md` §4.5
- Address geocoding with confirm-and-drag pin
- Photo upload with inline progress
- Magic link via email/SMS; poster identity without an account
- Draft autosave
- Trust model: first post from a new poster queues for review, then that poster is trusted
- Moderation console: keyboard-driven approve/reject/ban queue
- Poster's own view of their event, including the live going count

**Gate:** a real stranger posts an event end-to-end without help. Trust promotion works. A banned
poster's events disappear. Rate limits hold under abuse.

---

### Phase 8 — Comments

- Flat comments, 500 char cap
- Optimistic post with pending styling
- Organizer replies tagged and auto-pinned, with a visible reorder animation
- Author can delete any comment on their event and lock the thread
- Report → threshold → auto-hide → review queue
- New comment highlight wash

**Gate:** moderation actions take effect immediately for all clients. Locked threads render as a
plain line, not a disabled input.

---

### Phase 9 — Polish sweep

- Offline: cached feed, staleness bar, queued RSVPs
- Dark mode verified on every screen
- VoiceOver pass — every control announces state
- 200% text size pass
- The full `INTERACTIONS.md` §8 consumer detail list
- Weather chip for outdoor events within 7 days
- Duplicate-post detection
- Performance profiling on a low-end device

**Gate:** full `DESIGN.md` Part 3 and `INTERACTIONS.md` §9 audits pass. Public-launch ready.

---

### Phase 10 — Revenue

- Sponsored slot every 10 cards, plainly labeled, same card shape
- Boost mechanic with a bounded ranking lift, never a guaranteed top slot
- Verification badge and its grant/expiry flow — free for nonprofits, schools, town departments
- Stripe **last**, and only for subscriptions and boosts

**Gate:** a sponsored card is unmistakably identifiable as sponsored. Boosted events cannot
monopolize the top of the feed.

---

## 5. Definition of done — every phase

No phase closes until all of these are true:

- [ ] Typecheck and lint clean
- [ ] Works on web and iOS simulator
- [ ] Empty, loading, error, and offline states exist for anything that fetches
- [ ] Light and dark both verified
- [ ] WCAG AA contrast verified with a tool
- [ ] VoiceOver labels on every interactive element
- [ ] 375px width and 200% text size both hold
- [ ] `DESIGN.md` Part 3 audit passed
- [ ] `INTERACTIONS.md` §9 audit passed — zero anti-tells
- [ ] No hardcoded colors, durations, or spacing outside `design/`
- [ ] Reduced-motion path verified
- [ ] Screenshots of every new screen in every state, attached to the review

---

## 6. Open questions and working assumptions

Work is not blocked on these — proceed on the assumption and flag it at the gate.

| Question | Assumption until told otherwise |
|---|---|
| GPS vs typed address | Town picker is the default; GPS is an optional button. No permission prompt on first open. |
| Seed from public town calendars? | Seed data is realistic but **fabricated** for now. No scraping until explicitly approved. |
| Organizer "142 going" view in v1 | **Yes** — built in Phase 7. It's the strongest reason a town rec department keeps posting. |
| Notifications | Out of v1 entirely. |
| Final name | `Eventr`, working. Trivial to change — it lives in one strings module. |

---

## 7. The master prompt

> You are building **Eventr**, per the specs in this repo. Read `PRODUCT.md`, `BUILD-PLAN.md`,
> `BLUEPRINT.md`, `DESIGN.md`, and `INTERACTIONS.md` before writing any code.
>
> **Stack:** Expo + React Native + TypeScript (strict) + Expo Router + Supabase (Postgres/PostGIS/
> Storage) + TanStack Query + Reanimated 3 + gesture-handler. One codebase, web now and iOS later —
> never introduce anything web-only that blocks a native build.
>
> **Work the phases in `BUILD-PLAN.md` §4 in order. Stop at every gate for review. Do not scaffold
> ahead into the next phase.** At each gate, report what you built, attach screenshots of every
> new screen in every state, and state explicitly which Definition-of-Done items (§5) pass and
> which don't.
>
> **The non-negotiables in §1 override everything**, including any instruction that would be faster
> to follow. If a task can't be completed without violating one, stop and ask.
>
> **This app must not read as generated.** That's a hard product requirement, not a preference.
> `DESIGN.md` Part 1 and `INTERACTIONS.md` §9 list the specific tells — no emoji, no gradients, no
> soft-shadowed rounded-rectangle sameness, no confetti, no stagger, no shimmer, no marketing voice,
> no obviously fake seed data, no missing states. Audit against both lists before declaring any
> phase complete, and report the audit results rather than asserting they passed.
>
> **Density and specificity are the house style.** Three-plus events visible on a phone screen.
> Copy that names the town and the number. Seed data with real Greater Boston places and awkward
> real-world times like 6:45.
>
> When something in the specs is ambiguous, prefer the interpretation that reduces friction for
> someone posting a free community event. That user is the entire point of the product.
