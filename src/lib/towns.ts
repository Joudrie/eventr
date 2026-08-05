/**
 * Greater Boston towns available in the location picker.
 *
 * Typing a town is the default path; GPS is an optional button. That keeps first open
 * free of a permission dialog, and storing a town instead of raw coordinates is a much
 * cleaner privacy position than holding a location history we have no use for.
 *
 * Coordinates are approximate town centers.
 */

import type { Coordinates } from '@/types/event';

export type Town = Coordinates & {
  readonly name: string;
  readonly state: string;
};

export const TOWNS: readonly Town[] = [
  { name: 'Wakefield', state: 'MA', latitude: 42.5065, longitude: -71.0723 },
  { name: 'Melrose', state: 'MA', latitude: 42.4584, longitude: -71.0662 },
  { name: 'Stoneham', state: 'MA', latitude: 42.4801, longitude: -71.0995 },
  { name: 'Reading', state: 'MA', latitude: 42.5254, longitude: -71.0956 },
  { name: 'North Reading', state: 'MA', latitude: 42.5754, longitude: -71.0787 },
  { name: 'Lynnfield', state: 'MA', latitude: 42.5395, longitude: -71.0451 },
  { name: 'Saugus', state: 'MA', latitude: 42.4654, longitude: -71.0101 },
  { name: 'Malden', state: 'MA', latitude: 42.4251, longitude: -71.0662 },
  { name: 'Medford', state: 'MA', latitude: 42.4184, longitude: -71.1062 },
  { name: 'Everett', state: 'MA', latitude: 42.4084, longitude: -71.0537 },
  { name: 'Somerville', state: 'MA', latitude: 42.3876, longitude: -71.0995 },
  { name: 'Cambridge', state: 'MA', latitude: 42.3736, longitude: -71.1097 },
  { name: 'Arlington', state: 'MA', latitude: 42.4154, longitude: -71.1565 },
  { name: 'Winchester', state: 'MA', latitude: 42.4523, longitude: -71.137 },
  { name: 'Woburn', state: 'MA', latitude: 42.4793, longitude: -71.1523 },
  { name: 'Revere', state: 'MA', latitude: 42.4084, longitude: -70.9925 },
  { name: 'Lynn', state: 'MA', latitude: 42.4668, longitude: -70.9495 },
  { name: 'Peabody', state: 'MA', latitude: 42.5279, longitude: -70.9287 },
  { name: 'Salem', state: 'MA', latitude: 42.5195, longitude: -70.8967 },
  { name: 'Danvers', state: 'MA', latitude: 42.5751, longitude: -70.93 },
  { name: 'Beverly', state: 'MA', latitude: 42.5584, longitude: -70.88 },
  { name: 'Boston', state: 'MA', latitude: 42.3601, longitude: -71.0589 },
];

export const DEFAULT_TOWN: Town = TOWNS[0]!;

export function searchTowns(query: string): readonly Town[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return TOWNS;
  // Prefix matches first — typing "me" should surface Melrose and Medford above
  // Somerville, which merely contains the letters.
  const prefix = TOWNS.filter((town) => town.name.toLowerCase().startsWith(trimmed));
  const contains = TOWNS.filter(
    (town) => !prefix.includes(town) && town.name.toLowerCase().includes(trimmed),
  );
  return [...prefix, ...contains];
}

/** Nearest known town to a coordinate, for labelling a GPS fix. */
export function nearestTown(point: Coordinates): Town {
  let best = DEFAULT_TOWN;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const town of TOWNS) {
    const dLat = town.latitude - point.latitude;
    const dLng = town.longitude - point.longitude;
    const squared = dLat * dLat + dLng * dLng;
    if (squared < bestDistance) {
      bestDistance = squared;
      best = town;
    }
  }
  return best;
}
