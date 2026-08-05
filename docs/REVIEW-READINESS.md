# What a full review needs

Honest inventory of what can be reviewed today, what can't, and what it would take to close the
gap. Written so someone else could pick this up cold.

---

## Reviewable right now

| Review | Scope | How |
|---|---|---|
| **Code review** | All app code, ~40 source files | `/code-review` over the diff, or read `BUILD-PLAN.md` §2–3 first for the conventions |
| **Security review** | The RLS policies and the client surface | `/security-review`. The interesting file is `supabase/migrations/0001_init.sql` |
| **Design audit** | Everything visible | `DESIGN.md` Part 3 and `INTERACTIONS.md` §9 are the checklists; `docs/screenshots/` is the evidence |
| **Product / spec** | The whole concept | `PRODUCT.md`, `COMPETITORS.md`, `BUILD-PLAN.md` |
| **Contrast** | Every text/surface pairing, 6 palettes | `npm run audit:contrast` — already a build gate |
| **Feed logic** | Radius, windows, filters, sorting, ranking | `npm run test:feed`, 24 tests |
| **Formatting** | Time, distance, price, calendar output | `npm run test:format`, 23 tests |

`npm run verify` runs typecheck, lint, format, contrast, and both test suites. It is also the
pre-commit hook, so everything on `main` has passed it.

---

## The five real gaps

### 1. No backend — the biggest one

Roughly half the system has never executed. **RLS is written and has never run.** So has the
ranking SQL, the archive job, and the trust model that decides who can post. `LocalSource` exercises
the *logic*, but the security boundary is entirely untested.

A security review today can read the policies and reason about them. It cannot try to read a
`pending` event with an anon key and watch it fail, which is the only thing that actually proves
them.

**To close:** a Supabase project, apply the two migrations, then run the forbidden-operation checks
from `docs/PHASE-1.md`. Half a day.

### 2. ~~No committed UI test suite~~ — **closed**

`e2e/` now holds **21 Playwright tests** covering the flows every report in `docs/` made claims
about: first run, feed density, the Now tab, the empty state's wording, filters composing and
surviving a town change, Going/Interested including rapid taps and persistence, posting with tags,
date validation, scroll restoration, deep links, and page metadata.

Run with `npm run test:e2e`. Playwright starts the dev server itself.

Two of them encode mistakes that already happened once: the empty state asserts *"Searched 1 mile"*
singular, and the scroll-restoration test only taps cards already on screen, because tapping an
off-screen one makes Playwright scroll the feed and then blame the app.

### 3. ~~Nothing runs on push~~ — **closed**

`.github/workflows/ci.yml` runs three jobs on every push and pull request: `verify` (typecheck,
lint, format, contrast audit, 47 unit tests), the E2E suite, and a production web build that
asserts the export actually produced per-event pages with real titles.

That last job matters because the static export is a different code path from the dev server, and
has hidden real bugs before — the empty `<title>` shipped for days precisely because nothing built
and inspected the export.

### 4. Nothing verified on a real device

Deferred from Phase 0 onward and still open. Every one of these needs a Mac and a phone:

- **60fps** — structurally sound (Reanimated worklets, no `setState` in scroll paths), never measured
- **200% text size** — react-native-web renders in px, so browser zoom does not exercise Dynamic Type
- **Haptics** — the whole map is written and has never fired
- **Native swipe-back and the shared-element transition** — verified on web only
- **Pull-to-refresh** — **known broken on web and Android.** It depends on overscroll bounce, which
  only iOS has. There is currently no way to force a refresh on those platforms.
- **iOS simulator** — the bundle builds; the app has never been run

### 5. No legal or policy surface

No Terms of Service, no privacy policy. Both are needed before real users, and the App Store
requires a privacy label. `PRODUCT.md` §10 has the compliance analysis but nothing is drafted.

Also unwritten: what happens to a reported event, and who reviews the queue.

---

## Unbuilt surfaces

Not gaps in review readiness so much as scope that does not exist yet:

- **Comments** (Phase 8) — schema exists, no UI
- **Moderation console** (Phase 7) — the trust model has no operator interface
- **Ads and promoted slots** (Phase 10 / `NEXT-PROMPT.md` workstream 2)
- **Event sourcing from public listings** (workstream 3)
- **Verification and payments** — Stripe, deliberately last
- **Offline** (Phase 9) — cached feed, queued RSVPs, staleness bar
- **Photos** — no upload, no storage; every card is the text-forward variant

---

## What I would do, in order

1. ~~Commit the E2E suite.~~ Done — 21 tests.
2. ~~Turn on CI.~~ Done — verify, E2E, and a production build check.
3. **Stand up Supabase and prove RLS.** Now the largest untested surface in the project by a wide
   margin. Needs a Supabase project.
4. **Device pass on a Mac.** Closes six deferred items at once, including the one known platform
   bug (pull-to-refresh has no web or Android path).
5. **Draft Terms and a privacy policy.** Blocking for real users, not for review.
