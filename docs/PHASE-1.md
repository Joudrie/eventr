# Phase 1 — Data · Gate Report

Per `BUILD-PLAN.md` §4. **Status: complete against a local data source. Two items require a
Supabase project and are deferred, not skipped.**

## The adaptation

Phase 1 assumed a Supabase project would exist. It doesn't yet, so this phase was built against
a local data source sitting behind the interface Supabase will implement:

```
features / queries
        │
        ▼
   DataSource            ← src/data/source.ts, the contract
   ├── LocalSource       ← src/data/local.ts, shipping now
   └── SupabaseSource    ← lands when a project exists
```

**`LocalSource` is not a mock.** The radius filtering, window semantics, price/category/verified
filters, sorting, and ranking are the real implementations, tested and pinned. When Supabase
arrives, `src/data/index.ts` changes and nothing above it does.

**What this costs, honestly:** the ranking formula now exists twice — once in
`supabase/migrations/0002_feed.sql` as `event_score()`, once in `src/data/ranking.ts`. They must
stay in sync. Both files say so at the top, and `npm run test:feed` pins the TypeScript behavior so
a divergence shows up as a failing test rather than a feed that ranks differently depending on
which backend is live. That duplication disappears when the SQL version becomes the only one in
production and the local source becomes a dev fixture.

## Delivered

| Item | Result |
|---|---|
| Full schema migration | `supabase/migrations/0001_init.sql` — 6 tables, 7 enums, constraints, indexes |
| RLS on every table | Written in the same migration as the tables. **Not yet executed.** |
| PostGIS radius RPC | `events_within_radius()` in `0002_feed.sql`, GiST index on `location` |
| Ranking function | `event_score()` in SQL, mirrored in `src/data/ranking.ts` |
| Archive job | `archive_ended_events()`, ends + 2h, with the pg_cron line to schedule it |
| Seed data | 44 events across 17 Greater Boston towns |
| Domain types | `src/types/event.ts`, mirroring the schema until generated types replace it |
| Feed tests | `npm run test:feed` — 23 tests, wired into `npm run verify` |

## Seed data

44 events, 20 posters, 17 towns — Wakefield, Melrose, Stoneham, Reading, Malden, Medford,
Somerville, Saugus, Lynn, Salem, Boston, Winchester, Woburn, Everett, Arlington, Revere, Peabody,
Danvers, and one deliberately out past the radius in Princeton.

These are **fabricated listings placed at real public locations** — real parks, commons, libraries,
and squares, with invented organizers. The file says so at the top. Nothing here claims a real
organization has scheduled anything.

Times are stored as offsets rather than fixed dates, so the feed is populated whenever you open it
and the tests stay deterministic. Start times are 6:45, 7:30, 9:15, 8:30 — not everything at 2:00 PM.
Prices include `Free`, `Free, donations welcome`, `$5 general / $20 sideline`, `$8 / under 6 free`,
and `Whatever you order`, which is the shape a real high school fundraiser actually takes and the
reason price is a label rather than a number.

Deliberate edge cases in the set: two events live *right now*, one full, two filling up, one with a
locked comment thread, one 80-character title, one ~1,900-character description, several with no
description at all, one boosted, and one 42 miles out that proves the radius boundary bites.

**No photos.** There are no bundled image assets, so every card currently exercises the no-photo
variant. Phase 3 has to decide between real seed imagery and a text-forward fallback — the fallback
needs to look like an intentional variant, not a broken card.

## Gate criteria

> *Radius query returns correctly ranked results in under 100ms with seed data. An anonymous key can
> read live events and nothing else — verified by an actual attempt to read pending rows and write to
> events.*

- **Correctly ranked results** — 23 tests pass, covering radius boundaries, the four time windows,
  price/category/verified filters, all three sorts, pagination, and the ranking properties below.
- **Under 100ms** — 0.14 ms per query over 44 events. Not a meaningful number against a real
  Postgres round trip, but the ranking math is not where time will go.
- **RLS verified by attempting a forbidden read** — **cannot be done without a project.** The
  policies are written; nothing has executed them. This is the one gate criterion that is genuinely
  outstanding, and it is the first thing to run once a project exists.

## Ranking properties the tests pin

Two of these are product guarantees, not implementation details:

- **A boost cannot buy the top slot.** A closer, sooner, unboosted event outranks a farther, later,
  boosted one. The boost is a bounded `+0.15`, and the test asserts the ordering directly.
- **Traction is log-dampened and saturates at 100 going.** A 5,000-person event 9 km away loses to
  an 8-person event 400 m away. This is the mechanism that keeps the town farmers market from being
  buried by an arena show — the entire premise in `COMPETITORS.md`.
- The `Now` tab drops the traction term entirely.
- Full events stay visible but sort below everything still open.
- Events that have already ended never appear, in any window.

## Decisions made during the phase

- **`weekend` means Saturday 00:00 to Monday 00:00, and on a Saturday it means today** — not next
  weekend. Implemented identically in SQL and TypeScript, with a test for the Saturday and Sunday
  cases specifically, since that is where an off-by-one would hide.
- **Posters are never readable wholesale.** A blanket read policy on `posters` would expose every
  organizer's email and phone to anyone with the anon key. The feed reads the two public fields
  through the `public_events` view instead.
- **RSVP rows have no select policy.** Counts come from the aggregate view, so one device cannot
  enumerate another's RSVPs.
- **Reports are write-only.** A client can file one and can never read the queue.
- **No anon insert policy on `events`.** Posting has to run through an edge function that owns the
  trust check, or the trust model is just a suggestion.
- **A verified badge must carry an expiry** — enforced by a check constraint, so a badge cannot
  outlive the subscription that paid for it.

## A test that was wrong

The first run failed on an assertion that Wachusett is more than 50 miles from Wakefield. It is
about 42. The code was right and the assumption was wrong, so the test became a boundary check
instead: excluded at 25 miles, included at 50. Worth noting because the fix could have been to
loosen the assertion, which would have deleted the only seed row that proves the radius filter
actually bites.

## Deferred — needs a Supabase project

1. **Executing the migrations.** They are written and reviewed but have never run. Expect the usual
   first-apply friction.
2. **Verifying RLS by attempting forbidden operations** — reading `pending` events and writing to
   `events` with the anon key, and confirming both fail.
3. **Generated TypeScript types** replacing the hand-written `src/types/event.ts`.

None of this blocks Phases 2–4, which are design primitives and the feed UI reading through
`DataSource`.

## Definition of done (`BUILD-PLAN.md` §5)

| | |
|---|---|
| Typecheck and lint clean | pass |
| Works on web and iOS | no UI change this phase; both bundles still build |
| Empty/loading/error states | n/a — `LocalSource` is synchronous; Phase 3 owns these |
| Light and dark verified | n/a — no UI change |
| WCAG AA verified | pass — audit still green |
| VoiceOver labels | n/a — no UI change |
| 375px / 200% text | n/a — no UI change |
| `DESIGN.md` Part 3 audit | pass — seed data names real places, real times, realistic prices |
| `INTERACTIONS.md` §9 audit | n/a — no motion this phase |
| No hardcoded values outside `design/` | pass |
| Reduced motion | n/a |
| Screenshots | n/a — no UI change |

## Next

Phase 2 — Primitives. `Text`, `Button`, `Chip`, `Card`, `Sheet`, `Skeleton`, `Toast`, `EmptyState`,
`ErrorState`, `Badge`, plus a dev gallery rendering every one in every state. No screens. This is
the phase where "does it look generated" is won or lost.
