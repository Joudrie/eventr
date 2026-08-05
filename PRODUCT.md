# Eventr — Product Definition

**Decided so far:** mobile-first web app · Going + Interested (no downvote) · paid events listed
with outbound links, never in-app payment · first post from a new poster is human-reviewed, then
that poster is trusted forever.


> "You get in the car with a friend. 'What do you wanna do?' 'I'm down for anything.'
> 'Me too.' Forty minutes later you're in a Chick-fil-A parking lot for the thousandth time."

Eventr is the answer to that. A scrollable, sortable feed of everything happening near you
right now — town days, farmers markets, open mics, pickup basketball, a senior class fundraiser
night at Chipotle — so you don't have to scavenge nine separate town Facebook groups to find out
your neighborhood has something going on tonight.

---

## 1. The one-line pitch

**A community bulletin board for local events. Scroll, sort, show up.**

We are not a ticketing platform. We do not process payments for events. We do not take a cut.
We are the place people look when they want to know what's happening.

## 2. What we are not (this matters)

Ticketmaster, Eventbrite, TickPick, and Fever are our reference points for what to *avoid*, not
what to copy. They are transaction platforms — their product is a checkout flow, and their
incentive is to surface whatever earns the highest fee. That structurally buries the free town
farmers market under a $180 arena show.

Eventr's incentive is the opposite: our product is *coverage*. A free event with 11 attendees is
as much a first-class citizen of the feed as a sold-out comedy show. Paid events are listed and
link out to wherever tickets are actually sold — we just never handle the money.

Practical consequences of this stance:
- No in-app checkout, no cart, no fees. Ever.
- No PCI/DSS scope, no payment processor, no chargebacks, no ticketing regulation exposure.
- Sorting **Free** is a first-class filter, not a buried option.
- Zero cost to post. The whole point is the guy with no marketing budget.

## 3. Who it's for

| | |
|---|---|
| **Primary users** | 18–35, all incomes, all backgrounds. People with a free Saturday and no plan. |
| **Secondary** | College students (dense, bored, broke, mobile — the ideal early adopter) |
| **Posters** | Town rec departments, small venues, student orgs, church groups, run clubs, bands, a high school senior class, one guy with a grill |
| **Launch geography** | Greater Boston. Wakefield/North Shore as the seed community, expanding by radius. |
| **Platform** | Mobile-first web app. No install, no App Store review — a link you can text someone. Native wrapper is a later decision, not a launch blocker. |

Deliberately *not* launching nationally. A sparse feed is a dead app. Depth in one metro beats
breadth across fifty.

## 4. Core loop

```
open app  →  see what's near you  →  sort/filter it down  →  tap a card  →  say you're going  →  go
```

No account required to do any of that. Accounts are optional and only unlock: your saved events,
your posts, and a feed that learns what you like.

## 5. The feed

The feed is the whole product. Everything else is in service of it.

### 5.1 Card anatomy (collapsed)

Matching the mockup:

- **Photo** (optional, left) — square thumbnail
- **Title** — "Boston Museum Night"
- **One-sentence description** — the hook, nothing more
- **Price** — rendered big and loud. `$0` is a feature, not an absence.
- **Verified badge** — blue check, top-right, if verified
- **Distance** — "2 miles away"
- **Interest count** — how many people are going

### 5.2 Card expanded (on tap)

- Full description — a paragraph or two
- Date, start/end time
- Venue name + address, tap to open in Maps
- Contact — link, email, phone, or socials
- "Get tickets" outbound link if paid (we send you elsewhere; we don't sell)
- **Going** / **Interested**
- Share
- Report

### 5.2a Going vs Interested

Two levels of commitment, both public counts:

- **Going** — committed. This is the headline number on the card ("55 going").
- **Interested** — saved for later, might show up. Shown secondary ("+18 interested").

There is no "not going." A downvote adds nothing to someone deciding where to spend their
Saturday and invites pile-ons on small community posts. Interested doubles as the bookmark —
tapping it saves the event to your list.

### 5.3 Sorting and filtering

Sorting is the second half of the product. Suggested surface:

| Control | Options |
|---|---|
| **Radius** | 1 / 5 / 10 / 25 / 50 miles |
| **When** | Live now · Today · This weekend · This week · This month |
| **Price** | All · Free only · Under $X |
| **Category** | Music · Food · Sports/Rec · Running · Arts · Nightlife · Family · Market · Community · Campus |
| **Sort by** | Nearest · Soonest · Most popular |

**Live Now** is the flagship tab — the "I'm in the car right now, what is happening" answer.

### 5.4 Lifecycle

Every event carries a status and ages out on its own so the feed never rots:

- `upcoming` — normal
- `live` — start time passed, end time hasn't
- `filling up` — poster-set, or auto-set when interest approaches capacity
- `full` — poster-set; stays visible but greyed, deprioritized in sort
- `ended` → moves to **Archive** shortly after end time. Not deleted — archives feed the
  "you go to a lot of live music" signal and prove to a town that people showed up.
- `cancelled` — poster-set, shown struck through until end time passes

## 6. Posting

Anyone can post. That's the premise and also the hardest problem.

The tension: gating every post behind manual review kills the "the senior class is at Chipotle
*tonight*" use case, which is exactly the kind of post that makes this app feel alive. But a
totally open Yik Yak-style firehose invites spam, harassment, and fake events.

**Resolution — trust the poster, not the post.**

A poster's *first* event goes into a human review queue. Once you've approved that poster, every
event they submit afterward goes live instantly. So the town rec department and the run club and
the senior class get reviewed exactly once, then never again — while a brand-new spammer never
reaches the feed at all.

| Tier | How you get it | What it looks like |
|---|---|---|
| **Pending** | New poster's first submission | Not in the feed. Visible only to the poster and the review queue. |
| **Trusted** | Their first event was approved | Posts go live instantly, forever after. Plain card. |
| **Verified organizer** | Business/org proves identity — free for nonprofits, town depts, schools; paid for businesses (the Twitter model) | Blue check, as in the mockup |

This keeps same-day posting alive for everyone who has ever posted before, which after a few
weeks is nearly everyone who matters. The cost is that a genuinely new poster with a
tonight-only event waits on review — so the queue needs to be fast, and the poster should see an
honest "usually reviewed within a few hours" message rather than silence.

Trust is revocable: enough reports and a poster drops back to pending, with all their live
events hidden.

Anti-abuse without accounts:
- Post via an email or phone number → we send a magic link that lets you edit/cancel your event.
  Not an account, just proof you can be reached. Trust attaches to that contact.
- Rate limit per contact and per device.
- N reports → auto-hidden pending human review.

## 7. Making money

Three lines, in the order we'd turn them on:

1. **Ad slots in the feed.** A small banner card every ~10 scrolls, styled to sit inside the feed
   rather than interrupt it. Because the feed is *already* a list of things to go do, an ad for a
   local business reads as content, not intrusion. Labeled as sponsored — always.
2. **Paid verification.** Businesses pay for the blue check. Nonprofits, schools, town
   departments get it free — that's both good ethics and good supply.
3. **Aggregate trend data.** "Sports events in this metro are booking out; food events aren't."
   Anonymized and aggregated only — counts and categories, never individual users' movement
   histories. Selling personal location data is a different, much uglier business with real legal
   exposure, and it's not necessary for the insight to be valuable.

## 8. Universities

A dedicated campus surface. Pick a school, get a feed scoped to that campus and its immediate
radius. Student orgs post directly. This is the highest-density, lowest-CAC user base we have,
and colleges already have the "there is definitely something happening tonight and I have no idea
what" problem in its purest form.

## 9. Brand

From the mockups:

- **Purple** — dominant background (`#7B2FF2`-ish)
- **Golden yellow** — logo, accents, prices
- **Hot air balloon** — mark. Reads as going somewhere, lighthearted, community.
- Bold, chunky, high-contrast type. Big prices. Not a corporate SaaS look.

Voice: casual, local, a little funny. Never marketing-speak.

## 10. Compliance posture at this scale

From the handwritten regulatory list, filtered to what actually applies to a free, no-payments,
Boston-only app:

| Item | Status |
|---|---|
| GDPR | Out of scope for now — US-only launch. Revisit before any EU availability. |
| PCI DSS | **N/A by design** — we never touch payments. This is a real strategic win. |
| COPPA | Applies. Set 13+ minimum, don't knowingly collect from under-13. |
| WCAG / accessibility | Do it from day one. Contrast on purple-on-yellow needs checking. |
| Ad labeling | Sponsored cards must be visibly labeled. Non-negotiable. |
| IP / photos | Poster warrants they have rights to the image. Takedown process. |
| Anti-spam (CAN-SPAM/TCPA) | Explicit opt-in before any notification or email. |
| Alcohol / licensing | We're a listing service, not an organizer — but don't promote unlicensed alcohol events. |
| US state privacy law | MA has no comprehensive law yet; CA/CO/CT etc. matter if we expand. Aggregate-only data policy keeps us clean. |
| Terms of Service | Needed before public launch. Keep it short and readable. |

## 11. Honest risks

- **Cold start.** An empty feed is a dead app. Seeding matters more than any feature — Boston has
  public sources (town rec calendars, library events, campus calendars) that can bootstrap real
  listings before a single user posts.
- **Supply, not demand.** People want to browse. Fewer want to post. Every design decision should
  reduce posting friction.
- **Moderation cost.** Manual review is fine at 50 events/week and impossible at 5,000. The badge
  model above is what makes that scale survivable.
- **The two-sided chicken/egg** — solved geographically. One town at a time, fully covered.

---

*This document is the concept of record. Open questions live in `OPEN-QUESTIONS.md`.*
