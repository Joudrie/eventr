/**
 * Feed ranking and distance math.
 *
 * ⚠ This mirrors `event_score()` in supabase/migrations/0002_feed.sql. The two
 * implementations must stay in sync — the local data source uses this one, and the
 * Supabase source will use the SQL one. `npm run test:feed` pins the behavior so a
 * change to either side without the other shows up as a failing test rather than as
 * a feed that quietly ranks differently depending on the backend.
 */

import type { Coordinates } from '@/types/event';

/** Weights sum to 1.0 before the boost, which is a bounded lift on top. */
export const RANKING = {
  proximityWeight: 0.35,
  /** >1 makes proximity fall off sharply toward the radius edge rather than linearly. */
  proximityFalloff: 1.5,
  imminenceWeight: 0.35,
  tractionWeight: 0.2,
  /** Traction saturates here so a 900-person festival cannot bury a 12-person run club. */
  tractionSaturation: 100,
  /** Bounded: a boost lifts an event, it never guarantees the top slot. */
  boostLift: 0.15,
} as const;

const EARTH_RADIUS_M = 6371008.8;
const MS_PER_DAY = 86_400_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine. PostGIS uses a spheroid, which differs by roughly 0.3% at these
 * distances — irrelevant against a radius the user picked from a 1/5/10/25/50 list.
 */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function proximityTerm(distanceM: number, radiusM: number): number {
  if (radiusM <= 0) return 0;
  const closeness = Math.max(0, 1 - distanceM / radiusM);
  return RANKING.proximityWeight * closeness ** RANKING.proximityFalloff;
}

export function imminenceTerm(startsAt: Date, endsAt: Date, now: Date): number {
  const nowMs = now.getTime();
  // Live right now scores as if it were starting this second — that is the whole
  // point of the Now tab, and it should float up in the other tabs too.
  if (nowMs >= startsAt.getTime() && nowMs <= endsAt.getTime()) {
    return RANKING.imminenceWeight;
  }
  if (startsAt.getTime() < nowMs) return 0;

  const daysAway = (startsAt.getTime() - nowMs) / MS_PER_DAY;
  return RANKING.imminenceWeight * (1 / (1 + daysAway));
}

export function tractionTerm(goingCount: number): number {
  const capped = Math.max(0, goingCount);
  const damped = Math.log(1 + capped) / Math.log(1 + RANKING.tractionSaturation);
  return RANKING.tractionWeight * Math.min(1, damped);
}

export function boostTerm(boosted: boolean): number {
  return boosted ? RANKING.boostLift : 0;
}

export function eventScore(input: {
  distanceM: number;
  radiusM: number;
  startsAt: Date;
  endsAt: Date;
  goingCount: number;
  boosted: boolean;
  /** The Now tab ignores traction entirely. */
  useTraction: boolean;
  now: Date;
}): number {
  return (
    proximityTerm(input.distanceM, input.radiusM) +
    imminenceTerm(input.startsAt, input.endsAt, input.now) +
    (input.useTraction ? tractionTerm(input.goingCount) : 0) +
    boostTerm(input.boosted)
  );
}
