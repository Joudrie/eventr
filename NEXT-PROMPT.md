# Next Prompt — Identity, Monetization Surface, and Event Sourcing

Copy-paste this as the next instruction. It assumes `PRODUCT.md`, `BUILD-PLAN.md`, `DESIGN.md`,
`INTERACTIONS.md`, and `docs/PHASE-0.md` … `PHASE-4.md` are already in the repo and read.

---

## The prompt

> Three workstreams, in this order. Stop after each for review. Do not start building Phase 5
> (Going / Interested) until these are settled, because two of them change what the feed renders.
>
> ---
>
> ### 1. Color identity — research, then propose
>
> Eventr should feel **warm, inviting, and friendly** — a nice space to spend a minute in. It is a
> community bulletin board, not a utility and not a social network. It needs *a glimmer of
> personality* and nothing more: a drop of color, not a paint bucket.
>
> Research and write `docs/COLOR-STUDY.md` covering:
>
> - **What single-hue brand identities actually do to perception.** Twitter's blue, Spotify's green,
>   and so on. Name what each hue buys and what it costs, with sources, and be specific about the
>   ones that read cold, corporate, or clinical — that is the trap to avoid here.
> - **Warmth without childishness.** The line between "inviting local community" and "kids' app" is
>   mostly saturation, value, and how much area the color covers. Show where that line is.
> - **The current purple + gold**, honestly assessed. It came from a two-year-old Photoshop mock, it
>   is not sacred, and I want to know whether it is actually the right answer or just the incumbent.
>   Purple is uncommon in this category, which is either an advantage or a warning.
> - **Accessibility as a constraint on the palette, not a check afterwards.** Any candidate has to
>   clear WCAG AA in both light and dark before it is a candidate at all.
> - **How little color we can get away with.** The strongest version of this app is probably
>   near-monochrome with one accent doing real work. Make the case for and against.
>
> Then propose **three complete candidate palettes**, each as a full token set matching the shape of
> `src/design/tokens.ts` (page, surface, text, border, brand, accent, danger, both schemes). For each:
> a one-line rationale, the emotional read, and measured contrast for every text/surface pairing.
>
> Render all three by building a comparison route that shows the **real feed** — actual cards, real
> seed events — under each palette, in light and dark, at 375px. Screenshot every combination.
> A palette on a swatch grid tells you nothing; a palette behind forty event cards tells you
> everything. Then recommend one and say why.
>
> **Constraints:** no gradients, no emoji, contrast-checked via `npm run audit:contrast` (extend it
> to run over each candidate). Nothing here overrides `DESIGN.md` Part 1 — the anti-tell list still
> governs.
>
> ---
>
> ### 2. The advertising surface
>
> This is beta, so nothing is charged yet. Build the *surface* and the labeling now, so the
> economics can be switched on later without redesigning the feed.
>
> **Three card types, distinguishable at a glance without reading:**
>
> | Type | Border | What it is |
> |---|---|---|
> | Organic event | none | A normal listing. The default. |
> | Promoted event | gold / accent edge | A real local event whose organizer paid for reach |
> | Paid ad | a third color, clearly not gold | An advertiser with no event — an app install, a shop |
>
> Every non-organic card carries a plain-text `SPONSORED` label. Not a subtle tint, not a tiny
> asterisk — the word, legible, in the label type variant. That is both an FTC expectation and the
> thing that keeps the feed feeling honest.
>
> **Frequency.** I want roughly one ad per seven cards. Before implementing that, research and
> report actual ad-density findings for feed products — where the tolerance cliff is, what the major
> feeds ship, and how density interacts with session length. Write it up in `docs/AD-DENSITY.md`
> with sources, then recommend a number. If 1-in-7 is too aggressive, say so and show why. Also
> answer explicitly: do promoted events and paid ads share one budget, or do they stack? If they
> stack at 1-in-7 each, real density is closer to 1-in-3.5, which is a different app.
>
> **⚠ The promoted-slot conflict — resolve this before building.**
>
> I want promoted events pinned at the top of the feed, per sort. But `BUILD-PLAN.md` §1 and the
> ranking already state that a boost is a *bounded lift that can never guarantee the top slot*, and
> `scripts/test-feed.mts` has a passing test asserting exactly that: a closer, sooner, unboosted
> event outranks a farther, later, boosted one. That test exists because it is the mechanism keeping
> the town farmers market from being buried — the entire argument in `COMPETITORS.md`.
>
> My recommendation, argue for or against it: **put the promoted card in its own slot *above* the
> ranked feed, visually separated and labeled, rather than inside the ranking.** The advertiser gets
> the top of the screen, which is what they are paying for. The ranking stays honest, which is what
> users are paying attention for. Nothing has to be bent, and the existing test keeps passing.
> If you disagree, make the case — but do not quietly weaken the ranking test to make room.
>
> **Also build:** a house-ad slot I can point at my own other apps, so we can see how a real ad unit
> populates and sits in the scroll before selling anyone a slot.
>
> ---
>
> ### 3. Event sourcing from public listings
>
> An empty feed is a dead app, and this is the single highest-leverage thing for launch. Research
> and write `docs/EVENT-SOURCES.md`:
>
> - What public, legitimately usable sources of Greater Boston event listings exist — town
>   recreation departments, public library calendars, municipal sites, open civic data, published
>   feeds and calendar exports. Prefer sources that publish machine-readable formats or that
>   explicitly permit reuse.
> - For each: what it covers, what format it is in, and — stated plainly — what its terms of use
>   actually allow. **Do not include a source whose terms forbid it, and do not scrape anything
>   behind a login or a paywall.** Where the terms are ambiguous, say so rather than assuming.
> - Whether there is a general aggregator API worth using, and what it costs.
>
> Then design (do not yet build) an ingestion pipeline where:
>
> 1. A source is polled for listings.
> 2. Each candidate becomes a `pending` event — the same review queue human posters land in.
> 3. A short description is drafted from the source material, clearly marked as auto-drafted.
> 4. **The source is cited on the event**, with a link back, and the listing is attributed to the
>    originating organization rather than presented as ours.
> 5. Nothing goes live until I approve it by hand.
>
> Attribution and the manual gate are not optional niceties. We are republishing other people's
> listings, and the town rec department we want as a poster later should see us crediting them now.
>
> ---
>
> ### Standing constraints
>
> - Trim fat. There are no profiles, no follows, no likes, no DMs, and there should be no features
>   arriving by the back door either. If something is not in service of scroll → sort → show up, it
>   does not ship.
> - Everything in `DESIGN.md` Part 1 and `INTERACTIONS.md` §9 still applies.
> - Report audit results rather than asserting they passed, and say plainly what you could not
>   verify.

---

## Why the promoted-slot conflict matters

Worth stating outside the prompt too, since it is the one place the new direction and the existing
plan genuinely disagree.

The product's whole differentiator is that we rank by proximity and imminence while Ticketmaster
and Eventbrite rank by revenue. The moment a paid slot can outrank a closer, sooner event *inside
the same list*, that difference stops being true — and it stops being true invisibly, which is
worse, because the feed still looks neutral.

A separated, labeled promoted slot above the feed gets an advertiser everything they actually want
(the top of the screen, guaranteed, on a given sort) and costs nothing that matters. It is also the
version that survives contact with a user who notices — and the ones who notice are the ones who
post.
