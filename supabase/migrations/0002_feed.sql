-- Eventr feed: aggregate view, ranking, radius query, and the archive job.
--
-- The ranking weights here are mirrored in src/data/ranking.ts. They must stay in
-- sync — see the note in that file. Not yet applied to a project.

-- ---------------------------------------------------------------- public view
--
-- The only shape the client ever sees. Exposes the poster's display name and
-- verified badge while keeping their email and phone unreadable, and folds in the
-- RSVP counts so the feed never needs to read individual rsvp rows.

create or replace view public_events
with (security_invoker = true)
as
select
  e.id,
  e.title,
  e.summary,
  e.description,
  e.photo_path,
  e.category,
  e.price_tier,
  e.price_label,
  e.price_from,
  e.venue_name,
  e.address_line,
  e.town,
  e.postal_code,
  st_y(e.location::geometry) as latitude,
  st_x(e.location::geometry) as longitude,
  e.starts_at,
  e.ends_at,
  e.capacity_state,
  e.ticket_url,
  e.contact_url,
  e.contact_email,
  e.contact_phone,
  e.comments_locked,
  e.created_at,
  p.display_name as poster_name,
  (p.verified and coalesce(p.verified_until, 'epoch'::timestamptz) > now()) as verified,
  (e.boosted_until is not null and e.boosted_until > now()) as boosted,
  coalesce(r.going_count, 0)::int      as going_count,
  coalesce(r.interested_count, 0)::int as interested_count,
  coalesce(c.comment_count, 0)::int    as comment_count
from events e
join posters p on p.id = e.poster_id
left join lateral (
  select
    count(*) filter (where kind = 'going')      as going_count,
    count(*) filter (where kind = 'interested') as interested_count
  from rsvps where event_id = e.id
) r on true
left join lateral (
  select count(*) as comment_count
  from comments where event_id = e.id and status = 'visible'
) c on true
where e.status = 'live';

-- ---------------------------------------------------------------- ranking
--
-- Transparent and explainable, never a black box. Four bounded terms:
--
--   proximity  closer is better, falling off sharply toward the radius edge
--   imminence  starting soon beats starting in three weeks; live now floats up
--   traction   going count, log-dampened so big events cannot bury small ones
--   boost      a paid lift that is bounded and can never guarantee the top slot

create or replace function event_score(
  p_distance_m   double precision,
  p_radius_m     double precision,
  p_starts_at    timestamptz,
  p_ends_at      timestamptz,
  p_going_count  int,
  p_boosted      boolean,
  p_use_traction boolean default true
) returns double precision
language sql
immutable
as $$
  select
    -- proximity, weight 0.35
    0.35 * power(greatest(0, 1 - (p_distance_m / nullif(p_radius_m, 0))), 1.5)
    -- imminence, weight 0.35. A live event scores as if it were starting now.
    + 0.35 * (
        case
          when now() between p_starts_at and p_ends_at then 1.0
          when p_starts_at < now() then 0.0
          else 1.0 / (1.0 + (extract(epoch from (p_starts_at - now())) / 86400.0))
        end
      )
    -- traction, weight 0.20, saturating at 100 going
    + case when p_use_traction
        then 0.20 * least(1.0, ln(1 + greatest(p_going_count, 0)) / ln(101))
        else 0.0
      end
    -- boost, bounded additive lift
    + case when p_boosted then 0.15 else 0.0 end;
$$;

-- ---------------------------------------------------------------- radius query

create type feed_window as enum ('now', 'today', 'weekend', 'all');
create type feed_sort as enum ('ranked', 'nearest', 'soonest');

create or replace function events_within_radius(
  p_lat        double precision,
  p_lng        double precision,
  p_radius_m   double precision,
  p_window     feed_window default 'all',
  p_sort       feed_sort default 'ranked',
  p_categories event_category[] default null,
  p_free_only  boolean default false,
  p_max_price  numeric default null,
  p_verified_only boolean default false,
  p_limit      int default 20,
  p_offset     int default 0
)
returns table (
  id uuid,
  title text,
  summary text,
  description text,
  photo_path text,
  category event_category,
  price_tier price_tier,
  price_label text,
  price_from numeric,
  venue_name text,
  address_line text,
  town text,
  latitude double precision,
  longitude double precision,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity_state capacity_state,
  ticket_url text,
  contact_url text,
  contact_email text,
  contact_phone text,
  comments_locked boolean,
  poster_name text,
  verified boolean,
  boosted boolean,
  going_count int,
  interested_count int,
  comment_count int,
  distance_m double precision,
  score double precision
)
language sql
stable
as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  )
  select
    v.id, v.title, v.summary, v.description, v.photo_path, v.category,
    v.price_tier, v.price_label, v.price_from,
    v.venue_name, v.address_line, v.town, v.latitude, v.longitude,
    v.starts_at, v.ends_at, v.capacity_state,
    v.ticket_url, v.contact_url, v.contact_email, v.contact_phone, v.comments_locked,
    v.poster_name, v.verified, v.boosted,
    v.going_count, v.interested_count, v.comment_count,
    d.distance_m,
    event_score(
      d.distance_m, p_radius_m, v.starts_at, v.ends_at, v.going_count, v.boosted,
      -- The Now tab is pure "what is happening near me right this minute".
      p_window <> 'now'
    ) as score
  from public_events v
  cross join origin o
  cross join lateral (
    select st_distance(
      st_setsrid(st_makepoint(v.longitude, v.latitude), 4326)::geography, o.g
    ) as distance_m
  ) d
  where d.distance_m <= p_radius_m
    -- An event that has already ended never appears, whatever the window.
    and v.ends_at > now()
    and case p_window
      when 'now'   then now() between v.starts_at and v.ends_at
      when 'today' then v.starts_at < date_trunc('day', now()) + interval '1 day'
      -- date_trunc('week') is Monday, so +5d is Saturday 00:00 and +7d is next Monday.
      -- On a Saturday or Sunday this resolves to the current weekend, not the next one:
      -- "This Weekend" tapped on Saturday morning has to mean today.
      -- Mirrored by weekendRange() in src/data/local.ts.
      when 'weekend' then
        v.starts_at < date_trunc('week', now()) + interval '7 days'
        and v.ends_at > greatest(now(), date_trunc('week', now()) + interval '5 days')
      else true
    end
    and (p_categories is null or v.category = any (p_categories))
    and (not p_free_only or v.price_tier = 'free')
    and (p_max_price is null or coalesce(v.price_from, 0) <= p_max_price)
    and (not p_verified_only or v.verified)
  order by
    -- Full events stay visible but sort below everything still open.
    (v.capacity_state = 'full'),
    case when p_sort = 'nearest' then d.distance_m end asc nulls last,
    case when p_sort = 'soonest' then v.starts_at end asc nulls last,
    case when p_sort = 'ranked' then event_score(
      d.distance_m, p_radius_m, v.starts_at, v.ends_at, v.going_count, v.boosted,
      p_window <> 'now'
    ) end desc nulls last,
    v.starts_at asc
  limit greatest(1, least(p_limit, 50))
  offset greatest(0, p_offset);
$$;

-- ---------------------------------------------------------------- archive job
--
-- Events drop out of the feed two hours after they end. Archived rather than
-- deleted: the archive is what proves attendance to a town rec department, and
-- what a personalized feed would eventually learn from.

create or replace function archive_ended_events() returns int
language sql
security definer
set search_path = public
as $$
  with archived as (
    update events
    set status = 'archived'
    where status = 'live' and ends_at < now() - interval '2 hours'
    returning 1
  )
  select count(*)::int from archived;
$$;

-- Schedule once pg_cron is enabled on the project:
--   select cron.schedule('archive-ended-events', '*/15 * * * *', 'select archive_ended_events()');
