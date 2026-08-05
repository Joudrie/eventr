-- Eventr initial schema.
--
-- Written per BLUEPRINT.md §2. Not yet applied to a project — see docs/PHASE-1.md.
-- RLS lives in the same migration as the tables it protects, per BUILD-PLAN.md §1.

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums

create type poster_trust as enum ('pending', 'trusted', 'banned');
create type event_status as enum ('pending', 'live', 'hidden', 'cancelled', 'archived');
create type capacity_state as enum ('open', 'filling', 'full');
create type price_tier as enum ('free', 'paid');
create type rsvp_kind as enum ('going', 'interested');
create type comment_status as enum ('visible', 'hidden', 'removed');
create type report_target as enum ('event', 'comment');

-- Categories are an enum rather than free text so the filter row can be exhaustive
-- and so a typo can never create a category nobody can find.
create type event_category as enum (
  'music', 'food_drink', 'sports_rec', 'running', 'arts', 'nightlife',
  'family', 'market', 'community', 'fundraiser', 'class_workshop', 'other'
);

-- ---------------------------------------------------------------- devices

-- Anonymous, device-scoped identity. No email, no name, no tracking.
-- This is what lets someone browse and RSVP without an account.
create table devices (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- posters

-- A poster is a contact method we can reach, not an account. Trust attaches here:
-- a poster's first event is reviewed, and every event after that goes live instantly.
create table posters (
  id             uuid primary key default gen_random_uuid(),
  contact_email  text unique,
  contact_phone  text unique,
  display_name   text not null check (length(trim(display_name)) between 2 and 80),
  trust          poster_trust not null default 'pending',
  verified       boolean not null default false,
  verified_until timestamptz,
  created_at     timestamptz not null default now(),

  constraint poster_has_contact check (contact_email is not null or contact_phone is not null),
  -- A verified badge without an expiry would outlive the subscription that paid for it.
  constraint verified_has_expiry check (not verified or verified_until is not null)
);

-- ---------------------------------------------------------------- events

create table events (
  id            uuid primary key default gen_random_uuid(),
  poster_id     uuid not null references posters (id) on delete cascade,

  title         text not null check (length(trim(title)) between 3 and 80),
  summary       text not null check (length(trim(summary)) between 3 and 120),
  description   text check (length(description) <= 2000),
  photo_path    text,

  category      event_category not null,
  -- Free-form tags on top of the fixed category. The category drives the filter row
  -- and has to stay a closed set; tags are how a poster says "sourdough" or "u12" or
  -- "dog friendly" without us inventing a category for each.
  tags          text[] not null default '{}',

  -- Price is a label, not a number: a high school game can be $5 general / $20 front row.
  -- price_from exists only to drive the "under $X" filter.
  price_tier    price_tier not null,
  price_label   text check (length(price_label) <= 60),
  price_from    numeric(8, 2) check (price_from >= 0),

  venue_name    text check (length(venue_name) <= 120),
  address_line  text check (length(address_line) <= 200),
  town          text not null check (length(trim(town)) between 2 and 80),
  postal_code   text check (length(postal_code) <= 12),
  location      geography (point, 4326) not null,

  starts_at     timestamptz not null,
  ends_at       timestamptz not null,

  status         event_status not null default 'pending',
  capacity_state capacity_state not null default 'open',

  -- We never sell tickets. This link sends people to wherever the organizer does.
  ticket_url    text,
  contact_url   text,
  contact_email text,
  contact_phone text,

  boosted_until   timestamptz,
  comments_locked boolean not null default false,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint ends_after_starts check (ends_at > starts_at),
  -- Bounded so a tag list cannot become a keyword-stuffing surface.
  constraint tags_bounded check (
    array_length(tags, 1) is null or array_length(tags, 1) <= 6
  ),
  -- A free event with a price floor is a contradiction the feed's Free filter would expose.
  constraint free_has_no_price check (price_tier = 'paid' or coalesce(price_from, 0) = 0)
);

create index events_location_idx on events using gist (location);
create index events_feed_idx on events (status, starts_at);
create index events_poster_idx on events (poster_id);
-- Partial index: the feed only ever scans live events, which stay a small slice of the table.
create index events_live_window_idx on events (starts_at, ends_at) where status = 'live';

-- ---------------------------------------------------------------- rsvps

-- One stance per device per event, switchable between going and interested.
create table rsvps (
  event_id   uuid not null references events (id) on delete cascade,
  device_id  uuid not null references devices (id) on delete cascade,
  kind       rsvp_kind not null,
  created_at timestamptz not null default now(),
  primary key (event_id, device_id)
);

create index rsvps_event_kind_idx on rsvps (event_id, kind);

-- ---------------------------------------------------------------- comments

create table comments (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events (id) on delete cascade,
  device_id  uuid references devices (id) on delete set null,
  poster_id  uuid references posters (id) on delete set null,
  body       text not null check (length(trim(body)) between 1 and 500),
  is_author  boolean not null default false,
  pinned     boolean not null default false,
  status     comment_status not null default 'visible',
  created_at timestamptz not null default now()
);

create index comments_event_idx on comments (event_id, status, pinned desc, created_at);

-- ---------------------------------------------------------------- reports

create table reports (
  id          uuid primary key default gen_random_uuid(),
  target_type report_target not null,
  target_id   uuid not null,
  device_id   uuid references devices (id) on delete set null,
  reason      text not null check (length(trim(reason)) between 1 and 300),
  created_at  timestamptz not null default now()
);

create index reports_target_idx on reports (target_type, target_id);
-- One report per device per target: a single angry person should not auto-hide an event.
create unique index reports_unique_per_device_idx
  on reports (target_type, target_id, device_id)
  where device_id is not null;

-- ---------------------------------------------------------------- updated_at

create or replace function touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger events_touch_updated_at
  before update on events
  for each row execute function touch_updated_at();

-- ================================================================ RLS
--
-- The anon key ships in the client bundle, so RLS is the only thing protecting this
-- data. Default posture: anonymous users can read live events and visible comments,
-- can insert their own rsvp/comment/report, and can do nothing else. Moderation and
-- anything touching trust runs service-role only.

alter table devices  enable row level security;
alter table posters  enable row level security;
alter table events   enable row level security;
alter table rsvps    enable row level security;
alter table comments enable row level security;
alter table reports  enable row level security;

-- devices: a client may register itself and nothing more. No select policy exists,
-- so device ids are not enumerable even though anyone can create one.
create policy devices_insert_anon on devices
  for insert to anon, authenticated
  with check (true);

-- posters: never readable wholesale — that would expose every organizer's email and
-- phone. The feed reads the handful of public fields through public_events below.
-- No anon policies at all: all poster access is service-role.

-- events: live events only. `pending` (awaiting review), `hidden` (moderated),
-- and `archived` rows stay invisible to the client.
create policy events_select_live on events
  for select to anon, authenticated
  using (status = 'live');

-- Posting goes through an edge function that owns the trust check, so there is
-- deliberately no anon insert policy here.

-- rsvps: counts are exposed through the aggregate view, not by reading rows, so
-- there is no select policy — one device cannot enumerate another's RSVPs.
create policy rsvps_insert_anon on rsvps
  for insert to anon, authenticated
  with check (
    exists (select 1 from events e where e.id = event_id and e.status = 'live')
  );

create policy rsvps_update_own on rsvps
  for update to anon, authenticated
  using (true)
  with check (
    exists (select 1 from events e where e.id = event_id and e.status = 'live')
  );

create policy rsvps_delete_own on rsvps
  for delete to anon, authenticated
  using (true);

-- comments: visible comments on live events.
create policy comments_select_visible on comments
  for select to anon, authenticated
  using (
    status = 'visible'
    and exists (select 1 from events e where e.id = event_id and e.status = 'live')
  );

create policy comments_insert_anon on comments
  for insert to anon, authenticated
  with check (
    is_author = false
    and pinned = false
    and status = 'visible'
    and poster_id is null
    and exists (
      select 1 from events e
      where e.id = event_id and e.status = 'live' and e.comments_locked = false
    )
  );

-- reports: write-only. A client may file one but must never read the queue.
create policy reports_insert_anon on reports
  for insert to anon, authenticated
  with check (true);
