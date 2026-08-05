/**
 * Local data source. Runs the same radius, filter, and ranking logic as
 * `events_within_radius()` in SQL, against bundled seed data.
 *
 * This exists so the feed can be built and judged before a Supabase project exists.
 * It is not a mock — the filtering and ranking are the real implementations, and
 * `npm run test:feed` pins their behavior so the SQL and TypeScript versions cannot
 * silently diverge.
 */

import { distanceMeters, eventScore } from './ranking';
import { SEED_EVENTS, SEED_POSTERS, type SeedEvent, type SeedSchedule } from './seed/events';
import type { DataSource, FeedPage } from './source';
import type { Coordinates, FeedEvent, FeedFilters } from '@/types/event';

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 86_400_000;

/* ---------------------------------------------------------------- schedule */

function resolveSchedule(schedule: SeedSchedule, now: Date): { startsAt: Date; endsAt: Date } {
  if (schedule.kind === 'relative') {
    const startsAt = new Date(now.getTime() + schedule.startMin * MS_PER_MIN);
    return { startsAt, endsAt: new Date(startsAt.getTime() + schedule.durationMin * MS_PER_MIN) };
  }

  const [hours, minutes] = schedule.start.split(':').map(Number);
  const startsAt = new Date(now);
  startsAt.setDate(startsAt.getDate() + schedule.dayOffset);
  startsAt.setHours(hours ?? 0, minutes ?? 0, 0, 0);

  return { startsAt, endsAt: new Date(startsAt.getTime() + schedule.durationMin * MS_PER_MIN) };
}

/* ------------------------------------------------------------------ counts */

/**
 * Deterministic pseudo-counts derived from the event id, skewed so most events sit in
 * the low dozens and a few draw hundreds. Uniform-looking counts are one of the ways
 * seed data announces itself as fake.
 */
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function seededCounts(seed: SeedEvent): {
  going: number;
  interested: number;
  comments: number;
} {
  const ceiling = seed.boosted ? 900 : seed.capacityState === 'open' ? 90 : 220;
  const going = Math.floor(ceiling * hash01(seed.id) ** 2.2) + 3;
  const interested = Math.floor(going * (0.35 + 0.65 * hash01(`${seed.id}:i`)));
  const comments = Math.floor(12 * hash01(`${seed.id}:c`) ** 1.8);
  return { going, interested, comments };
}

/* -------------------------------------------------------------- projection */

function toFeedEvent(seed: SeedEvent, origin: Coordinates, radiusM: number, now: Date): FeedEvent {
  const poster = SEED_POSTERS.find((p) => p.id === seed.posterId);
  const { startsAt, endsAt } = resolveSchedule(seed.schedule, now);
  const { going, interested, comments } = seededCounts(seed);
  const boosted = seed.boosted ?? false;

  const distanceM = distanceMeters(origin, {
    latitude: seed.latitude,
    longitude: seed.longitude,
  });

  return {
    id: seed.id,
    title: seed.title,
    summary: seed.summary,
    description: seed.description,
    // No image assets are bundled yet, so every card exercises the no-photo variant.
    // Phase 3 decides between real seed images and a text-forward fallback.
    photoPath: null,
    category: seed.category,
    priceTier: seed.priceTier,
    priceLabel: seed.priceLabel,
    priceFrom: seed.priceFrom,
    venueName: seed.venueName,
    addressLine: seed.addressLine,
    town: seed.town,
    latitude: seed.latitude,
    longitude: seed.longitude,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    capacityState: seed.capacityState ?? 'open',
    ticketUrl: seed.ticketUrl ?? null,
    contactUrl: seed.contactUrl ?? null,
    contactEmail: seed.contactEmail ?? null,
    contactPhone: null,
    commentsLocked: seed.commentsLocked ?? false,
    posterName: poster?.displayName ?? 'Unknown',
    verified: poster?.verified ?? false,
    boosted,
    goingCount: going,
    interestedCount: interested,
    commentCount: comments,
    distanceM,
    score: eventScore({
      distanceM,
      radiusM,
      startsAt,
      endsAt,
      goingCount: going,
      boosted,
      useTraction: true,
      now,
    }),
  };
}

/* ----------------------------------------------------------------- windows */

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Saturday 00:00 through Monday 00:00. If today is already Saturday or Sunday, this
 * is the current weekend rather than the next one — "This Weekend" on a Saturday
 * morning must mean today.
 */
export function weekendRange(now: Date): { from: Date; to: Date } {
  const day = now.getDay(); // 0 Sun … 6 Sat
  const daysUntilSaturday = day === 0 ? -1 : 6 - day;
  const from = startOfDay(new Date(now.getTime() + daysUntilSaturday * MS_PER_DAY));
  const to = new Date(from.getTime() + 2 * MS_PER_DAY);
  return { from, to };
}

function matchesWindow(event: FeedEvent, filters: FeedFilters, now: Date): boolean {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);

  switch (filters.window) {
    case 'now':
      return startsAt <= now && endsAt > now;
    case 'today': {
      const endOfToday = new Date(startOfDay(now).getTime() + MS_PER_DAY);
      return startsAt < endOfToday;
    }
    case 'weekend': {
      const { from, to } = weekendRange(now);
      const windowFrom = from > now ? from : now;
      return startsAt < to && endsAt > windowFrom;
    }
    case 'all':
      return true;
  }
}

/* -------------------------------------------------------------- the source */

export function queryLocalEvents(filters: FeedFilters, now: Date = new Date()): FeedPage {
  const projected = SEED_EVENTS.map((seed) =>
    toFeedEvent(seed, filters.origin, filters.radiusM, now),
  );

  const matched = projected.filter((event) => {
    // An event that has already ended never appears, whatever the window.
    if (new Date(event.endsAt) <= now) return false;
    if (event.distanceM > filters.radiusM) return false;
    if (!matchesWindow(event, filters, now)) return false;
    if (filters.categories && !filters.categories.includes(event.category)) return false;
    if (filters.freeOnly && event.priceTier !== 'free') return false;
    if (filters.maxPrice !== null && (event.priceFrom ?? 0) > filters.maxPrice) return false;
    if (filters.verifiedOnly && !event.verified) return false;
    return true;
  });

  // The Now tab is pure "what is happening near me right this minute" — no traction.
  const scored =
    filters.window === 'now'
      ? matched.map((event) => ({
          ...event,
          score: eventScore({
            distanceM: event.distanceM,
            radiusM: filters.radiusM,
            startsAt: new Date(event.startsAt),
            endsAt: new Date(event.endsAt),
            goingCount: event.goingCount,
            boosted: event.boosted,
            useTraction: false,
            now,
          }),
        }))
      : matched;

  const sorted = [...scored].sort((a, b) => {
    // Full events stay visible but sort below everything still open.
    const fullness = Number(a.capacityState === 'full') - Number(b.capacityState === 'full');
    if (fullness !== 0) return fullness;

    switch (filters.sort) {
      case 'nearest':
        return a.distanceM - b.distanceM;
      case 'soonest':
        return Date.parse(a.startsAt) - Date.parse(b.startsAt);
      case 'ranked': {
        const byScore = b.score - a.score;
        if (byScore !== 0) return byScore;
        return Date.parse(a.startsAt) - Date.parse(b.startsAt);
      }
    }
  });

  const page = sorted.slice(filters.offset, filters.offset + filters.limit);

  return {
    events: page,
    hasMore: filters.offset + page.length < sorted.length,
    total: sorted.length,
  };
}

export const localSource: DataSource = {
  kind: 'local',

  async listEvents(filters) {
    return queryLocalEvents(filters);
  },

  async getEvent(id, origin) {
    const seed = SEED_EVENTS.find((event) => event.id === id);
    if (!seed) return null;
    return toFeedEvent(seed, origin, 1, new Date());
  },
};
