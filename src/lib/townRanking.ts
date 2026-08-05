/**
 * What order to offer towns in.
 *
 * Alphabetical is the wrong answer and distance alone is nearly as wrong. Someone in
 * Wakefield deciding where to go tonight is choosing between "twenty minutes to Boston,
 * where something is always on" and "four minutes to Melrose, where there might be one
 * thing". Both are real answers, and a list sorted purely by distance buries the first
 * one under a dozen towns that have nothing happening.
 *
 * So the order is a mix of how close a town is and how much is actually going on there,
 * with a deliberate thumb on the scale for the immediate neighbours — the places you
 * would drive to without thinking about it.
 *
 * The density half is measured, not assumed. It counts real events in the feed rather
 * than carrying a hand-written table of which towns are lively, which would be a guess
 * that silently rots as the data changes and would be wrong the moment the app covers
 * anywhere outside Greater Boston.
 */

import type { Coordinates } from '@/types/event';
import type { Town } from './towns';

export const TOWN_RANKING = {
  /** How much of the score is "can I be there quickly". */
  proximityWeight: 0.5,
  /** How much is "is anything actually happening". */
  densityWeight: 0.5,
  /**
   * Distance at which proximity has decayed to nothing. Beyond an hour's drive the
   * difference between 55 and 60 miles stops mattering to the decision.
   */
  proximityRangeM: 50 * 1609.344,
  /**
   * Anywhere this close counts as next door and gets the full neighbour bonus, which
   * then tapers to zero at twice the radius. This is the "town next-door that has
   * stuff" thumb on the scale.
   */
  neighbourRadiusM: 4 * 1609.344,
  neighbourBonus: 0.15,
  /**
   * Event counts saturate here. Without it a city with 300 listings would dominate
   * every list from every origin, and the whole point of a hyperlocal app is that it
   * does not just funnel everyone into the nearest city.
   */
  densitySaturation: 25,
} as const;

const EARTH_RADIUS_M = 6371008.8;

function distanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 1 next door, 0 at the edge of range, falling off faster than linearly. */
function proximityTerm(distanceM: number): number {
  const ratio = Math.min(1, distanceM / TOWN_RANKING.proximityRangeM);
  return TOWN_RANKING.proximityWeight * (1 - ratio) ** 1.5;
}

/**
 * Log-damped, so twenty events beats five convincingly but two hundred does not beat
 * twenty by forty times. The same shape the feed uses for going counts, for the same
 * reason: raw counts let one big thing flatten everything else.
 */
function densityTerm(eventCount: number): number {
  const capped = Math.max(0, eventCount);
  const damped = Math.log(1 + capped) / Math.log(1 + TOWN_RANKING.densitySaturation);
  return TOWN_RANKING.densityWeight * Math.min(1, damped);
}

/** Full bonus next door, tapering to nothing at twice the neighbour radius. */
function neighbourTerm(distanceM: number): number {
  const outer = TOWN_RANKING.neighbourRadiusM * 2;
  if (distanceM >= outer) return 0;
  if (distanceM <= TOWN_RANKING.neighbourRadiusM) return TOWN_RANKING.neighbourBonus;
  const falloff = (outer - distanceM) / TOWN_RANKING.neighbourRadiusM;
  return TOWN_RANKING.neighbourBonus * falloff;
}

export function townScore(distanceM: number, eventCount: number): number {
  return proximityTerm(distanceM) + densityTerm(eventCount) + neighbourTerm(distanceM);
}

export type RankedTown = {
  readonly town: Town;
  readonly distanceM: number;
  readonly eventCount: number;
  readonly score: number;
};

/**
 * Orders towns for the picker. `countEventsIn` is passed in rather than imported so this
 * stays a pure function of its inputs and can be tested without a data source.
 */
export function rankTowns(
  towns: readonly Town[],
  origin: Coordinates,
  countEventsIn: (town: Town) => number,
): readonly RankedTown[] {
  return towns
    .map((town) => {
      const distanceM = distanceMeters(origin, town);
      const eventCount = countEventsIn(town);
      return { town, distanceM, eventCount, score: townScore(distanceM, eventCount) };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Ties break on distance, then name, so the order is never arbitrary.
      if (a.distanceM !== b.distanceM) return a.distanceM - b.distanceM;
      return a.town.name.localeCompare(b.town.name);
    });
}
