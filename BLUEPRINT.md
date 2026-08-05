# Eventr — Build Blueprint

Everything needed to build v1 without guessing. Nothing here is built yet.

---

## 0. Decisions locked

| | |
|---|---|
| Name | **Eventr** (working) |
| Launch market | **Greater Boston.** Whole town, all ages, not college-gated. Campus feeds are a later feature, not a launch constraint. |
| Seed community | Wakefield / North Shore, expanding by radius |
| Social graph | **None.** No followers, no likes, no DMs, no profiles. |
| Engagement | Going · Interested · Comments. That is the entire interaction surface. |
| Accounts | Guest by default, device-scoped. An account (just a contact method) is required only to post. |
| Price | Displayed as a **label**, not a number: `Free` · `$5+` · `Paid`. Real tiers live in the detail view. |
| Payments | Never. Outbound links only. |
| Moderation | **Strict.** New poster's first event is human-reviewed. Comments are moderated and author-controllable. |
| Platform | Ships as web now, App Store later, **from one codebase** (see §1) |
| Money | Verification ~$3/mo · cheap per-event boosts · sponsored slots. Posting is always free. |

---

## 1. Stack — and why it doesn't need to be redone later

You said you don't want to build then adjust. That's the single most important constraint here, and
it points at one decision: **Expo (React Native + react-native-web)**.

One codebase produces a real web app you can text someone today, and a real App Store binary later,
with no rewrite. The alternative — build web in Next.js now, rebuild native in Swift in six months —
is exactly the rework you said you want to avoid. This is the no-regret choice.

| Layer | Choice | Why |
|---|---|---|
| App | **Expo / React Native + TypeScript** | Web today, iOS + Android later, one codebase. Not a wrapper — real native. |
| Navigation | **Expo Router** | File-based routes, real URLs on web, real native stacks on device |
| Backend | **Supabase** (Postgres + PostGIS + Storage + Auth) | Radius queries and photo hosting solved by the database. No server to run. |
| Geo | **PostGIS** for radius, **Nominatim/OSM** for address → coordinates | Free, no Google Maps bill |
| Maps | **MapLibre + OSM tiles** | Free, open, no key |
| State | **TanStack Query** | Cache, refetch, offline-ish. No Redux ceremony for a read-heavy feed. |
| Payments (v2) | **Stripe**, for verification subs and boosts only — never event tickets |

**Explicitly not using:** any component library that ships a default look (that's a vibe-coded tell —
see `DESIGN.md`). Components are hand-built against our own tokens.

---

## 2. Data model

```sql
-- anonymous device identity. no email, no name, no tracking.
devices (
  id            uuid primary key,
  created_at    timestamptz default now(),
  last_seen_at  timestamptz
)

-- a poster is a contact method we can reach, not an account
posters (
  id            uuid primary key,
  contact_email text unique,
  contact_phone text unique,
  display_name  text not null,          -- "Wakefield Parks & Rec"
  trust         text not null default 'pending',  -- pending | trusted | banned
  verified      boolean default false,  -- paid/granted blue check
  verified_until timestamptz,
  created_at    timestamptz default now()
)

events (
  id            uuid primary key,
  poster_id     uuid references posters(id),

  title         text not null,          -- <= 80 chars
  summary       text not null,          -- <= 120 chars, the one-liner on the card
  description   text,                   -- <= 2000 chars, the expanded view
  photo_path    text,                   -- supabase storage, optional

  category      text not null,          -- see §3
  price_tier    text not null,          -- free | paid
  price_label   text,                   -- "$5+", "Free", "$10 adults / $5 students"
  price_from    numeric,                -- nullable, for the "under $X" filter only

  venue_name    text,
  address_line  text,
  town          text not null,
  postal_code   text,
  location      geography(point, 4326) not null,   -- PostGIS

  starts_at     timestamptz not null,
  ends_at       timestamptz not null,

  status        text not null default 'pending',   -- pending | live | hidden | cancelled | archived
  capacity_state text default 'open',              -- open | filling | full

  ticket_url    text,                   -- outbound. we never sell.
  contact_url   text,
  contact_email text,
  contact_phone text,

  boosted_until timestamptz,
  comments_locked boolean default false,

  created_at    timestamptz default now()
)
create index on events using gist (location);
create index on events (status, starts_at);

rsvps (
  event_id   uuid references events(id) on delete cascade,
  device_id  uuid references devices(id),
  kind       text not null,             -- going | interested
  created_at timestamptz default now(),
  primary key (event_id, device_id)     -- one stance per device, switchable
)

comments (
  id         uuid primary key,
  event_id   uuid references events(id) on delete cascade,
  device_id  uuid references devices(id),
  poster_id  uuid references posters(id),  -- set when the event author replies
  body       text not null,             -- <= 500 chars
  is_author  boolean default false,
  pinned     boolean default false,     -- author answers auto-pin
  status     text default 'visible',    -- visible | hidden | removed
  created_at timestamptz default now()
)

reports (
  id          uuid primary key,
  target_type text not null,            -- event | comment
  target_id   uuid not null,
  device_id   uuid references devices(id),
  reason      text not null,
  created_at  timestamptz default now()
)
```

**RLS is mandatory on every table.** Anonymous clients can read `live` events and `visible`
comments, insert their own rsvp/comment/report, and nothing else. Moderation writes go through
service-role only.

---

## 3. Categories

`Music` · `Food & Drink` · `Sports & Rec` · `Running` · `Arts` · `Nightlife` · `Family` ·
`Market` · `Community` · `Fundraiser` · `Class or Workshop` · `Other`

One category per event. Multi-select in filters.

---

## 4. Screens

### 4.1 Location gate (first open only)
Not a signup wall. One question: **"Where are you?"** — a town field with autocomplete, plus
"Use my location." Stored locally, changeable from the header forever after. No account, no
permission dialog unless they tap the GPS option.

### 4.2 Feed — the whole product

- Header: wordmark, current town + radius (tap to change)
- Time tabs: **Now** · **Today** · **This Weekend** · **All**
- Sort/filter bar, Facebook Marketplace pattern — horizontal chips that open sheets:
  `Within 10 mi` · `Any price` · `All categories` · `Soonest`
- Infinite list of event cards
- Sponsored card every 10 items, same card shape, labeled `Sponsored` in plain text
- Floating **Post** button

**Card (collapsed):** photo (if any) · title · one-line summary · price label · distance ·
`23 going` · verified check if applicable · capacity chip if `filling`/`full`

### 4.3 Event detail
Full description · date/time · venue + address (tap → Maps) · price tiers in full · contact ·
`Get tickets` outbound button if applicable · **Going / Interested** · comments · Share · Report

### 4.4 Comments
Flat, no threading. Author replies carry an `Organizer` tag and auto-pin to top. Author can
delete any comment on their own event and can lock comments entirely. Rate-limited per device.

### 4.5 Post flow (4 steps, no account first)
1. What & when — title, one-liner, category, date/time
2. Where — address, geocoded to a pin they confirm
3. Details — description, photo, price label, ticket/contact link
4. How we reach you — email or phone → magic link. Then: preview → submit.

First-time posters see: *"First posts are reviewed by a person, usually within a few hours.
After that, your events go up instantly."*

### 4.6 Mine
Device-local. Events you said Going/Interested to, and events you posted (with their status and
a live going count — this is the organizer retention hook).

### 4.7 Moderation console (separate, internal)
Queue of pending events and reported content. Approve / reject / ban. Approving an event
promotes its poster to `trusted`. Simple, fast, keyboard-driven — you'll live in this thing.

---

## 5. Feed ranking

Transparent and explainable, not a black box:

```
score = proximity + imminence + traction + boost
  proximity : closer is better, sharply falls off past the chosen radius
  imminence : starting soon > starting in 3 weeks; anything live now floats up
  traction  : going count, dampened (log) so big events don't bury small ones
  boost     : paid boosts get a bounded lift, never a guaranteed top slot
```

`Now` tab ignores traction entirely — it's pure "what is happening right this minute nearby."

---

## 6. Lifecycle

`pending` → (approved) → `live` → `archived` 2h after `ends_at`.
Poster can set `cancelled`, or `filling` / `full` via their magic link.
Archived events stay queryable — they're what makes the "you go to a lot of live music" signal
possible later, and they prove attendance to a town rec department.

---

## 7. Build phases

| Phase | Deliverable |
|---|---|
| **1** | Supabase schema + RLS + PostGIS radius function. Seeded with ~40 realistic Greater Boston events. |
| **2** | Design tokens and hand-built primitives per `DESIGN.md`. No feature work until this is right. |
| **3** | Feed: location gate, cards, tabs, filter sheets, detail view. Read-only, real data. |
| **4** | Going / Interested, device identity, Mine screen. |
| **5** | Post flow + magic link + moderation console. |
| **6** | Comments with author pinning and locking. |
| **7** | Sponsored slot, boost plumbing, verification badge. Stripe last. |

Ship-to-a-real-person point is after Phase 4.

---

## 8. Explicitly not in v1

Push notifications · accounts with passwords · campus feeds · following · likes · DMs ·
in-app payments for tickets · recommendations/algorithmic personalization · Android polish ·
anything EU/GDPR.

---

## 9. The build prompt

> Build Eventr per `BLUEPRINT.md`, `DESIGN.md`, and `PRODUCT.md` in this repo.
>
> Expo + TypeScript + Expo Router + Supabase (PostGIS) + TanStack Query. One codebase targeting
> web now and iOS later — do not introduce anything web-only that blocks a native build.
>
> Work in the phase order in §7 and stop after each phase for review. Do not scaffold ahead.
>
> Hard requirements:
> - No emoji anywhere in the UI. No component library defaults. No purple gradients.
> - Every list has a real empty state, loading state, and error state before it's considered done.
> - Seed data must be specific and locally plausible — real Greater Boston towns, venues, and
>   organizations, realistic times and prices. Never "Event 1" or lorem ipsum.
> - RLS on every table, written with the schema, not bolted on after.
> - Every screen must be checked at 375px width and against WCAG AA contrast.
> - Read `DESIGN.md` before writing a single component, and self-audit against its checklist
>   before declaring any phase complete.
