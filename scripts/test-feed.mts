/**
 * Feed behavior tests — the Phase 1 gate.
 *
 * Pins radius filtering, window semantics, price and category filters, sorting, and
 * ranking. These run against a fixed `now`, so they are deterministic despite the seed
 * data being scheduled relative to the current time.
 *
 * Run: npm run test:feed
 */

import { queryLocalEvents, weekendRange } from '../src/data/local.ts';
import { distanceMeters, eventScore } from '../src/data/ranking.ts';
import { SEED_ORIGIN } from '../src/data/seed/events.ts';
import { DEFAULT_FILTERS, METERS_PER_MILE, type FeedFilters } from '../src/types/event.ts';

/* ------------------------------------------------------------ tiny harness */

let passed = 0;
const failures: string[] = [];

function check(name: string, run: () => void): void {
  try {
    run();
    passed += 1;
  } catch (error) {
    failures.push(`${name}\n    ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message} — expected ${expected}, got ${actual}`);
}

/* ------------------------------------------------------------------ set-up */

/** A Wednesday at 10:00 local. Mid-week and mid-morning, so no window is degenerate. */
const NOW = new Date(2026, 7, 5, 10, 0, 0, 0);

function filters(overrides: Partial<FeedFilters> = {}): FeedFilters {
  return { ...DEFAULT_FILTERS, origin: SEED_ORIGIN, limit: 100, ...overrides };
}

/* ------------------------------------------------------------------- tests */

check('radius excludes anything beyond it', () => {
  const near = queryLocalEvents(filters({ radiusM: 5 * METERS_PER_MILE }), NOW);
  assert(near.total > 0, 'expected results within 5 miles of Wakefield');
  for (const event of near.events) {
    assert(
      event.distanceM <= 5 * METERS_PER_MILE,
      `${event.title} is ${(event.distanceM / METERS_PER_MILE).toFixed(1)} mi away`,
    );
  }
});

check('a wider radius is a strict superset', () => {
  const tight = queryLocalEvents(filters({ radiusM: 5 * METERS_PER_MILE }), NOW);
  const wide = queryLocalEvents(filters({ radiusM: 50 * METERS_PER_MILE }), NOW);
  assert(wide.total > tight.total, 'widening the radius should find more');

  const wideIds = new Set(wide.events.map((e) => e.id));
  for (const event of tight.events) {
    assert(wideIds.has(event.id), `${event.title} vanished when the radius widened`);
  }
});

check('the far-away seed event sits between the 25 and 50 mile rings', () => {
  // Wachusett is roughly 42 miles from Wakefield, which makes it the seed row that
  // proves the radius boundary actually bites rather than being decorative.
  const at25 = queryLocalEvents(filters({ radiusM: 25 * METERS_PER_MILE }), NOW);
  const at50 = queryLocalEvents(filters({ radiusM: 50 * METERS_PER_MILE }), NOW);

  assert(
    !at25.events.some((e) => e.id === 'e-far-away'),
    'Wachusett should be excluded at 25 miles',
  );
  assert(
    at50.events.some((e) => e.id === 'e-far-away'),
    'Wachusett should be included at 50 miles',
  );
});

check('ended events never appear', () => {
  const all = queryLocalEvents(filters({ radiusM: 60 * METERS_PER_MILE }), NOW);
  for (const event of all.events) {
    assert(new Date(event.endsAt) > NOW, `${event.title} has already ended`);
  }
});

check('the now window returns only events in progress', () => {
  const live = queryLocalEvents(filters({ window: 'now', radiusM: 50 * METERS_PER_MILE }), NOW);
  assert(live.total > 0, 'seed data should always include something live right now');
  for (const event of live.events) {
    assert(
      new Date(event.startsAt) <= NOW && new Date(event.endsAt) > NOW,
      `${event.title} is not actually live`,
    );
  }
});

check('the today window stays within today', () => {
  const today = queryLocalEvents(filters({ window: 'today', radiusM: 50 * METERS_PER_MILE }), NOW);
  const endOfDay = new Date(2026, 7, 6, 0, 0, 0, 0);
  for (const event of today.events) {
    assert(new Date(event.startsAt) < endOfDay, `${event.title} starts after today`);
  }
});

check('weekendRange lands on Saturday and spans two days', () => {
  const { from, to } = weekendRange(NOW);
  assertEqual(from.getDay(), 6, 'weekend should start on a Saturday');
  assertEqual(to.getDay(), 1, 'weekend should end at Monday 00:00');
  assertEqual((to.getTime() - from.getTime()) / 86_400_000, 2, 'weekend should span 2 days');
});

check('weekendRange on a Saturday means today, not next week', () => {
  const saturday = new Date(2026, 7, 8, 9, 0, 0, 0);
  assertEqual(saturday.getDay(), 6, 'fixture should be a Saturday');
  const { from } = weekendRange(saturday);
  assertEqual(from.getDate(), 8, 'Saturday morning should resolve to the current weekend');
});

check('weekendRange on a Sunday means today', () => {
  const sunday = new Date(2026, 7, 9, 9, 0, 0, 0);
  assertEqual(sunday.getDay(), 0, 'fixture should be a Sunday');
  const { from } = weekendRange(sunday);
  assertEqual(from.getDate(), 8, 'Sunday should resolve back to the current weekend');
});

check('free filter excludes every paid event', () => {
  const free = queryLocalEvents(filters({ freeOnly: true, radiusM: 50 * METERS_PER_MILE }), NOW);
  assert(free.total > 0, 'expected free events');
  for (const event of free.events) {
    assertEqual(event.priceTier, 'free', `${event.title} is not free`);
  }
});

check('max price filter respects the floor price', () => {
  const cheap = queryLocalEvents(filters({ maxPrice: 10, radiusM: 50 * METERS_PER_MILE }), NOW);
  for (const event of cheap.events) {
    assert((event.priceFrom ?? 0) <= 10, `${event.title} starts above $10`);
  }
  assert(
    !cheap.events.some((e) => e.id === 'e-melrose-symphony'),
    'a $22 event should not pass a $10 ceiling',
  );
});

check('category filter is exclusive', () => {
  const music = queryLocalEvents(
    filters({ categories: ['music'], radiusM: 50 * METERS_PER_MILE }),
    NOW,
  );
  assert(music.total > 0, 'expected music events');
  for (const event of music.events) {
    assertEqual(event.category, 'music', `${event.title} is not music`);
  }
});

check('verified filter only returns verified organizers', () => {
  const verified = queryLocalEvents(
    filters({ verifiedOnly: true, radiusM: 50 * METERS_PER_MILE }),
    NOW,
  );
  assert(verified.total > 0, 'expected verified events');
  for (const event of verified.events) {
    assert(event.verified, `${event.posterName} is not verified`);
  }
});

check('nearest sort is monotonic by distance', () => {
  const nearest = queryLocalEvents(
    filters({ sort: 'nearest', radiusM: 50 * METERS_PER_MILE }),
    NOW,
  );
  const open = nearest.events.filter((e) => e.capacityState !== 'full');
  for (let i = 1; i < open.length; i += 1) {
    assert(
      open[i]!.distanceM >= open[i - 1]!.distanceM,
      `nearest sort went backwards at ${open[i]!.title}`,
    );
  }
});

check('soonest sort is monotonic by start time', () => {
  const soonest = queryLocalEvents(
    filters({ sort: 'soonest', radiusM: 50 * METERS_PER_MILE }),
    NOW,
  );
  const open = soonest.events.filter((e) => e.capacityState !== 'full');
  for (let i = 1; i < open.length; i += 1) {
    assert(
      Date.parse(open[i]!.startsAt) >= Date.parse(open[i - 1]!.startsAt),
      `soonest sort went backwards at ${open[i]!.title}`,
    );
  }
});

check('ranked sort is monotonic by score', () => {
  const ranked = queryLocalEvents(filters({ sort: 'ranked', radiusM: 50 * METERS_PER_MILE }), NOW);
  const open = ranked.events.filter((e) => e.capacityState !== 'full');
  for (let i = 1; i < open.length; i += 1) {
    assert(open[i]!.score <= open[i - 1]!.score, `ranked sort went backwards at ${open[i]!.title}`);
  }
});

check('full events sort below open ones', () => {
  const ranked = queryLocalEvents(filters({ sort: 'ranked', radiusM: 50 * METERS_PER_MILE }), NOW);
  const firstFull = ranked.events.findIndex((e) => e.capacityState === 'full');
  if (firstFull >= 0) {
    const openAfter = ranked.events.slice(firstFull).filter((e) => e.capacityState !== 'full');
    assertEqual(openAfter.length, 0, 'an open event sorted below a full one');
  }
});

check('a boost cannot beat an event that is both closer and sooner', () => {
  const shared = { radiusM: 10_000, goingCount: 10, useTraction: true, now: NOW };
  const soon = new Date(NOW.getTime() + 3_600_000);
  const later = new Date(NOW.getTime() + 20 * 86_400_000);

  const nearSoon = eventScore({
    ...shared,
    distanceM: 500,
    startsAt: soon,
    endsAt: new Date(soon.getTime() + 3_600_000),
    boosted: false,
  });
  const farLaterBoosted = eventScore({
    ...shared,
    distanceM: 9_500,
    startsAt: later,
    endsAt: new Date(later.getTime() + 3_600_000),
    boosted: true,
  });

  assert(
    nearSoon > farLaterBoosted,
    `a boost bought the top slot: ${farLaterBoosted.toFixed(3)} beat ${nearSoon.toFixed(3)}`,
  );
});

check('traction is dampened so big events cannot bury small ones', () => {
  const shared = {
    radiusM: 10_000,
    startsAt: new Date(NOW.getTime() + 3_600_000),
    endsAt: new Date(NOW.getTime() + 7_200_000),
    boosted: false,
    useTraction: true,
    now: NOW,
  };

  const smallAndClose = eventScore({ ...shared, distanceM: 400, goingCount: 8 });
  const hugeAndFar = eventScore({ ...shared, distanceM: 9_000, goingCount: 5000 });

  assert(
    smallAndClose > hugeAndFar,
    `a 5000-person event buried a local one: ${hugeAndFar.toFixed(3)} vs ${smallAndClose.toFixed(3)}`,
  );
});

check('the now window ignores traction entirely', () => {
  const live = queryLocalEvents(filters({ window: 'now', radiusM: 50 * METERS_PER_MILE }), NOW);
  for (const event of live.events) {
    const withoutTraction = eventScore({
      distanceM: event.distanceM,
      radiusM: 50 * METERS_PER_MILE,
      startsAt: new Date(event.startsAt),
      endsAt: new Date(event.endsAt),
      goingCount: event.goingCount,
      boosted: event.boosted,
      useTraction: false,
      now: NOW,
    });
    assert(
      Math.abs(event.score - withoutTraction) < 1e-9,
      `${event.title} carried a traction term into the Now tab`,
    );
  }
});

check('pagination covers the full set without duplicates', () => {
  const all = queryLocalEvents(filters({ radiusM: 50 * METERS_PER_MILE, limit: 100 }), NOW);
  const seen = new Set<string>();
  let offset = 0;
  let guard = 0;

  for (;;) {
    const page = queryLocalEvents(
      filters({ radiusM: 50 * METERS_PER_MILE, limit: 7, offset }),
      NOW,
    );
    for (const event of page.events) {
      assert(!seen.has(event.id), `${event.title} appeared on two pages`);
      seen.add(event.id);
    }
    if (!page.hasMore) break;
    offset += 7;
    guard += 1;
    assert(guard < 50, 'pagination did not terminate');
  }

  assertEqual(seen.size, all.total, 'paging did not cover every matching event');
});

check('distance math is sane against a known separation', () => {
  // Wakefield center to Boston Common is roughly 11 miles as the crow flies.
  const miles = distanceMeters(SEED_ORIGIN, { latitude: 42.355, longitude: -71.0656 }) / 1609.344;
  assert(miles > 9 && miles < 13, `expected roughly 11 miles, got ${miles.toFixed(1)}`);
});

check('every seed event has a poster and a plausible price shape', () => {
  const all = queryLocalEvents(filters({ radiusM: 200 * METERS_PER_MILE, limit: 100 }), NOW);
  for (const event of all.events) {
    assert(event.posterName !== 'Unknown', `${event.title} references a missing poster`);
    if (event.priceTier === 'free') {
      assert((event.priceFrom ?? 0) === 0, `${event.title} is free but has a price floor`);
    }
    assert(event.summary.length <= 120, `${event.title} has an over-long summary`);
    assert(event.title.length <= 80, `${event.title} has an over-long title`);
  }
});

check('a full event never outranks an open one', () => {
  const ranked = queryLocalEvents(filters({ radiusM: 50 * METERS_PER_MILE }), NOW);
  const firstFull = ranked.events.findIndex((e) => e.capacityState === 'full');
  if (firstFull >= 0) {
    const openAfter = ranked.events.slice(firstFull).filter((e) => e.capacityState !== 'full');
    assertEqual(openAfter.length, 0, 'an open event sorted below a full one');
  }
});

/* ------------------------------------------------------------------ report */

console.log(`feed tests — ${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.error(`\n${failures.map((f) => `  FAIL  ${f}`).join('\n\n')}`);
  process.exit(1);
}
